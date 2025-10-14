// ResetPasswordPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { resetPasswordConfirm } from "../../features/users/auth-slice";
import Message from "../../components/Message";

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
    <div className="login-page">
      <h1>Set New Password</h1>
      {resetStatus && <Message variant="success">{resetStatus}</Message>}
      {error && <Message variant="danger">{error}</Message>}
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="password"
          value={password}
          placeholder="New password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="login-button" disabled={loading}>
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
