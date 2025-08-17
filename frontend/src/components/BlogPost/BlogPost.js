import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleLikePost } from "../../features/blog/BlogList-slice";
import "./BlogPost.css";

const BlogPost = ({
  id,
  title,
  author,
  authorImage,
  images = [],
  text,
  liked = false,
  like_count = 0,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleTitleClick = () => {
    navigate(`/blog/${id}`);
  };

  const handleUserClick = () => {
    navigate(`/user/${author}`);
  };

  const handleToggleLike = () => {
    dispatch(toggleLikePost(id));
  };

  return (
    <div className="blog-post">
      <div
        onClick={handleTitleClick}
        className="blog-title-link"
        style={{ cursor: "pointer" }}
      >
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
        <span
          onClick={handleUserClick}
          className="author-name"
          style={{ cursor: "pointer" }}
        >
          {author}
        </span>
      </div>

      {images?.length > 0 && (
        <div className="blog-images">
          {images.map((img, idx) => (
            <img key={idx} src={img.file} alt={`Blog image ${idx + 1}`} />
          ))}
        </div>
      )}

      <p className="blog-text">{text}</p>

      <button
        className="like-button"
        onClick={handleToggleLike}
        style={{
          cursor: "pointer",
          background: "none",
          border: "none",
          fontSize: "1rem",
        }}
      >
        <span
          role="img"
          aria-label="heart"
          style={{ color: liked ? "red" : "darkgray" }}
        >
          ❤️
        </span>{" "}
        {like_count || 0} Likes
      </button>
    </div>
  );
};

export default BlogPost;
