import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { markNotificationAsRead, fetchNotifications, fetchInboxNotifications } from '../../features/notifications/notice-slice';
import { logout as logoutAction } from '../../features/users/auth-slice';
import useNotificationsSocket from './NotificationSocket';
import axiosInstance, { setAccessToken } from '../../utils/axiosInstance';
import InboxModal from '../../components/chat/InboxModal';
import {
  FaPlusCircle, FaBell, FaStore,
  FaBook, FaUserCircle, FaSignOutAlt, FaCogs,
  FaEnvelope, FaSignInAlt, FaUserPlus
} from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInbox, setShowInbox] = useState(false); // ✅ Added inbox state
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = useSelector((state) => state.auth.userInfo);
  const notifications = useSelector((state) => state.notifications.general.items || []);
  const unreadCount = useSelector((state) => state.notifications.general.unreadCount || 0);

  useNotificationsSocket();

  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);
  const toggleNotifications = () => setShowNotifications(!showNotifications);

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/logout/');
      setAccessToken(null);
      dispatch(logoutAction());

      try {
        const bc = new BroadcastChannel('auth');
        bc.postMessage({ type: 'logout' });
        bc.close();
      } catch {}

      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setAccessToken(null);
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  useEffect(() => {
    if (userInfo) {
      dispatch(fetchNotifications());
      dispatch(fetchInboxNotifications());
    }
  }, [userInfo, dispatch]);

  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // auto mark as read when dropdown opens
  useEffect(() => {
    if (showNotifications && notifications.length > 0) {
      notifications.forEach((n) => {
        if (!n.is_read && n.id) {
          dispatch(markNotificationAsRead(n.id));
        }
      });
    }
  }, [showNotifications, notifications, dispatch]);

  // handle cross-tab logout
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('auth');
      const onMessage = (ev) => {
        if (ev?.data?.type === 'logout') {
          setAccessToken(null);
          dispatch(logoutAction());
          navigate('/login');
        }
      };
      bc.addEventListener('message', onMessage);
      return () => {
        bc.removeEventListener('message', onMessage);
        bc.close();
      };
    } catch {
      return undefined;
    }
  }, [dispatch, navigate]);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-item">
        <div className="logo">fnd</div>
      </Link>

      {userInfo ? (
        <>
          <div className="nav-links">
            <Link to="/create-post" className="nav-item" title="Create Post"><FaPlusCircle /></Link>

            {/* 🔔 Notifications */}
            <span className="notification-wrapper">
              <button
                className="nav-item notification-button"
                onClick={toggleNotifications}
                title="Notifications"
                style={{ cursor: 'pointer' }}
              >
                <FaBell />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notifications-modal inbox-modal">
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    <button onClick={toggleNotifications} className="close-btn">&times;</button>
                  </div>

                  <ul className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications
                        .slice()
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .map((notification) => (
                          <li
                            key={notification.id}
                            className={notification.is_read ? 'read' : 'unread'}
                          >
                            <Link
                              to={notification.link || '#'}
                              className="notification-item"
                              onClick={() => {
                                if (!notification.is_read && notification.id) {
                                  dispatch(markNotificationAsRead(notification.id));
                                }
                                toggleNotifications();
                              }}
                            >
                              <div className="notification-content">
                                <p className="notification-message">
                                  <strong>{notification.sender_username || 'User'}</strong>:{" "}
                                  {notification.message && notification.message.length > 40
                                    ? notification.message.slice(0, 40) + '...'
                                    : notification.message}
                                </p>
                                <span className="notification-time">
                                  {notification.timestamp
                                    ? new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : ''}
                                </span>
                              </div>
                            </Link>
                          </li>
                        ))
                    ) : (
                      <li className="no-notifications">No notifications</li>
                    )}
                  </ul>
                </div>
              )}
            </span>

            <Link to="/market" className="nav-item" title="Marketplace"><FaStore /></Link>

            {/* 📩 Inbox */}
            <span className="inbox-wrapper">
              <button
                className="nav-item inbox-button"
                onClick={() => setShowInbox(true)}
                title="Inbox"
              >
                <FaEnvelope />
              </button>
              {showInbox && <InboxModal onClose={() => setShowInbox(false)} />}
            </span>

            <Link to="/info" className="nav-item" title="Info"><FaBook /></Link>
          </div>

          <div className="user-dropdown">
            <button className="user-btn" onClick={toggleUserMenu}><FaUserCircle /></button>
            {showUserMenu && (
              <div className="user-menu">
                <Link to="/settings" className="user-item"><FaCogs /> Settings</Link>
                <span onClick={handleLogout} className="user-item" style={{ cursor: 'pointer' }}>
                  <FaSignOutAlt /> Logout
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="nav-links">
          <Link to="/login" className="nav-item">
            <FaSignInAlt style={{ marginRight: '5px' }} />
            Login
          </Link>
          <Link to="/register" className="nav-item">
            <FaUserPlus style={{ marginRight: '5px' }} />
            Register
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Header;
