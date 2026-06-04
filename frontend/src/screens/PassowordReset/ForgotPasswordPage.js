import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset, clearResetStatus } from "../../features/users/auth-slice";
import Message from "../../components/Message";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./ForgotPasswordPage.css";

const ForgotPasswordPage = () => {
  const [contactMethod, setContactMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, resetStatus, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload =
      contactMethod === "email"
        ? { email }
        : { phone_number: `+${phoneNumber}` };

    const result = await dispatch(requestPasswordReset(payload));

    if (requestPasswordReset.fulfilled.match(result)) {
      if (result.payload.channel === "phone") {
        navigate("/reset-password-phone", {
          state: { userId: result.payload.user_id },
        });
      }
    }
  };

  useEffect(() => {
    dispatch(clearResetStatus());
  }, [dispatch]);

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card animate-fadein">
        <h1>Forgot Password</h1>

        <p className="description">
          Enter your email or phone number and we’ll send password reset instructions.
        </p>

        {resetStatus && <Message variant="success">{resetStatus}</Message>}
        {error && <Message variant="danger">{error}</Message>}

        <div className="contact-toggle">
          <button
            type="button"
            className={contactMethod === "email" ? "active" : ""}
            onClick={() => setContactMethod("email")}
          >
            Email
          </button>

          <button
            type="button"
            className={contactMethod === "phone" ? "active" : ""}
            onClick={() => setContactMethod("phone")}
          >
            Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {contactMethod === "email" ? (
            <input
              type="email"
              value={email}
              placeholder="Enter your email address"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          ) : (
            <PhoneInput
              country="za"
              value={phoneNumber}
              onChange={(phone) => setPhoneNumber(phone)}
            />
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Instructions"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;