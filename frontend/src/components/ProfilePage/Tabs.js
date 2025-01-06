import React from 'react';
import './ProfilePage_css/Tabs.css';

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = ['Posts', 'Products', 'Liked Articles'];

  return (
    <div className="tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? 'tab active' : 'tab'}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
