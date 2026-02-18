import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { toggleLikePost } from "../../features/blog/BlogList-slice";
import ImageCarouselModal from "../../components/ImageCarouselModal";
import { FaHeart } from "react-icons/fa";
import "./BlogPost.css";

const BlogPost = ({
  id,
  title,
  author,
  date,
  authorImage,
  images = [],
  text,
  likes,
  liked = false,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showGallery, setShowGallery] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const handleTitleClick = () => navigate(`/blog/${id}`);
  const handleUserClick = () => navigate(`/profile/${author}`);
  const handleToggleLike = () => dispatch(toggleLikePost(id));

  const openGalleryAt = (idx) => {
    setStartIndex(idx);
    setShowGallery(true);
  };

  const renderTextWithHashtags = (text) => {
    if (!text) return null;
    const parts = text.split(/(#\w+)/g);

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

  return (
    <div className="blog-post-card">
      <div onClick={handleTitleClick} className="blog-title-link">
        <h2 className="blog-title">{title}</h2>
      </div>

      <div className="blog-author">
        <div onClick={handleUserClick} className="author-link">
          <img src={authorImage} alt="Author avatar" className="author-img" />
        </div>

        <div className="author-info">
          <span onClick={handleUserClick} className="author-name">
            @{author}
          </span>
          <span className="blog-date">{date}</span>
        </div>
      </div>

      <p className="blog-text">{renderTextWithHashtags(text)}</p>

      {images?.length > 0 && (
        <div className="blog-images">
          {images.map((img, idx) => {
            const src = img?.file || img;
            return (
              <img
                key={idx}
                src={src}
                alt={`Blog ${idx + 1}`}
                onClick={() => openGalleryAt(idx)}
              />
            );
          })}
        </div>
      )}

      {/* --- Modern Like Button --- */}
      <button
        className={`like-button ${liked ? "liked" : ""}`}
        onClick={handleToggleLike}
      >
        <FaHeart className="like-icon" />
        <span className="like-count">{likes || 0}</span>
      </button>

      {showGallery && (
        <ImageCarouselModal
          images={images}
          initialIndex={startIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};

export default BlogPost;
