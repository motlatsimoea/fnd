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

  // If already logged in (user metadata exists), redirect to home
  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [userInfo, navigate]);

  // Get the route user originally tried to access
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // dispatch login and await result
      const result = await dispatch(login({ username, password })).unwrap();

      // If access token is returned, start refresh timer
      const access = result?.access || result?.data?.access;
      if (access) {
        startTokenRefreshTimer(dispatch, access);
      }

      // Navigate to original page, or home if none
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled via Redux slice
    }
  };

  return (
    <div className="login-page">
      <h1>Login</h1>

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
