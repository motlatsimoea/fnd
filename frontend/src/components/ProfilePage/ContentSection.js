import React from 'react';

const ContentSection = ({ activeTab }) => {
  const content = {
    Posts: <p>No posts listed yet.</p>,
    Products: <p>No products listed yet.</p>,
    'Liked Articles': <p>No liked articles yet.</p>,
  };

  return (
    <div className="content-section">
      <h3>{activeTab}</h3>
      {content[activeTab]}
    </div>
  );
};

export default ContentSection;
