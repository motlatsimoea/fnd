import React from 'react';
import './ProfilePage_css/ContentSection.css';

const ContentSection = ({ activeTab, data }) => {
  const { profile, products } = data || {};

  const contentMap = {
    Posts: (
      <div>
        {profile?.posts?.length ? (
          profile.posts.map((post) => (
            <div key={post.id} className="post-card">
              <h4>{post.title}</h4>
              <p>{post.content}</p>
            </div>
          ))
        ) : (
          <p>No posts listed yet.</p>
        )}
      </div>
    ),
    Products: (
      <div>
        {products?.length ? (
          products.map((product) => (
            <div key={product.id} className="product-card">
              <h4>{product.name}</h4>
              <p>{product.description}</p>
              <p>💰 {product.price}</p>
            </div>
          ))
        ) : (
          <p>No products listed yet.</p>
        )}
      </div>
    ),
    'Liked Articles': <p>No liked articles yet.</p>,
  };

  return (
    <div className="content-section">
      <h3>{activeTab}</h3>
      <div className="tab-content">
        {contentMap[activeTab] || <p>No content available for this tab.</p>}
      </div>
    </div>
  );
};

export default ContentSection;
