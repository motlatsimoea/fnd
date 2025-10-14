// ForgotPasswordPage.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { requestPasswordReset } from "../../features/users/auth-slice";
import Message from "../../components/Message";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const { loading, resetStatus, error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(requestPasswordReset(email));
  };

  return (
    <div className="login-page">
      <h1>Forgot Password</h1>
      {resetStatus && <Message variant="success">{resetStatus}</Message>}
      {error && <Message variant="danger">{error}</Message>}
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          value={email}
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="login-button" disabled={loading}>
          Send Reset Link
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
