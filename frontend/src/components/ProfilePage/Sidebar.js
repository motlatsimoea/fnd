import React from 'react';
import './ProfilePage_css/Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="section">
        <h4>Posts You Might Like</h4>
        <ul>
          <li>5 Tips for Better Crop Yields</li>
          <li>Understanding Soil Health</li>
          <li>The Future of Agriculture</li>
        </ul>
      </div>
      <div className="section">
        <h4>Articles You Might Like</h4>
        <ul>
          <li>The Rise of Organic Farming</li>
          <li>How to Care for Livestock</li>
          <li>Exploring Vertical Farming</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
