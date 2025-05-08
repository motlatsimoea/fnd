import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { markNotificationAsRead } from '.././features/notifications/notice-slice';
import useNotificationsSocket from '.NotificationsSocket';
import {
  FaPlusCircle, FaBell, FaStore, FaInfoCircle,
  FaBook, FaUserCircle, FaSignOutAlt, FaCogs, FaEnvelope
} from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dispatch = useDispatch();

  const notifications = useSelector((state) => state.notifications.general.items);
  const unreadCount = useSelector((state) => state.notifications.general.unreadCount);

  useNotificationsSocket();

  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Auto-mark unread notifications as read when the modal opens
  useEffect(() => {
    if (showNotifications) {
      notifications.forEach((n) => {
        if (!n.is_read) dispatch(markNotificationAsRead(n.notification_id));
      });
    }
  }, [showNotifications, notifications, dispatch]);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-item"><div className="logo">Logo</div></Link>

      <div className="nav-links">
        <Link to="/create-post" className="nav-item"><FaPlusCircle /></Link>

        <span className="notification-wrapper">
          <span className="nav-item" onClick={toggleNotifications}>
            <FaBell />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </span>

          {showNotifications && (
            <div className="notifications-modal">
              <h4>Notifications</h4>
              <ul>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <li key={notification.notification_id}>
                      <Link
                        to={notification.link || '#'}
                        onClick={() => {
                          if (!notification.is_read) {
                            dispatch(markNotificationAsRead(notification.notification_id));
                          }
                          toggleNotifications();
                        }}
                      >
                        {notification.message}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li>No notifications</li>
                )}
              </ul>
              <button onClick={toggleNotifications} className="close-modal">
                Close
              </button>
            </div>
          )}
        </span>

        <Link to="/market" className="nav-item"><FaStore /></Link>
        <Link to="/inbox" className="nav-item"><FaEnvelope /></Link>
        <Link to="/info" className="nav-item"><FaBook /></Link>
      </div>

      <div className="user-dropdown">
        <button className="user-btn" onClick={toggleUserMenu}><FaUserCircle /></button>
        {showUserMenu && (
          <div className="user-menu">
            <Link to="/settings" className="user-item"><FaCogs /> Settings</Link>
            <Link to="/logout" className="user-item"><FaSignOutAlt /> Logout</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
