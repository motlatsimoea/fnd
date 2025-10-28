// ResetPasswordPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { resetPasswordConfirm } from "../../features/users/auth-slice";
import Message from "../../components/Message";
import "./ResetPasswordPage.css";

const ResetPasswordPage = () => {
  const { uid, token } = useParams();
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, resetStatus, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(resetPasswordConfirm({ uid, token, password }));
    if (resetPasswordConfirm.fulfilled.match(result)) {
      navigate("/login?message=reset_success");
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card animate-fadein">
        <h1>Set a New Password</h1>
        <p className="description">
          Enter your new password below to regain access to your account.
        </p>

        {resetStatus && <Message variant="success">{resetStatus}</Message>}
        {error && <Message variant="danger">{error}</Message>}

        <form onSubmit={handleSubmit} className="reset-password-form">
          <label htmlFor="password" className="sr-only">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            placeholder="Enter new password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
