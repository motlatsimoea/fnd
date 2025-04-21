from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Post, Comment, Like, Media
from .serializers import PostSerializer, CommentSerializer
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils.text import get_valid_filename
from notifications.utils import send_notification


class PostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PostSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        media_files = request.FILES.getlist('media_files') or []

        # File validation configs
        ALLOWED_TYPES = ['image/jpeg', 'image/png', 'video/mp4']
        MAX_FILE_SIZE_MB = 5
        MAX_MEDIA_COUNT = 4

        if len(media_files) > MAX_MEDIA_COUNT:
            return Response({'detail': f'Maximum of {MAX_MEDIA_COUNT} files allowed.'}, status=400)

        for media_file in media_files:
            if media_file.content_type not in ALLOWED_TYPES:
                return Response({'detail': f'Unsupported file type: {media_file.content_type}'}, status=400)
            if media_file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
                return Response({'detail': f'{media_file.name} exceeds max file size of {MAX_FILE_SIZE_MB}MB.'}, status=400)

        # All good, proceed with save inside transaction
        try:
            with transaction.atomic():
                post = serializer.save(author=request.user)

                for media_file in media_files:
                    clean_name = get_valid_filename(media_file.name)
                    media_file.name = clean_name  # optional, helps with weird filenames
                    Media.objects.create(post=post, file=media_file)

                return Response(PostSerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({'detail': 'An error occurred while saving the post.', 'error': str(e)}, status=500)

    def put(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id, author=request.user)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found or you are not the author.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PostSerializer(post, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response({'detail': 'Invalid update data', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    

class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
            serializer = PostSerializer(post, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

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

    def post(self, request, pk):
        # Get Post by Id
        post = get_object_or_404(Post, id=pk)

        # Check if the user has already liked the post
        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response(
                {"message": "Post unliked successfully."},
                status=status.HTTP_200_OK,
            )

        # Send notification if user is not the post author
        if request.user != post.author:  # Prevent self-notifications
            message = f"{request.user.username} liked your post."
            send_notification(
                user=post.author,
                sender=request.user,
                notification_type="like",
                message=message,
                post=post
            )

        return Response(
            {"message": "Post liked successfully."},
            status=status.HTTP_201_CREATED,
        )




class CommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prepare comment data
        data = request.data.copy()
        data['post'] = post.id
        data['author'] = request.user.id

        serializer = CommentSerializer(data=data)
        
        if serializer.is_valid():
            comment = serializer.save()

            # Send notification for top-level comments only (no parent comment)
            if request.user != post.author and comment.parent is None:
                message = f"{request.user.username} commented on your post: {comment.text}"
                send_notification(
                    user=post.author,
                    sender=request.user,
                    notification_type="comment",
                    message=message,
                    post=post,
                    comment=comment
                )

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Fetch top-level comments (those with no parent comment)
        comments = post.comments.filter(parent__isnull=True)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id, id):
        # Retrieve a specific comment and its replies
        try:
            comment = Comment.objects.get(id=id, post__id=post_id)
            serializer = CommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Comment.DoesNotExist:
            return Response({'error': 'Comment not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, post_id, id):
        # Delete a specific comment
        try:
            comment = Comment.objects.get(id=id, post__id=post_id, author=request.user)
            comment.delete()
            return Response({'message': 'Comment deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except Comment.DoesNotExist:
            return Response({'error': 'Comment not found or you are not the author.'}, status=status.HTTP_404_NOT_FOUND)

