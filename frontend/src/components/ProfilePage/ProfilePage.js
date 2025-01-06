import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Tabs from './Tabs';
import './ProfilePage_css/ProfilePage.css';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('Posts'); // Tracks the active tab

  const user = {
    name: 'Motlatsi',
    bio: "Farmer and advocate for sustainable agriculture. I believe in the power of crops, livestock, and dairy to shape a better future.",
    location: 'Lesotho',
    birthDate: 'March 20, 1990',
    interests: ['Crops', 'Livestock', 'Dairy'],
    profilePicture: '/path-to-dummy-profile-pic.jpg',
    backgroundPicture: '/path-to-dummy-background.jpg',
  };

  const posts = [
    {
      id: 1,
      title: 'The Benefits of Crop Rotation',
      date: 'June 10, 2024',
      link: '#', // Replace with actual links
    },
    {
      id: 2,
      title: 'Livestock Nutrition Tips',
      date: 'May 28, 2024',
      link: '#', // Replace with actual links
    },
    {
      id: 3,
      title: '5 Ways to Increase Dairy Production',
      date: 'April 15, 2024',
      link: '#', // Replace with actual links
    },
  ];

  const products = [
    {
      id: 1,
      name: 'Organic Dairy Milk',
      price: '$4.99',
      image: '/path-to-dairy-milk.jpg', // Replace with actual image paths
      link: '#', // Replace with actual links
    },
    {
      id: 2,
      name: 'Fresh Corn (1kg)',
      price: '$2.50',
      image: '/path-to-corn.jpg', // Replace with actual image paths
      link: '#', // Replace with actual links
    },
    {
      id: 3,
      name: 'Grass-fed Beef (500g)',
      price: '$8.99',
      image: '/path-to-beef.jpg', // Replace with actual image paths
      link: '#', // Replace with actual links
    },
  ];

  const likedArticles = [
    {
      id: 1,
      title: 'How to Improve Soil Health',
      author: 'Jane Doe',
      link: '#', // Replace with actual links
    },
    {
      id: 2,
      title: 'The Future of Sustainable Farming',
      author: 'John Smith',
      link: '#', // Replace with actual links
    },
    {
      id: 3,
      title: 'Exploring Vertical Farming',
      author: 'Michael Green',
      link: '#', // Replace with actual links
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Posts':
        return (
          <ul className="posts-list">
            {posts.map((post) => (
              <li key={post.id}>
                <a href={post.link} className="link">
                  <strong>{post.title}</strong>
                </a>{' '}
                <span>({post.date})</span>
              </li>
            ))}
          </ul>
        );
      case 'Products':
        return (
          <ul className="products-list">
            {products.map((product) => (
              <li key={product.id} className="product-item">
                <a href={product.link} className="link">
                  <strong>{product.name}</strong>
                </a>
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image"
                />
                <p className="product-price">{product.price}</p>
              </li>
            ))}
          </ul>
        );
      case 'Liked Articles':
        return (
          <ul className="articles-list">
            {likedArticles.map((article) => (
              <li key={article.id}>
                <a href={article.link} className="link">
                  "{article.title}"
                </a>{' '}
                by {article.author}
              </li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-container">
      {/* Background Image */}
      <div
        className="background-image"
        style={{ backgroundImage: `url(${user.backgroundPicture})` }}
      ></div>

      {/* Profile Section */}
      <div className="profile-section">
        <div
          className="profile-picture"
          style={{ backgroundImage: `url(${user.profilePicture})` }}
        ></div>
        <div className="user-info">
          <h2>{user.name}</h2>
          <button className="edit-button">Edit Profile</button>
          <p>{user.bio}</p>
          <div className="tags">
            {user.interests.map((interest, index) => (
              <span key={index} className="tag">
                {interest}
              </span>
            ))}
          </div>
          <p>
            📍 {user.location} | 🎂 Born {user.birthDate}
          </p>
        </div>
      </div>

      {/* Tabs for Content */}
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="content">
        <div className="main-content">{renderContent()}</div>
        <Sidebar />
      </div>
    </div>
  );
};

export default ProfilePage;
