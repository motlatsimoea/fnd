from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework import status
from .models import Post, Comment, Like, Media
from notifications.models import Notification
from .serializers import *
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils.text import get_valid_filename
from notifications.utils import send_notification
from django.db.models import Prefetch
from django.contrib.auth import get_user_model
import re, json
from .utils import extract_text
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

User = get_user_model()
mention_regex = r'(?<!\w)@(\w+)'
hashtag_regex = r'#(\w+)'


class PostView(APIView):
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    
    def get(self, request):
        hashtag_name = request.query_params.get("hashtag")

        posts = Post.objects.select_related("author").prefetch_related(
            "hashtags",
            "media",
            "likes",
            Prefetch("comments", queryset=Comment.objects.select_related("author"))
        ).order_by("-created_at")

        if hashtag_name:
            posts = posts.filter(
                hashtags__name__iexact=hashtag_name.lower()
            ).distinct()

        serializer = PostSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


    # =========================
    # CREATE POST
    # =========================
    def post(self, request):
        title = request.data.get("title")
        content = request.data.get("content")
        media_files = request.FILES.getlist("media_files") or []

        if not title or not content:
            return Response(
                {"detail": "Title and content are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ALLOWED_TYPES = ["image/jpeg", "image/png", "video/mp4"]
        MAX_FILE_SIZE_MB = 5
        MAX_MEDIA_COUNT = 4

        if len(media_files) > MAX_MEDIA_COUNT:
            return Response(
                {"detail": f"Maximum of {MAX_MEDIA_COUNT} files allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for media_file in media_files:
            if media_file.content_type not in ALLOWED_TYPES:
                return Response(
                    {"detail": f"Unsupported file type: {media_file.content_type}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if media_file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
                return Response(
                    {"detail": f"{media_file.name} exceeds max file size of {MAX_FILE_SIZE_MB}MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            with transaction.atomic():

                post = Post.objects.create(
                    title=title,
                    content=content,
                    author=request.user,
                )

                # -------- Parse Lexical JSON --------
                try:
                    parsed = json.loads(content)
                except Exception:
                    parsed = {}

                plain_text = extract_text(parsed.get("root", {}))

                # =====================================
                # HASHTAGS (Backend Controlled)
                # =====================================
                hashtag_names = set(re.findall(hashtag_regex, plain_text))

                for tag in hashtag_names:
                    tag = tag.lower().strip()
                    if not tag:
                        continue

                    hashtag, _ = Hashtag.objects.get_or_create(name=tag)
                    hashtag.usage_count += 1
                    hashtag.save()
                    post.hashtags.add(hashtag)

                # -------- MEDIA --------
                for media_file in media_files:
                    media_file.name = get_valid_filename(media_file.name)
                    Media.objects.create(post=post, file=media_file)

                # =====================================
                # MENTIONS
                # =====================================
                mentioned_usernames = set(re.findall(mention_regex, plain_text))

                for username in mentioned_usernames:
                    try:
                        mentioned_user = User.objects.get(username=username)

                        if mentioned_user != request.user:
                            send_notification(
                                user=mentioned_user,
                                sender=request.user,
                                notification_type="mention",
                                post=post,
                                message=f"{request.user.username} mentioned you in a post.",
                            )

                    except User.DoesNotExist:
                        continue

                serialized_post = PostSerializer(post, context={"request": request})
                return Response(serialized_post.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"detail": "An error occurred while saving the post.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


    

class HashtagListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.GET.get("q", "").lower()

        hashtags = Hashtag.objects.filter(
            name__istartswith=query
        ).order_by('-usage_count')[:10]

        serializer = HashtagSerializer(hashtags, many=True)
        return Response(serializer.data)
    
    


class PostDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
            serializer = PostSerializer(post, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
        
    # =========================
    # UPDATE POST
    # =========================
    def put(self, request, post_id):

        try:
            post = Post.objects.get(id=post_id, author=request.user)

        except Post.DoesNotExist:
            return Response(
                {
                    "detail": "Post not found or you are not the author."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # =====================================
        # CONFIGURATION
        # =====================================

        ALLOWED_TYPES = ["image/jpeg", "image/png", "video/mp4"]
        MAX_FILE_SIZE_MB = 5
        MAX_MEDIA_FILES = 4

        # =====================================
        # MEDIA REQUEST DATA
        # =====================================

        sync_media = (
            str(request.data.get("sync_media", "false")).lower() == "true"
        )

        existing_media_ids = (request.data.getlist("existing_media_ids[]", []))

        new_media_files = (request.FILES.getlist("media_files", []))

        # Only allow retained media that
        # actually belongs to this post.
        valid_existing_media_ids = list(
            post.media.filter(id__in=existing_media_ids).values_list(
                "id",
                flat=True,
            )
        )

        # =====================================
        # VALIDATE MEDIA
        # =====================================

        if sync_media:

            total_media_count = (
                len(
                    valid_existing_media_ids
                )
                + len(new_media_files)
            )

            if (total_media_count > MAX_MEDIA_FILES):
                return Response(
                    {
                        "detail": (
                            f"A post can contain a maximum "
                            f"of {MAX_MEDIA_FILES} media "
                            f"files."
                        )
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            for media_file in new_media_files:

                if (media_file.content_type not in ALLOWED_TYPES):
                    return Response(
                        {
                            "detail": (
                                f"Unsupported media type "
                                f"for {media_file.name}: "
                                f"{media_file.content_type}"
                            )
                        },
                        status=(
                            status.HTTP_400_BAD_REQUEST
                        ),
                    )

                max_file_size_bytes = (
                    MAX_FILE_SIZE_MB 
                    * 1024 * 1024
                )

                if (media_file.size > max_file_size_bytes):
                    return Response(
                        {
                            "detail": (
                                f"{media_file.name} exceeds "
                                f"the {MAX_FILE_SIZE_MB} MB "
                                f"limit."
                            )
                        },
                        status=(
                            status.HTTP_400_BAD_REQUEST
                        ),
                    )

        # =====================================
        # CLEAN SERIALIZER DATA
        # =====================================

        serializer_data = (request.data.copy())

        serializer_data.pop("existing_media_ids[]", None)
        serializer_data.pop("media_files", None)
        serializer_data.pop("sync_media",  None)
            
    
        serializer = PostSerializer(post, data=serializer_data, 
                                    partial=True, 
                                    context={"request": request},)

        if not serializer.is_valid():
            return Response(
                {
                    "detail": (
                        "Invalid update data."
                    ),
                    "errors": (
                        serializer.errors
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        try:
            with transaction.atomic():

                # Save title and content first.
                post = serializer.save()

                # =====================================
                # SYNCHRONIZE MEDIA
                # =====================================

                if sync_media:

                    # Delete media that was not
                    # retained by the frontend.
                    post.media.exclude(id__in=(valid_existing_media_ids)).delete()

                    # Add new uploaded media.
                    for (media_file) in new_media_files:
                        
                        media_file.name = ( get_valid_filename(media_file.name))

                        Media.objects.create(post=post, file=media_file)

                # =====================================
                # CONTENT PROCESSING
                # =====================================

                content = request.data.get("content", post.content)

                try:
                    if isinstance(content, str):
                        parsed = json.loads(content)

                    elif isinstance(content, dict):
                        parsed = content

                    else:
                        parsed = {}

                except (json.JSONDecodeError, TypeError):
                    parsed = {}

                plain_text = extract_text(parsed.get("root", {}))

                # =====================================
                # HASHTAGS
                # =====================================

                old_hashtag_names = set(
                    post.hashtags.values_list(
                        "name",
                        flat=True,
                    )
                )

                new_hashtag_names = {
                    tag.lower().strip()
                    for tag in re.findall(
                        hashtag_regex,
                        plain_text,
                    )
                    if tag.strip()
                }

                added_hashtags = (
                    new_hashtag_names
                    - old_hashtag_names
                )

                removed_hashtags = (
                    old_hashtag_names
                    - new_hashtag_names
                )

                # Decrease usage count for
                # hashtags removed from the post.
                for (tag_name) in removed_hashtags:

                    try:
                        hashtag = (Hashtag.objects.get(name=tag_name))

                    except (Hashtag.DoesNotExist):
                        continue

                    hashtag.usage_count = max(0, hashtag.usage_count - 1,)

                    hashtag.save(update_fields=["usage_count"])

                # Increase usage count only
                # for newly added hashtags.
                for (tag_name) in added_hashtags:

                    hashtag, created = (Hashtag.objects.get_or_create(name=tag_name))

                    hashtag.usage_count += 1

                    hashtag.save(update_fields=["usage_count"])

                # Replace the post's hashtag
                # relationship with the new set.
                updated_hashtags = (Hashtag.objects.filter(name__in=(new_hashtag_names)))

                post.hashtags.set(updated_hashtags)

                # =====================================
                # MENTIONS
                # =====================================

                new_mentions = set(re.findall(mention_regex, plain_text))

                
                # Without a stored previous-mentions
                # relationship, it is not possible to
                # reliably determine which mentions
                # were newly added.
                # The following keeps the current
                # behaviour and sends notifications
                # for mentions found in the updated
                # content.
            

                for username in new_mentions:

                    try:
                        mentioned_user = (User.objects.get(username=username))

                    except User.DoesNotExist:
                        continue

                    if (mentioned_user == request.user):
                        continue

                    send_notification(
                        user=mentioned_user,
                        sender=request.user,
                        notification_type=(
                            "mention"
                        ),
                        post=post,
                        message=(
                            f"{request.user.username} "
                            f"mentioned you in a post."
                        ),
                    )

            updated_post = (Post.objects.select_related("author").prefetch_related(
                    "media",
                    "hashtags",
                ).get(id=post.id)
            )

            return Response(PostSerializer(
                    updated_post,
                    context={
                        "request": request
                    },
                ).data,
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            return Response(
                {
                    "detail": (
                        "An error occurred while "
                        "updating the post."
                    ),
                    "error": str(error),
                },
                status=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
            )

    def delete(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
            if post.author != request.user:
                return Response({'detail': 'Not authorized to delete this post.'}, status=status.HTTP_403_FORBIDDEN)
            
            post.delete()
            return Response({'detail': 'Post deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
        



class LikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)

        like, created = Like.objects.get_or_create(
            post=post,
            user=request.user
        )

        # If already liked → unlike
        if not created:
            like.delete()
            return Response(
                {
                    "message": "Post unliked successfully.",
                    "postId": post.id,
                    "liked": False,
                    "like_count": post.likes.count(),
                },
                status=status.HTTP_200_OK,
            )

        # Send notification (if not own post)
        if request.user != post.author:
            try:
                message = f"{request.user.username} liked your post."
                send_notification(
                    user=post.author,
                    sender=request.user,
                    notification_type="like",
                    message=message,
                    post=post,
                )
            except Exception as e:
                print("Notification error:", e)

        return Response(
            {
                "message": "Post liked successfully.",
                "postId": post.id,
                "liked": True,
                "like_count": post.likes.count(),
            },
            status=status.HTTP_201_CREATED,
        )





class CommentView(APIView):
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]


    def post(self, request, post_id):

        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found.'}, status=404)

        data = request.data.copy()
        data['post'] = post.id

        serializer = CommentSerializer(data=data, context={'request': request})

        if serializer.is_valid():

            with transaction.atomic():

                comment = serializer.save()

                # -------- Parse Lexical JSON --------
                try:
                    parsed = json.loads(comment.content)
                except Exception:
                    parsed = {}

                plain_text = extract_text(parsed.get("root", {}))

                # =================================
                # HASHTAGS
                # =================================
                hashtag_names = set(re.findall(hashtag_regex, plain_text))

                for tag in hashtag_names:
                    tag = tag.lower().strip()
                    if not tag:
                        continue

                    hashtag, _ = Hashtag.objects.get_or_create(name=tag)
                    hashtag.usage_count += 1
                    hashtag.save()

                    comment.hashtags.add(hashtag)

                # =================================
                # MENTIONS
                # =================================
                mentioned_usernames = set(re.findall(mention_regex, plain_text))

                for username in mentioned_usernames:
                    try:
                        mentioned_user = User.objects.get(username=username)

                        if mentioned_user != request.user:

                            send_notification(
                                user=mentioned_user,
                                sender=request.user,
                                notification_type="mention",
                                comment=comment,
                                post=post,
                                message=f"{request.user.username} mentioned you in a comment."
                            )

                    except User.DoesNotExist:
                        continue

                # =================================
                # COMMENT / REPLY NOTIFICATIONS
                # =================================

                if comment.parent is None:

                    if request.user != post.author:

                        send_notification(
                            user=post.author,
                            sender=request.user,
                            notification_type="comment",
                            post=post,
                            comment=comment,
                            message=f"{request.user.username} commented on your post."
                        )

                else:

                    if request.user != comment.parent.author:

                        send_notification(
                            user=comment.parent.author,
                            sender=request.user,
                            notification_type="reply",
                            post=post,
                            comment=comment,
                            message=f"{request.user.username} replied to your comment."
                        )

                    if request.user != post.author:

                        send_notification(
                            user=post.author,
                            sender=request.user,
                            notification_type="comment",
                            post=post,
                            comment=comment,
                            message=f"{request.user.username} replied to a comment on your post."
                        )

            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)


    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Fetch top-level comments (those with no parent comment)
        comments = post.comments.filter(parent__isnull=True)
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)



class CommentDetailView(APIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'id'           # use model's PK field
    lookup_url_kwarg = 'id'

    def get(self, request, post_id, id):
        # Retrieve a specific comment and its replies
        try:
            comment = Comment.objects.get(id=id, post__id=post_id)
            serializer = CommentSerializer(comment, context={'request': request})
            print("🔍 Serializer Data:", serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Comment.DoesNotExist:
            return Response({'error': 'Comment not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        
    def patch(self, request, post_id, id):

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            comment = Comment.objects.get(
                id=id,
                post__id=post_id,
                author=request.user
            )
        except Comment.DoesNotExist:
            return Response(
                {"detail": "Comment not found or you are not the author."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CommentSerializer(
            comment,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if not serializer.is_valid():
            return Response(
                {"detail": "Invalid update data", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():

                comment = serializer.save()

                content = request.data.get("content", comment.content)

                try:
                    parsed = json.loads(content)
                except Exception:
                    parsed = {}

                plain_text = extract_text(parsed.get("root", {}))

                # HASHTAGS
                new_hashtags = set(re.findall(hashtag_regex, plain_text))
                comment.hashtags.clear()

                for tag in new_hashtags:
                    tag = tag.lower().strip()

                    if not tag:
                        continue

                    hashtag, _ = Hashtag.objects.get_or_create(name=tag)
                    hashtag.usage_count += 1
                    hashtag.save()

                    comment.hashtags.add(hashtag)

                # MENTIONS
                new_mentions = set(re.findall(mention_regex, plain_text))

                for username in new_mentions:
                    try:
                        mentioned_user = User.objects.get(username=username)

                        if mentioned_user != request.user:
                            send_notification(
                                user=mentioned_user,
                                sender=request.user,
                                notification_type="mention",
                                comment=comment,
                                post=comment.post,
                                message=f"{request.user.username} mentioned you in a comment.",
                            )

                    except User.DoesNotExist:
                        continue

            return Response(
                CommentSerializer(comment, context={"request": request}).data,
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "detail": "An error occurred while updating the comment.",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        

    def delete(self, request, post_id, id):
        try:
            comment = Comment.objects.get(id=id, post__id=post_id, author=request.user)
            comment.delete()
            return Response({'message': 'Comment deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except Comment.DoesNotExist:
            return Response({'error': 'Comment not found or you are not the author.'}, status=status.HTTP_404_NOT_FOUND)

