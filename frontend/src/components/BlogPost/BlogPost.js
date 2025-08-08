import React from "react";
import { useNavigate } from "react-router-dom";
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
}) => {
  const navigate = useNavigate();

  const handleTitleClick = () => {
    navigate(`/blog/${id}`);
  };

  const handleUserClick = () => {
    navigate(`/user/${author}`);
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
        <p className="blog-date">{date}</p>
      </div>

      {images?.length > 0 && (
        <div className="blog-images">
          {images.map((img, idx) => (
            <img key={idx} src={img.file} alt={`Blog image ${idx + 1}`} />
          ))}
        </div>
      )}

      <p className="blog-text">{text}</p>

      <div className="blog-likes">
        <span role="img" aria-label="heart">❤️</span> {likes} Likes
      </div>
    </div>
  );
};

export default BlogPost;
