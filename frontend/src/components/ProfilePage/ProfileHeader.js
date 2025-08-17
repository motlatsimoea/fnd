import React from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ProfilePage_css/ProfileHeader.css';

const ProfileHeader = ({ user, currentUser }) => {
  const navigate = useNavigate();

  if (!user) return null;

  const {
    id,
    username,
    bio,
    location,
    birth_date,
    interests = [],
    profile_picture,
    background_picture,
  } = user;

  const handleInboxClick = () => {
    const chatKey = [currentUser.id, id].sort().join('-');
    navigate(`/chat/${chatKey}`);
  };

  const handleEditClick = () => {
    navigate('/edit-profile');
  };

  return (
    <div className="profile-header">
      <div
        className="background-image"
        style={{ backgroundImage: `url(${background_picture || ''})` }}
      ></div>

      <div className="profile-section">
        <div
          className="profile-picture"
          style={{ backgroundImage: `url(${profile_picture || ''})` }}
        ></div>

        <div className="user-info">
          <h2>{username}</h2>

          <div className="action-buttons">
            {currentUser?.id !== id && (
              <button className="inbox-button" onClick={handleInboxClick} title="Message User">
                <FaEnvelope />
              </button>
            )}
            {currentUser?.id === id && (
              <button className="edit-button" onClick={handleEditClick}>
                Edit Profile
              </button>
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
