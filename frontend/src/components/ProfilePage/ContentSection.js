import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { renderLexicalContent } from "../../utils/renderLexicalContent";
import "./ProfilePage_css/ContentSection.css";



const ContentSection = ({ activeTab, profile }) => {
const navigate = useNavigate();

  const renderPosts = (posts) => {

    if (!posts || posts.length === 0) {
      return <div className="empty-state">No posts yet.</div>;
    }

    return (
      <div className="card-grid">
        {posts.map((post) => (
          <div
            key={post.id}
            className="content-card"
            onClick={() => navigate(`/blog/${post.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div className="card-content">

              <h4 className="card-title">{post.title}</h4>

              <div className="card-preview">
                {renderLexicalContent(post.content)}
              </div>

            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProducts = (products) => {

    if (!products || products.length === 0) {
      return <div className="empty-state">No products yet.</div>;
    }

    return (
      <div className="card-grid">
        {products.map((product) => (
          <Link
            to={`/product/${product.id}`}
            key={product.id}
            className="content-card"
          >

            {product.thumbnail && (
              <img
                src={product.thumbnail}
                alt={product.name}
                className="product-image"
              />
            )}

            <h4 className="card-title">{product.name}</h4>
            <p className="card-price">M {product.price}</p>

          </Link>
        ))}
      </div>
    );
  };

  const renderLikedPosts = (likedPosts) => {

    if (!likedPosts || likedPosts.length === 0) {
      return <div className="empty-state">No liked posts yet.</div>;
    }

    return (
      <div className="card-grid">
        {likedPosts.map((post) => (
          <Link
            to={`/blog/${post.id}`}
            key={post.id}
            className="content-card"
          >

            <div className="card-content">

              <h4 className="card-title">{post.title}</h4>

              <div className="card-preview">
                {renderLexicalContent(post.content)}
              </div>

            </div>

          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="content-section">

      {activeTab === "posts" && renderPosts(profile.posts)}
      {activeTab === "products" && renderProducts(profile.products)}
      {activeTab === "liked" && renderLikedPosts(profile.liked_posts)}

    </div>
  );
};

export default ContentSection;