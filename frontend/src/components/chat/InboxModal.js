import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserChats } from "../../features/chats/Chat-slice";
import ChatPanel from "./ChatPanel";
import "./InboxModal.css";

const InboxModal = ({ onClose }) => {
  const dispatch = useDispatch();

  const [selectedChatKey, setSelectedChatKey] = useState(null);

  const { chatRooms = [], loading, error } = useSelector(
    (state) => state.chats
  );

  const userId = useSelector((state) => state.auth.userInfo?.id);

  useEffect(() => {
    dispatch(fetchUserChats());
  }, [dispatch]);

  const renderError = () => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") return error.detail || JSON.stringify(error);
    return String(error);
  };

  const sortedChats = [...chatRooms].sort((a, b) => {
    if (a.unread_count > 0 && b.unread_count === 0) return -1;
    if (a.unread_count === 0 && b.unread_count > 0) return 1;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  if (selectedChatKey) {
    return (
      <div className="inbox-modal inbox-chat-view">
        <ChatPanel
          chatKey={selectedChatKey}
          onBack={() => setSelectedChatKey(null)}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="inbox-modal">
      <div className="modal-header">
        <h3>Messages</h3>

        <button onClick={onClose} className="close-btn">
          ✕
        </button>
      </div>

      {loading && <p className="modal-state">Loading chats...</p>}
      {error && <p className="modal-error">{renderError()}</p>}

      <ul className="chat-list">
        {sortedChats.length > 0 ? (
          sortedChats.map((chat) => {
            const otherUsers =
              chat.participants?.filter((p) => p.id !== userId) || [];

            const isUnread = chat.unread_count > 0;

            return (
              <li
                key={chat.id}
                className={`chat-item ${isUnread ? "chat-unread" : ""}`}
              >
                <button
                  type="button"
                  className="chat-item-button"
                  onClick={() => setSelectedChatKey(chat.unique_key)}
                >
                  <div className="avatar-wrapper">
                    {otherUsers.map((u) => (
                      <img
                        key={u.id}
                        src={u.profile_picture || "/default-avatar.png"}
                        alt={u.username}
                        className="chat-avatar"
                      />
                    ))}
                  </div>

                  <div className="chat-info">
                    <div className="chat-top">
                      <span className="chat-username">
                        {otherUsers.map((u) => u.username).join(", ")}
                      </span>

                      {isUnread && (
                        <span className="chat-unread-badge">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>

                    <span className="chat-preview-message">
                      {chat.last_message?.text || "No messages yet"}
                    </span>
                  </div>
                </button>
              </li>
            );
          })
        ) : (
          !loading && <li className="modal-state">No chats yet.</li>
        )}
      </ul>
    </div>
  );
};

export default InboxModal;