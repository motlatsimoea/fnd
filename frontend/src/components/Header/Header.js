import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { FaPlusCircle, FaBell, FaStore, FaInfoCircle, FaBook, FaUserCircle, FaSignOutAlt, FaCogs, FaEnvelope } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: 'New comment on your post', link: '/comments' },
    { id: 2, message: 'New like on your post', link: '/likes' },
    { id: 3, message: 'You have a new follower', link: '/followers' },
  ];

  // Toggle the user menu
  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);

  // Toggle the notifications modal
  const toggleNotifications = () => setShowNotifications(!showNotifications);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-item">
        <div className="logo">Logo</div>
      </Link>
      

      {/* Navbar Items */}
      <div className="nav-links">
        {/* Post Icon */}
        <Link to="/create-post" className="nav-item">
          <FaPlusCircle />
        </Link>

        {/* Notification Icon */}
        <span className="notification-wrapper">
          <span className="nav-item" onClick={toggleNotifications}>
            <FaBell />
          </span>
          {showNotifications && (
            <div className="notifications-modal">
              <h4>Notifications</h4>
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <Link to={notification.link}>{notification.message}</Link>
                  </li>
                ))}
              </ul>
              <button onClick={toggleNotifications} className="close-modal">
                Close
              </button>
            </div>
          )}
        </span>

        {/* Market Icon */}
        <Link to="/market" className="nav-item">
          <FaStore />
        </Link>

        {/* Inbox Icon */}
        <Link to="/inbox" className="nav-item">
          <FaEnvelope />
        </Link>

        {/* Info Icon */}
        <Link to="/info" className="nav-item">
          <FaBook />
        </Link>
      </div>

      {/* User Dropdown Menu */}
      <div className="user-dropdown">
        <button className="user-btn" onClick={toggleUserMenu}>
          <FaUserCircle />
        </button>
        {showUserMenu && (
          <div className="user-menu">
            <Link to="/settings" className="user-item">
              <FaCogs /> Settings
            </Link>
            <Link to="/logout" className="user-item">
              <FaSignOutAlt /> Logout
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
