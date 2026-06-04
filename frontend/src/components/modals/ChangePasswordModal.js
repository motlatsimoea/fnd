import { useState } from "react";
import "./DeactivateModal.css";

const ChangePasswordModal = ({ onClose, onConfirm }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await onConfirm({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
    } catch (err) {
      setError(err || "Password change failed.");
    }
  };

  return (
    <div className="deactivate-modal-overlay">
      <div className="deactivate-modal">
        <h3>Change Password</h3>

        <p>Enter your current password and choose a new password.</p>

        <input
          type="password"
          className="modal-input"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setError("");
          }}
        />

        <input
          type="password"
          className="modal-input"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setError("");
          }}
        />

        <input
          type="password"
          className="modal-input"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
        />

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions">
          <button className="confirm-btn" onClick={handleConfirm}>
            Change Password
          </button>

          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;