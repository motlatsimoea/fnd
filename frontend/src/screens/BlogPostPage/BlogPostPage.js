import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSinglePost, toggleLikePost } from "../../features/blog/BlogList-slice";
import { useParams, useNavigate, Link } from "react-router-dom";
import CommentSection from "../../components/CommentSection/CommentSection";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import ImageModal from "../../components/ImageModal";
import ImageCarouselModal from "../../components/ImageCarouselModal";
import { FaArrowLeft, FaHeart } from "react-icons/fa";
import "./BlogPostPage.css";

const BlogPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { singlePost, loading, error } = useSelector((state) => state.BlogList);

  const [zoomImage, setZoomImage] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(fetchSinglePost(id));
    }
  }, [dispatch, id]);

  const handleToggleLike = () => {
    if (singlePost) dispatch(toggleLikePost(singlePost.id));
  };

  const openGalleryAt = (index) => {
    setGalleryStartIndex(index);
    setShowGallery(true);
  };

  const renderContentWithTagsAndMentions = (content) => {
    if (!content) return null;

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      return content; // fallback if already plain text
    }

    const renderNode = (node, keyPrefix = "") => {
      // Text node
      if (node.text !== undefined) {
        const parts = node.text.split(/(#\w+|@\w+)/g);

        return parts.map((part, idx) => {
          const key = `${keyPrefix}-${idx}`;

          // Hashtag
          if (part.startsWith("#")) {
            const tag = part.slice(1);
            return (
              <Link
                key={key}
                to={`/hashtag/${tag}`}
                className="clickable-hashtag"
              >
                {part}
              </Link>
            );
          }

          // Mention
          if (part.startsWith("@")) {
            const username = part.slice(1);
            return (
              <Link
                key={key}
                to={`/profile/${username}`}
                className="clickable-mention"
              >
                {part}
              </Link>
            );
          }

          return part;
        });
      }

      // Paragraph node
      if (node.children) {
        return (
          <p key={keyPrefix}>
            {node.children.map((child, index) =>
              renderNode(child, `${keyPrefix}-${index}`)
            )}
          </p>
        );
      }

      return null;
    };

    return parsed.root?.children?.map((node, index) =>
      renderNode(node, `node-${index}`)
    );
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!singlePost) return <Message variant="warning">No post found.</Message>;

  return (
    <div className="blog-post-page">
      <button className="back-arrow" onClick={() => navigate(-1)}>
        <FaArrowLeft />
      </button>

      <div className="blog-post-card">
        <div className="post-header">
          <img
            src={singlePost.authorImage || "https://via.placeholder.com/50"}
            alt={`${singlePost.author.username}`}
            className="user-image"
            onClick={() => singlePost.authorImage && setZoomImage(singlePost.authorImage)}
          />

          <div className="user-details">
            <h2 className="post-title">{singlePost.title}</h2>
            <p className="user-name">@{singlePost.author.username}</p>
            <p className="post-date">{singlePost.time_since_posted}</p>
          </div>
        </div>

        <div className="post-content">
          {renderContentWithTagsAndMentions(singlePost.content)}

          {singlePost.media?.length > 0 && (
            <div className="post-images">
              {singlePost.media.map((img, i) => (
                <img
                  key={i}
                  src={img.file}
                  alt={`Slide ${i}`}
                  onClick={() => openGalleryAt(i)}
                />
              ))}
            </div>
          )}

          {/* --- Like Button --- */}
          <button
            className={`like-button ${singlePost.liked ? "liked" : ""}`}
            onClick={handleToggleLike}
          >
            <FaHeart className="like-icon" />
            <span className="like-count">
              {singlePost.like_count || 0}
            </span>
          </button>
        </div>
      </div>

      <CommentSection postId={id} />

      {zoomImage && <ImageModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />}

      {showGallery && (
        <ImageCarouselModal
          images={singlePost.media}
          initialIndex={galleryStartIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};

export default BlogPostPage;
