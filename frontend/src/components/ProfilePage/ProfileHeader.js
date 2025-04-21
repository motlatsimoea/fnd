import React from 'react';
import './ProfilePage_css/ProfileHeader.css';

const ProfileHeader = ({ user }) => {
  if (!user) return null;

  const {
    username,
    bio,
    location,
    birth_date,
    interests = [],
    profile_picture,
    background_picture
  } = user;

  return (
    <div className="profile-header">
      {/* Background Image */}
      <div
        className="background-image"
        style={{ backgroundImage: `url(${background_picture})` }}
      ></div>

      {/* Profile Section */}
      <div className="profile-section">
        <div
          className="profile-picture"
          style={{ backgroundImage: `url(${profile_picture})` }}
        ></div>
        <div className="user-info">
          <h2>{username}</h2>
          <button className="edit-button">Edit Profile</button>
          <p>{bio}</p>
          <div className="tags">
            {interests.map((interest, index) => (
              <span key={index} className="tag">
                {interest}
              </span>
            ))}
          </div>
          <p>
            📍 {location} | 🎂 Born {birth_date}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
