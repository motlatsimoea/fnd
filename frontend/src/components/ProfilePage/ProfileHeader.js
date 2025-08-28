import React, { useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ProfileEditModal from "./ProfileEditModal";
import ImageModal from "../ImageModal"; // ✅ import shared modal
import "./ProfilePage_css/ProfileHeader.css";

const ProfileHeader = ({ user, currentUser, onSaveProfile }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null); // track modal image

  if (!user || !currentUser) return null;

  const {
    username,
    first_name,
    last_name,
    bio,
    location,
    phone_number,
    profile_picture,
    background_picture,
  } = user;

  const displayName =
    first_name || last_name
      ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
      : username;

  const isOwnProfile = currentUser.username === username;

  const handleInboxClick = () => {
    const chatKey = [currentUser.username, username].filter(Boolean).sort().join("-");
    navigate(`/chat/${chatKey}`);
  };

  const handleEditClick = () => setIsEditing(true);
  const handleCloseModal = () => setIsEditing(false);
  const handleSaveModal = (formData) => {
    onSaveProfile(formData);
    setIsEditing(false);
  };

  return (
    <div className="profile-header">
      {/* Background / Cover Image */}
      <div
        className="background-image"
        style={{
          backgroundImage: `url(${background_picture || "/default_background.jpeg"})`,
          cursor: "pointer",
        }}
        onClick={() =>
          setZoomedImage(background_picture || "/default_background.jpeg")
        }
        title="Click to zoom"
      />

      <div className="profile-section">
        {/* Profile Picture */}
        <div
          className="profile-picture"
          style={{
            backgroundImage: `url(${profile_picture || "/default_profile.png"})`,
            cursor: "pointer",
          }}
          onClick={() =>
            setZoomedImage(profile_picture || "/default_profile.png")
          }
          title="Click to zoom"
        />

        <div className="user-info">
          <h2>{displayName}</h2>
          <p className="username-tag">@{username}</p>
          {phone_number && <p>📞 {phone_number}</p>}

          <div className="action-buttons">
            <button
              className="inbox-button"
              onClick={handleInboxClick}
              title="Message User"
            >
              <FaEnvelope />
            </button>

            {isOwnProfile && (
              <button className="edit-button" onClick={handleEditClick}>
                Edit Profile
              </button>
            )}
          </div>

          {bio && <p>{bio}</p>}
          {location && <p>📍 {location}</p>}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {isEditing && (
        <ProfileEditModal
          user={user}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
        />
      )}

      {/* ✅ Use shared ImageModal */}
      {zoomedImage && (
        <ImageModal imageUrl={zoomedImage} onClose={() => setZoomedImage(null)} />
      )}
    </div>
  );
};

export default ProfileHeader;
