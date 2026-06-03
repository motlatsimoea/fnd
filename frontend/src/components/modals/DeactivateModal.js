import { useState } from "react";
import "./DeactivateModal.css";

const DeactivateModal = ({ onClose, onConfirm }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      await onConfirm(password);
    } catch (err) {
      setError(err || "Incorrect password. Please try again.");
    }
  };

  return (
    <div className="deactivate-modal-overlay">
      <div className="deactivate-modal">
        <h3>Deactivate Account</h3>

        <p>
          Your account will be deactivated immediately. You will have 30 days
          to log back in. After 30 days, your account may be permanently
          deleted.
        </p>

        <input
          type="password"
          className="modal-input"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
        />

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions">
          <button className="confirm-btn" onClick={handleConfirm}>
            Confirm Deactivation
          </button>

          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateModal;