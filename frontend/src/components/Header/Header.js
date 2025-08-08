// Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { markNotificationAsRead } from '../../features/notifications/notice-slice';
import { logout as logoutAction } from '../../features/users/auth-slice';
import useNotificationsSocket from './NotificationSocket';
import axiosInstance, { setAccessToken } from '../../utils/axiosInstance';
import {
  FaPlusCircle, FaBell, FaStore,
  FaBook, FaUserCircle, FaSignOutAlt, FaCogs,
  FaEnvelope, FaSignInAlt, FaUserPlus
} from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = useSelector((state) => state.auth.userInfo);
  const notifications = useSelector((state) => state.notifications.general.items);
  const unreadCount = useSelector((state) => state.notifications.general.unreadCount);

  useNotificationsSocket();

  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);
  const toggleNotifications = () => setShowNotifications(!showNotifications);

  // logout handler: call server to blacklist & clear cookie, clear client state
  const handleLogout = async () => {
    try {
      // Call backend to blacklist the refresh token and delete the cookie.
      // Backend should read the HttpOnly cookie and return a 204/200 and delete it via response.delete_cookie(...)
      await axiosInstance.post('/logout/');

      // Clear in-memory access token
      setAccessToken(null);

      // Clear redux state
      dispatch(logoutAction());

      // Broadcast to other tabs/windows
      try {
        const bc = new BroadcastChannel('auth');
        bc.postMessage({ type: 'logout' });
        bc.close();
      } catch (err) {
        // BroadcastChannel not available — ignore
      }

      navigate('/login');
    } catch (err) {
      // If server call fails, still clear client state to avoid stuck UX
      console.error('Logout failed:', err);
      setAccessToken(null);
      dispatch(logoutAction());
      try {
        const bc = new BroadcastChannel('auth');
        bc.postMessage({ type: 'logout' });
        bc.close();
      } catch (_) {}
      navigate('/login');
    }
  };

  // Close menus on route change
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // When user clicks notifications panel, mark unread notifications as read
  useEffect(() => {
    if (showNotifications) {
      notifications.forEach((n) => {
        if (!n.is_read && n.notification_id) {
          dispatch(markNotificationAsRead(n.notification_id));
        }
      });
    }
  }, [showNotifications, notifications, dispatch]);

  // Listen for cross-tab logout messages (so other tabs also clear UI)
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
    } catch (err) {
      // BroadcastChannel unsupported — fallback could use localStorage events if needed
      return undefined;
    }
  }, [dispatch, navigate]);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-item">
        <div className="logo">Logo</div>
      </Link>

      {userInfo ? (
        <>
          <div className="nav-links">
            <Link to="/create-post" className="nav-item" title="Create Post"><FaPlusCircle /></Link>

            <span className="notification-wrapper">
              <span className="nav-item" onClick={toggleNotifications} title="Notifications">
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
                              if (!notification.is_read && notification.notification_id) {
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

            <Link to="/market" className="nav-item" title="Marketplace"><FaStore /></Link>
            <Link to="/inbox" className="nav-item" title="Inbox"><FaEnvelope /></Link>
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
