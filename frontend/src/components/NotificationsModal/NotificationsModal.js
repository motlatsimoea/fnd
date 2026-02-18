// src/components/notifications/NotificationsModal.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { markNotificationAsRead } from '../../features/notifications/notice-slice';
import './NotificationsModal.css';

const NotificationsModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.notifications.general.items);

  const handleClick = (notification) => {
    console.log('Notification:', notification); // ✅ DEBUG LINE

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
                {n.post_id ? (
                  <>
                    {/* Profile Link */}
                    <Link
                      to={`/profile/${n.sender_username}`}
                      className="username-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Notification:', n); // ✅ DEBUG HERE TOO
                      }}
                    >
                      {n.sender_username}
                    </Link>{' '}

                    {/* Blog Post Link */}
                    <Link
                      to={`/blog/${n.post_id}`}
                      className="notification-link"
                      onClick={() => handleClick(n)}
                    >
                      {n.notification_type === 'like' && 'liked your post'}
                      {n.notification_type === 'comment' && 'commented on your post'}
                      {n.notification_type === 'reply' && 'replied to your comment'}
                    </Link>
                  </>
                ) : (
                  <span>{n.message}</span>
                )}

                <span className="timestamp">
                  {new Date(n.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsModal;
