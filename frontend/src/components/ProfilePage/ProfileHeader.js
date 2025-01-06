import React from 'react';
import './ProfilePage_css/ProfileHeader.css';

const ProfileHeader = ({ user }) => {
  return (
    <div className="profile-header">
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
    </div>
  );
};

export default ProfileHeader;
