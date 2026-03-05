// src/components/notifications/NotificationsModal.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { markNotificationAsRead } from '../../features/notifications/notice-slice';
import { FaHeart, FaCommentDots, FaReply, FaAt } from "react-icons/fa";
import './NotificationsModal.css';

const getNotificationIcon = (type) => {
  switch (type) {
    case "like":
      return <FaHeart className="notification-icon like" />;
    case "comment":
      return <FaCommentDots className="notification-icon comment" />;
    case "reply":
      return <FaReply className="notification-icon reply" />;
    case "mention":
      return <FaAt className="notification-icon mention" />;
    default:
      return null;
  }
};

const NotificationsModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.notifications.general.items);

  const handleClick = (notification) => {
    console.log('Notification:', notification);
    console.log("notifications length:", notifications.length);

    if (!notification.is_read) {
      dispatch(markNotificationAsRead(notification.id));
    }

    onClose?.();
  };

  return (
    <div className="notifications-modal-overlay" onClick={onClose}>
      <div
        className="notifications-modal-content"
        onClick={e => e.stopPropagation()}
      >
        <div className="notifications-modal-header">
          <h3>Notifications</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">No notifications</div>
        ) : (
          <ul className="notifications-list">
            {notifications.map(n => (
              <li
                key={n.id}
                className={`notification-item ${n.is_read ? 'read' : 'unread'}`}
              >

                {/* Avatar */}
                <div className="notification-avatar">
                  {n.sender_avatar ? (
                    <img src={n.sender_avatar} alt={n.sender_username} />
                  ) : (
                    <div className="avatar-fallback">
                      {n.sender_username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Notification body */}
                <div className="notification-body">

                  {n.post_id ? (
                    <>

                      {/* Username */}
                      <Link
                        to={`/profile/${n.sender_username}`}
                        className="username-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {n.sender_username}
                      </Link>{" "}

                      {/* Notification text */}
                      <Link
                        to={`/blog/${n.post_id}`}
                        className="notification-link"
                        onClick={() => handleClick(n)}
                      >

                        <span className="notification-text">

                          {getNotificationIcon(n.notification_type)}

                          {n.notification_type === "like" && " liked your post"}
                          {n.notification_type === "comment" && " commented on your post"}
                          {n.notification_type === "reply" && " replied to your comment"}
                          {n.notification_type === "mention" && " mentioned you in a post"}

                        </span>

                      </Link>

                    </>
                  ) : (
                    <span>{n.message}</span>
                  )}

                  <span className="timestamp">
                    {new Date(n.timestamp).toLocaleString()}
                  </span>

                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsModal;