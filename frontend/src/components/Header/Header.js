import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchNotifications,
  fetchInboxNotifications
} from '../../features/notifications/notice-slice';
import { logout as logoutAction } from '../../features/users/auth-slice';
import { 
  fetchUserChats, selectUnreadCount 
} from '../../features/chats/Chat-slice';
import useNotificationsSocket from './NotificationSocket';
import axiosInstance, { setAccessToken } from '../../utils/axiosInstance';
import InboxModal from '../../components/chat/InboxModal';
import SearchBar from "../../components/Search/SearchBar";
import NotificationsModal from '../../components/NotificationsModal/NotificationsModal';

import {
  FaPlusCircle,
  FaBell,
  FaStore,
  FaBook,
  FaUserCircle,
  FaSignOutAlt,
  FaCogs,
  FaEnvelope,
  FaSignInAlt,
  FaUserPlus,
  FaInfoCircle
} from 'react-icons/fa';

import './Header.css';

const Header = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const inboxRef = useRef(null);
  const userMenuRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = useSelector((state) => state.auth.userInfo);

  // 🔔 unread notification badge
  const unreadNotifications = useSelector(
    (state) => state.notifications.general.unreadCount || 0
  );

  // 📩 unread inbox badge
  const unreadInboxCount = useSelector(selectUnreadCount);

  useNotificationsSocket();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/logout/');
      setAccessToken(null);
      dispatch(logoutAction());

      const bc = new BroadcastChannel('auth');
      bc.postMessage({ type: 'logout' });
      bc.close();

      navigate('/login');
    } catch {
      setAccessToken(null);
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  useEffect(() => {
    if (userInfo) {
      dispatch(fetchNotifications());
      dispatch(fetchInboxNotifications());
      dispatch(fetchUserChats());
    }
  }, [userInfo, dispatch]);

  useEffect(() => {
    setShowUserMenu(false);
    setShowInbox(false);
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    // User menu
    if (
      userMenuRef.current &&
      !userMenuRef.current.contains(event.target)
    ) {
      setShowUserMenu(false);
    }

    // Inbox
    if (
      inboxRef.current &&
      !inboxRef.current.contains(event.target)
    ) {
      setShowInbox(false);
    }

    // Notifications
    const notificationWrapper = document.querySelector(
      ".notification-wrapper"
    );

    if (
      notificationWrapper &&
      !notificationWrapper.contains(event.target)
    ) {
      setShowNotifications(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-item">
        <div className="logo">fnd</div>
      </Link>

      {userInfo && (
          <SearchBar />
      )}

      {userInfo ? (
        <>
          <div className="nav-links">
            <Link to="/create-post" className="nav-item">
              <FaPlusCircle />
            </Link>

            {/* About */}
            <Link to="/about" className="nav-item">
              <FaInfoCircle />
            </Link>

            {/* 🔔 Notifications */}
            <span className="notification-wrapper">
              <button
                className="nav-item notification-button"
                onClick={() => setShowNotifications((p) => !p)}
              >
                <FaBell />
                {unreadNotifications > 0 && (
                  <span className="notification-badge">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationsModal
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </span>

            {/* 📩 Inbox */}
            <span className="inbox-wrapper" ref={inboxRef}>
              <button
                className="nav-item inbox-button"
                onClick={() => setShowInbox((p) => !p)}
              >
                <FaEnvelope />
                {unreadInboxCount > 0 && (
                  <span className="notification-badge">
                    {unreadInboxCount}
                  </span>
                )}
              </button>

              {showInbox && (
                <InboxModal onClose={() => setShowInbox(false)} />
              )}
            </span>

            <Link to="/market" className="nav-item">
              <FaStore />
            </Link>

            <Link to="/info" className="nav-item">
              <FaBook />
            </Link>
          </div>

          <div className="user-dropdown" ref={userMenuRef}>
            <button
              className="user-btn"
              onClick={() => {
                setShowUserMenu((p) => !p);
                setShowInbox(false);
                setShowNotifications(false);
              }}
            >
              <FaUserCircle />
            </button>

            {showUserMenu && (
              <div className="user-menu">
                <Link
                  to={`/profile/${userInfo.username}`}
                  className="user-item"
                >
                  <FaUserCircle /> Profile
                </Link>

                <Link to="/settings" className="user-item">
                  <FaCogs /> Settings
                </Link>

                <span onClick={handleLogout} className="user-item">
                  <FaSignOutAlt /> Logout
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="nav-links">
          {/* About visible when logged out */}
          <Link to="/about" className="nav-item">
            <FaInfoCircle />
          </Link>

          <Link to="/login" className="nav-item">
            <FaSignInAlt /> Login
          </Link>

          <Link to="/register" className="nav-item">
            <FaUserPlus /> Register
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Header;