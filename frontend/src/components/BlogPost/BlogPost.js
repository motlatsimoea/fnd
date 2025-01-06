import React from "react";
import "./BlogPost.css";

const BlogPost = () => {
  const handleTitleClick = () => {
    alert("Navigating to the full blog post...");
  };

  const handleUserClick = () => {
    alert("Navigating to the user's profile...");
  };

  return (
    <div className="blog-post">
      <a href="#" onClick={handleTitleClick} className="blog-title-link">
        <h2 className="blog-title">Kissing ass: Tips for Success</h2>
      </a>
      <div className="blog-author">
        <a href="#" onClick={handleUserClick} className="author-link">
          <img
            src="https://via.placeholder.com/50"
            alt="Author's avatar"
            className="author-img"
          />
        </a>
        <a href="#" onClick={handleUserClick} className="author-name">
          John Doe
        </a>
        <p className="blog-date">November 22, 2024</p>
      </div>
      <div className="blog-images">
        <img src="https://via.placeholder.com/200x120" alt="Blog image 1" />
        <img src="https://via.placeholder.com/200x120" alt="Blog image 2" />
        <img src="https://via.placeholder.com/200x120" alt="Blog image 3" />
        <img src="https://via.placeholder.com/200x120" alt="Blog image 4" />
      </div>
      <p className="blog-text">
        Sustainable farming is critical to ensure food security and
        environmental health...
      </p>
      <div className="blog-likes">
        <span role="img" aria-label="heart">
          ❤️
        </span>{" "}
        15 Likes
      </div>
    </div>
  );
};

export default BlogPost;

