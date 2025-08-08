import React from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ProfilePage_css/ProfileHeader.css';

const ProfileHeader = ({ user, currentUser }) => {
  const navigate = useNavigate();

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

  const handleInboxClick = () => {
    const chatKey = [currentUser.id, user.id].sort().join('-');
    navigate(`/chat/${chatKey}`);
  };

  return (
    <div className="profile-header">
      <div
        className="background-image"
        style={{ backgroundImage: `url(${background_picture})` }}
      ></div>

      <div className="profile-section">
        <div
          className="profile-picture"
          style={{ backgroundImage: `url(${profile_picture})` }}
        ></div>

        <div className="user-info">
          <h2>{username}</h2>

          <div className="action-buttons">
            {currentUser?.id !== user.id && (
              <button className="inbox-button" onClick={handleInboxClick} title="Message User">
                <FaEnvelope />
              </button>
            )}
            {currentUser?.id === user.id && (
              <button className="edit-button">Edit Profile</button>
            )}
          </div>

          <p>{bio}</p>

          <div className="tags">
            {interests.map((interest, index) => (
              <span key={index} className="tag">{interest}</span>
            ))}
          </div>

          <p>📍 {location} | 🎂 Born {birth_date}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
