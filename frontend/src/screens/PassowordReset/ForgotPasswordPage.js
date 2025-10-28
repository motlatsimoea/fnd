// ForgotPasswordPage.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { requestPasswordReset } from "../../features/users/auth-slice";
import Message from "../../components/Message";
import "./ForgotPasswordPage.css";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const { loading, resetStatus, error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(requestPasswordReset(email));
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card animate-fadein">
        <h1>Forgot Password</h1>
        <p className="description">
          Don’t worry — it happens to the best of us. Enter your email below and we’ll
          send you a password reset link.
        </p>

        {resetStatus && <Message variant="success">{resetStatus}</Message>}
        {error && <Message variant="danger">{error}</Message>}

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <label htmlFor="email" className="sr-only">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            placeholder="Enter your email address"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
