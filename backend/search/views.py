from django.db.models import Q, Prefetch
from django.conf import settings
import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from users.models import CustomUser
from blog.models import Post, Hashtag, Comment



def extract_lexical_text(content):
    """
    Extract plain text from Lexical JSON content.

    Returns a normal string suitable for search previews.
    """

    if not content:
        return ""

    try:
        # Lexical content may already be a Python dictionary
        if isinstance(content, str):
            content = json.loads(content)

        def extract_from_node(node):
            if not isinstance(node, dict):
                return ""

            # Actual text node
            if node.get("type") == "text":
                return node.get("text", "")

            # Nodes containing children
            children = node.get("children", [])

            if children:
                return " ".join(
                    extract_from_node(child)
                    for child in children
                )

            return ""

        root = content.get("root", content)

        text = extract_from_node(root)

        # Clean up excessive whitespace
        return " ".join(text.split()).strip()

    except (json.JSONDecodeError, TypeError, AttributeError):
        return ""
    
    
class GlobalSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):

        query = request.GET.get("q", "").strip()

        # -----------------------------------------
        # EMPTY / SHORT QUERY
        # -----------------------------------------

        if len(query) < 2:
            return Response({
                "users": [],
                "hashtags": [],
                "posts": []
            })

        # Prevent excessively large queries
        query = query[:50]

        # =========================================
        # USERS
        # =========================================

        users = CustomUser.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query),
            is_active=True,
            is_staff=False
        ).distinct()[:5]

        user_results = []

        for user in users:

            profile_picture = None

            try:
                profile = user.profile

                if profile.profile_picture:
                    profile_picture = (
                        f"{settings.SUPABASE_PUBLIC_URL}"
                        f"/storage/v1/object/public/"
                        f"{settings.SUPABASE_STORAGE_BUCKET}/"
                        f"{profile.profile_picture.name}"
                    )

            except Exception:
                pass

            full_name = (
                f"{user.first_name or ''} "
                f"{user.last_name or ''}"
            ).strip()

            user_results.append({
                "id": user.id,
                "username": user.username,
                "name": full_name,
                "profile_picture": profile_picture,
            })

        # =========================================
        # HASHTAGS
        # =========================================

        hashtag_query = query.lstrip("#")

        hashtags = Hashtag.objects.filter(
            name__icontains=hashtag_query
        ).order_by("-usage_count")[:5]

        hashtag_results = [
            {
                "name": hashtag.name,
                "usage_count": hashtag.usage_count,
            }
            for hashtag in hashtags
        ]

        # =========================================
        # POSTS
        # =========================================

        posts = Post.objects.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(author__username__icontains=query) |
            Q(hashtags__name__icontains=query)
        ).select_related(
            "author"
        ).order_by(
            "-created_at"
        )[:10]

        post_results = []

        for post in posts:

            content_text = extract_lexical_text(post.content)

            post_results.append({
                "id": str(post.id),
                "title": post.title,
                "content_preview": content_text[:100],
                "author": {
                    "id": post.author.id,
                    "username": post.author.username,
                },
            })

        # =========================================
        # RESPONSE
        # =========================================

        return Response({
            "users": user_results,
            "hashtags": hashtag_results,
            "posts": post_results,
        })