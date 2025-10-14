import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileEditModal from "./ProfileEditModal";
import ImageModal from "../ImageModal";
import "./ProfilePage_css/ProfileHeader.css";

const ProfileHeader = ({ user, currentUser, onSaveProfile }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

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
    sectors,
  } = user;

  const displayName =
    first_name || last_name
      ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
      : username;

  const isOwnProfile = currentUser.username === username;

  const handleMessageClick = () => {
    const chatKey = [currentUser.username, username]
      .filter(Boolean)
      .sort()
      .join("-");
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
      {/* Background banner */}
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

      {/* Profile content */}
      <div className="profile-section">
        {/* Top-right edit button */}
        {isOwnProfile && (
          <button className="edit-button" onClick={handleEditClick}>
            Edit Profile
          </button>
        )}

        {/* Left side: profile picture, name, message button */}
        <div className="profile-left">
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

          <div className="name-block">
            <h2>{displayName}</h2>
            <p className="username-tag">@{username}</p>
          </div>

          <button className="message-button" onClick={handleMessageClick}>
            Message
          </button>
        </div>

        {/* Right side info */}
        <div className="profile-right">
          {bio && <p className="bio">{bio}</p>}

          {sectors && sectors.length > 0 && (
            <div className="sectors">
              {sectors.map((sector, index) => (
                <span key={index}>{sector}</span>
              ))}
            </div>
          )}

          {phone_number && <p>📞 {phone_number}</p>}
          {location && <p>📍 {location}</p>}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <ProfileEditModal
          user={user}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
        />
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <ImageModal imageUrl={zoomedImage} onClose={() => setZoomedImage(null)} />
      )}
    </div>
  );
};

export default ProfileHeader;
