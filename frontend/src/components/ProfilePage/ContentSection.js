import React from 'react';
import './ProfilePage_css/ContentSection.css'; // optional if you want to style it

const ContentSection = ({ activeTab }) => {
  const contentMap = {
    Posts: <p>No posts listed yet.</p>,
    Products: <p>No products listed yet.</p>,
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
