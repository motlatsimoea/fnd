import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleLikePost } from "../../features/blog/BlogList-slice";
import ImageCarouselModal from "../../components/ImageCarouselModal";
import "./BlogPost.css";

const BlogPost = ({
  id,
  title,
  author,
  date,
  authorImage,
  images = [],        // array of { file } or strings
  text,
  likes,
  liked = false,
  like_count = 0,
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
    <div className="blog-post">
      <div onClick={handleTitleClick} className="blog-title-link" style={{ cursor: "pointer" }}>
        <h2 className="blog-title">{title}</h2>
      </div>

      <div className="blog-author">
        <div onClick={handleUserClick} className="author-link" style={{ cursor: "pointer" }}>
          <img
            src={authorImage || "https://via.placeholder.com/50"}
            alt="Author's avatar"
            className="author-img"
          />
        </div>
        <div className="author-info">
          <span onClick={handleUserClick} className="author-name" style={{ cursor: "pointer" }}>
            {author}
          </span>
          <span className="blog-date">{date}</span>
        </div>
      </div>

      <p className="blog-text">{text}</p>
      {images?.length > 0 && (
        <div className="blog-images">
          {images.map((img, idx) => {
            const src = img?.file || img; // supports {file} or plain url
            return (
              <img
                key={idx}
                src={src}
                alt={`Blog ${idx + 1}`}
                onClick={() => openGalleryAt(idx)}
                style={{ cursor: "pointer" }}
              />
            );
          })}
        </div>
      )}

      <button
        className="like-button"
        onClick={handleToggleLike}
      >
        <span role="img" aria-label="heart" style={{ color: liked ? "red" : "darkgray" }}>
          ❤️
        </span>{" "}
        {likes || 0} Likes
      </button>

      {showGallery && (
        <ImageCarouselModal
          images={images}              // can pass array of {file} or urls
          initialIndex={startIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};

export default BlogPost;
