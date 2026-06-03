import React, { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import "./ProfilePage_css/FollowersModal.css";

const FollowersModal = ({ users, title, onClose, currentUser }) => {

  const [localUsers, setLocalUsers] = useState(users || []);

  const toggleFollow = async (user) => {
  try {
    console.log("Trying to follow:", user.username);
    const res = await axiosInstance.post(`/follow/${user.username}/`);

    setLocalUsers(prev =>
      prev.map(u => {
        if (u.id !== user.id) return u;

        if (res.data.status === "followed") {
          return { ...u, is_following: true };
        } else if (res.data.status === "unfollowed") {
          return { ...u, is_following: false };
        }

        return u;
      })
    );

  } catch (err) {
    console.error(err);
  }
};

  return (

    <div className="followers-overlay">

      <div className="followers-modal">

        <div className="followers-header">
          <h3>{title}</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="followers-list">

          {localUsers.map(user => (

            <div key={user.id} className="follower-row">

              <div className="follower-info">

                <img
                  src={user.profile_picture}
                  alt=""
                  className="follower-avatar"
                />

                <span>@{user.username}</span>

              </div>

              {user.username === currentUser?.username ? (
                  <span className="you-label">You</span>
                ) : (
                  <button
                    className={`follow-btn ${user.is_following ? "following" : ""}`}
                    onClick={() => toggleFollow(user)}
                  >
                    {user.is_following ? "Following" : "Follow"}
                  </button>
                )}

            </div>

          ))}

        </div>

      </div>

    </div>

  );
};

export default FollowersModal;