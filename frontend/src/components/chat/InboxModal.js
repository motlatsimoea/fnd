// src/components/chat/InboxModal.js
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserChats } from "../../features/chats/Chat-slice";
import { Link } from "react-router-dom";
import "./InboxModal.css"; // ✅ Import the CSS

const InboxModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { chatRooms = [], loading, error } = useSelector((state) => state.chats);
  const userId = useSelector((state) => state.auth.userInfo?.id);

  useEffect(() => {
    dispatch(fetchUserChats());
  }, [dispatch]);

  // Normalize error to string for rendering
  const renderError = () => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") return error.detail || JSON.stringify(error);
    return String(error);
  };

  return (
    <div className="inbox-modal">
      <div className="modal-header">
        <h4>Messages</h4>
        <button onClick={onClose} className="close-btn">&times;</button>
      </div>

      {loading && <p>Loading chats...</p>}
      {error && <p className="error">{renderError()}</p>}

      <ul className="chat-list">
        {chatRooms.length > 0 ? (
          chatRooms.map((chat) => {
            const otherUsers = chat.participants?.filter((p) => p.id !== userId) || [];
            const lastMessage = chat.last_message;
            const isUnread = lastMessage?.read === false && lastMessage?.senderId !== userId;

            return (
              <li key={chat.id} className={`chat-item ${isUnread ? 'chat-unread' : ''}`}>
                <Link to={`/chat/${chat.id}`} onClick={onClose}>
                  {otherUsers.map((u) => (
                    <img
                      key={u.id}
                      src={u.profile_picture || '/default-avatar.png'}
                      alt={u.username}
                      className="chat-avatar"
                    />
                  ))}
                  <div className="chat-info">
                    <span className="chat-username">
                      {otherUsers.map(u => u.username).join(", ")}
                    </span>
                    <span className="chat-message">
                      {lastMessage ? lastMessage.content : 'No messages yet...'}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })
        ) : (
          !loading && <li>No chats yet.</li>
        )}
      </ul>
    </div>
  );
};

export default InboxModal;
