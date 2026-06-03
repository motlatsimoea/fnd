import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleLikePost } from "../../features/blog/BlogList-slice";
import ImageCarouselModal from "../../components/ImageCarouselModal";
import { FaHeart } from "react-icons/fa";
import { renderLexicalContent } from "../../utils/renderLexicalContent";
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

  return (
    <div className="blog-post-card">

      <div onClick={handleTitleClick} className="blog-title-link">
        <h2 className="blog-title">{title}</h2>
      </div>

      <div className="blog-author">

        <div onClick={handleUserClick} className="author-link">
          <img
            src={authorImage}
            alt="Author avatar"
            className="author-img"
          />
        </div>

        <div className="author-info">
          <span onClick={handleUserClick} className="author-name">
            @{author}
          </span>
          <span className="blog-date">{date}</span>
        </div>

      </div>

      <div className="blog-text">
        {renderLexicalContent(text)}
      </div>

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