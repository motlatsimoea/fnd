import React from "react";
import "./ProfilePage_css/ContentSection.css";


const ContentSection = ({ activeTab, profile }) => {
  if (activeTab === "posts") {
    return (
      <div>
        <h3>Posts</h3>
        {profile.posts && profile.posts.length > 0 ? (
          <ul>
            {profile.posts.map((post) => (
              <li key={post.id}>
                <h4>{post.title}</h4>
                <p>{post.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No posts yet.</p>
        )}
      </div>
    );
  }

  if (activeTab === "products") {
    return (
      <div>
        <h3>Products</h3>
        {profile.products && profile.products.length > 0 ? (
          <ul>
            {profile.products.map((product) => (
              <li key={product.id}>
                <h4>{product.name}</h4>
                <p>Price: {product.price}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No products yet.</p>
        )}
      </div>
    );
  }

  if (activeTab === "liked") {
    return (
      <div>
        <h3>Liked Posts</h3>
        <ul>
          <li>🌱 How to Improve Soil Fertility</li>
          <li>🚜 Top 10 Farming Tools for 2025</li>
        </ul>
      </div>
    );
  }

  return null;
};

export default ContentSection;
