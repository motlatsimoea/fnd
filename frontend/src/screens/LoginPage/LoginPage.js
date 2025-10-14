// LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, startTokenRefreshTimer } from '../../features/users/auth-slice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo, loading, error } = useSelector((state) => state.auth);

  const queryParams = new URLSearchParams(location.search);
  const message = queryParams.get('message');
  const errorMsg = queryParams.get('error');

  // If already logged in (user metadata exists), redirect
  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [userInfo, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // dispatch login and await result
      // EXPECTED: result === { user, access } or similar
      const result = await dispatch(login({ username, password })).unwrap();

      // If access token is returned, start refresh timer
      const access = result?.access || result?.data?.access;
      if (access) {
        startTokenRefreshTimer(dispatch, access);
      }

      // Navigate to home (or to a redirect query param if you use one)
      navigate('/');
    } catch (err) {
      // Error is handled by your slice (error in Redux state) but we still catch here
      // so the function doesn't throw. You could show a toast here if desired.
      // console.error('Login failed (component):', err);
    }
  };

  return (
    <div className="login-page">
      <h1>Login</h1>

      {/* Activation messages */}
      {message === 'activated' && (
        <Message variant="success">Your account has been activated. You can now log in.</Message>
      )}
      {message === 'already_active' && (
        <Message variant="info">Your account is already active. Please log in.</Message>
      )}
      {errorMsg === 'token_invalid' && (
        <Message variant="danger">The activation link is invalid or expired.</Message>
      )}
      {errorMsg === 'user_not_found' && (
        <Message variant="danger">User not found. Please register again.</Message>
      )}

      {/* Login error */}
      {error && <Message variant="danger">{error}</Message>}

      <form className="login-form" onSubmit={handleLogin}>
        <div className="form-group">
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? <Loader /> : 'Login'}
        </button>
      </form>

      <p className="register-link">
        Don't have an account? <Link to="/register">Register here</Link>.
      </p>
      <p className="register-link">
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
    </div>
  );
};

export default LoginPage;
