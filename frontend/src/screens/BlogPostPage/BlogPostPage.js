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

  const renderContentWithHashtags = (content) => {
    if (!content) return null;
    const parts = content.split(/(#\w+)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("#")) {
        const tag = part.slice(1);
        return (
          <Link key={idx} to={`/hashtag/${tag}`} className="clickable-hashtag">
            {part}
          </Link>
        );
      }
      return part;
    });
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
          <p>{renderContentWithHashtags(singlePost.content)}</p>

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
