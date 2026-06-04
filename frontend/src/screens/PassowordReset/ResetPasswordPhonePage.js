import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { resetPasswordPhoneConfirm } from "../../features/users/auth-slice";
import Message from "../../components/Message";
import "./ResetPasswordPhonePage.css";

const ResetPasswordPhonePage = () => {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userId = location.state?.userId;

  const { loading, resetStatus, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setLocalError("Reset session expired. Please request a new OTP.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    const result = await dispatch(
      resetPasswordPhoneConfirm({
        user_id: userId,
        code,
        password,
      })
    );

    if (resetPasswordPhoneConfirm.fulfilled.match(result)) {
      navigate("/login?message=reset_success");
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card animate-fadein">
        <h1>Reset Password</h1>

        <p className="description">
          Enter the OTP sent to your phone number and choose a new password.
        </p>

        {resetStatus && <Message variant="success">{resetStatus}</Message>}
        {(error || localError) && (
          <Message variant="danger">{localError || error}</Message>
        )}

        <form onSubmit={handleSubmit} className="reset-password-form">
          <label htmlFor="code" className="sr-only">
            OTP Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            placeholder="Enter 6-digit OTP"
            onChange={(e) => {
              setCode(e.target.value);
              setLocalError("");
            }}
            maxLength="6"
            required
          />

          <label htmlFor="password" className="sr-only">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            placeholder="Enter new password"
            onChange={(e) => {
              setPassword(e.target.value);
              setLocalError("");
            }}
            required
          />

          <label htmlFor="confirmPassword" className="sr-only">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            placeholder="Confirm new password"
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setLocalError("");
            }}
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

export default ResetPasswordPhonePage;