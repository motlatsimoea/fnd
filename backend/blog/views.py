from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Post, Comment, Like, Media
from .serializers import PostSerializer, CommentSerializer
from django.shortcuts import get_object_or_404

class PostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PostSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            post = serializer.save(author=request.user)
            media_files = request.FILES.getlist('media_files')  # Handle multiple file uploads
            for media_file in media_files[:4]:  # Limit to 4 files
                Media.objects.create(post=post, file=media_file)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id, author=request.user)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found or you are not the author.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PostSerializer(post, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
            serializer = PostSerializer(post, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, post_id):
        # Delete a specific post
        try:
            post = Post.objects.get(id=post_id, author=request.user)
            post.delete()
            return Response({'message': 'Post deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found or you are not the author.'}, status=status.HTTP_404_NOT_FOUND)

class LikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        #Get Post By Id
        post = get_object_or_404(Post, id=pk)

        # Check if the user has already liked the post
        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response(
                {"message": "Post unliked successfully."},
                status=status.HTTP_200_OK,
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

        data = request.data
        data['post'] = post.id
        data['author'] = request.user.id
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

        comments = post.comments.filter(parent__isnull=True)  # Fetch top-level comments
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

