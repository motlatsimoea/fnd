import React, { useState } from "react";
import { useDispatch } from "react-redux";
import ProfileEditModal from "./ProfileEditModal";
import ImageModal from "../ImageModal";
import FollowersModal from "./FollowersModal";
import "./ProfilePage_css/ProfileHeader.css";
import axiosInstance from "../../utils/axiosInstance";
import ChatPanel from '../../components/chat/ChatPanel';
import { fetchUserChats } from "../../features/chats/Chat-slice";

const ProfileHeader = ({ user, currentUser, onSaveProfile }) => {

  const dispatch = useDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const [isFollowing, setIsFollowing] = useState(user?.is_following);
  const [followersCount, setFollowersCount] = useState(user?.followers_count);
  const [followingCount] = useState(user?.following_count);

  const [showChat, setShowChat] = useState(false);
  const [chatKey, setChatKey] = useState(null);

  if (!user || !currentUser) return null;

  const {
    user_id,
    username,
    first_name,
    last_name,
    bio,
    location,
    phone_number,
    profile_picture,
    background_picture,
    sectors,
    followers,
    following,
    posts
  } = user;

  const displayName =
    first_name || last_name
      ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
      : username;

  const isOwnProfile = currentUser.username === username;

  const handleFollowToggle = async () => {
    try {

      const res = await axiosInstance.post(`/follow/${username}/`);

      if (res.data.status === "followed") {
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      } else if (res.data.status === "unfollowed") {
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      }

    } catch (err) {
      console.error(err);
    }
  };

  const handleMessageClick = async () => {
      try {
        const res = await axiosInstance.post("/inbox/get-or-create/", {
          user2: user_id,
        });

        await dispatch(fetchUserChats()).unwrap();

        setChatKey(res.data.unique_key);
        setShowChat(true);

      } catch (err) {
        console.error("Failed to open chat:", err);
      }
    };

  const handleEditClick = () => setIsEditing(true);
  const handleCloseModal = () => setIsEditing(false);

  const handleSaveModal = (formData) => {
    onSaveProfile(formData);
    setIsEditing(false);
  };

  return (
    <div className="profile-header">

      {/* Banner */}
      <div
        className="background-image"
        style={{
          backgroundImage: `url(${background_picture || "/default_background.jpeg"})`,
          cursor: "pointer"
        }}
        onClick={() =>
          setZoomedImage(background_picture || "/default_background.jpeg")
        }
      />

      <div className="profile-section">

        {isOwnProfile && (
          <button className="edit-button" onClick={handleEditClick}>
            Edit Profile
          </button>
        )}

        {/* LEFT SIDE */}

        <div className="profile-left">

          <div
            className="profile-picture"
            style={{
              backgroundImage: `url(${profile_picture ||  "/default_profile.png"})`
            }}
            onClick={() =>
              setZoomedImage(profile_picture ||  "/default_profile.png")
            }
          />

          <div className="name-block">
            <h2>{displayName}</h2>
            <p className="username-tag">@{username}</p>
          </div>

          {/* FOLLOW / MESSAGE BUTTONS */}

          {!isOwnProfile && (

            <div className="profile-buttons">

              <button
                  className={`follow-btn ${isFollowing ? "following" : ""}`}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? "Following" : "Follow"}
              </button>

              <button className="message-button" onClick={handleMessageClick}>
                Message
              </button>

            </div>

          )}

          {/* SOCIAL COUNTS */}

          <div className="profile-stats">

            <div className="stat">
              <strong>{posts?.length || 0}</strong>
              <span>Posts</span>
            </div>

            <div
              className="stat clickable"
              onClick={() => setShowFollowers(true)}
            >
              <strong>{followersCount}</strong>
              <span>Followers</span>
            </div>

            <div
              className="stat clickable"
              onClick={() => setShowFollowing(true)}
            >
              <strong>{followingCount}</strong>
              <span>Following</span>
            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="profile-right">

          {bio && <p className="bio">{bio}</p>}

          {sectors && sectors.length > 0 && (
            <div className="sectors">
              {sectors.map((sector) => (
                <span key={sector.id}>
                  {sector.name}
                </span>
              ))}
            </div>
          )}

          {phone_number && <p>📞 {phone_number}</p>}
          {location && <p>📍 {location}</p>}

        </div>

      </div>

      {isEditing && (
        <ProfileEditModal
          user={user}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
        />
      )}

      {zoomedImage && (
        <ImageModal
          imageUrl={zoomedImage}
          onClose={() => setZoomedImage(null)}
        />
      )}

      {/* FOLLOWERS MODAL */}

      {showFollowers && (
        <FollowersModal
          users={followers}
          title="Followers"
          currentUser={currentUser} 
          onClose={() => setShowFollowers(false)}
        />
      )}

      {showFollowing && (
        <FollowersModal
          users={following}
          title="Following"
          onClose={() => setShowFollowing(false)}
        />
      )}

      {showChat && chatKey && (
        <ChatPanel
          chatKey={chatKey}
          onClose={() => setShowChat(false)}
          floating={true}
        />
      )}

    </div>
  );
};

export default ProfileHeader;