import React from 'react';
import CommentSection from '../../components/CommentSection/CommentSection'; 
import './BlogPostPage.css';

const BlogPostPage = () => {
  return (
    <div className="blog-post-page">
      <div className="blog-post">
        <div className="post-header">
          <div className="user-info">
            <img
              src="https://via.placeholder.com/50"
              alt="User profile"
              className="user-image"
            />
            <div className="user-details">
              <h3 className="post-title">Sustainable Farming: Tips for Success</h3>
              <p className="user-name">John Doe</p>
              <p className="post-date">November 22, 2024</p>
            </div>
          </div>
        </div>

        <div className="post-content">
          <p>
            Sustainable farming is critical to ensure food security and environmental health. In this blog post, we will explore various sustainable farming techniques, the benefits of regenerative agriculture, and how these practices can help reduce carbon footprints. By incorporating more eco-friendly practices into farming, we can help mitigate climate change and preserve biodiversity.
          </p>
          <div className="post-images">
            <img src="https://via.placeholder.com/200x120" alt="Image 1" />
            <img src="https://via.placeholder.com/200x120" alt="Image 2" />
            <img src="https://via.placeholder.com/200x120" alt="Image 3" />
            <img src="https://via.placeholder.com/200x120" alt="Image 4" />
          </div>
          <button className="like-button">
            <span role="img" aria-label="heart">❤️</span> 15 Likes
          </button>
          <p className="post-summary">
            In summary, sustainable farming practices are essential to protecting our planet's future. By adopting these methods, we can reduce the negative impacts of conventional farming while boosting food production and improving soil health. Stay tuned for more in-depth articles on specific farming techniques and case studies of successful sustainable farms.
          </p>
        </div>
      </div>

      <CommentSection />
    </div>
  );
};

export default BlogPostPage;
