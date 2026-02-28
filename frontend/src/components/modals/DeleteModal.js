import { useState } from 'react';
import './DeleteModal.css';

const DeleteModal = ({ onClose, onConfirm }) => {
  const [password, setPassword] = useState('');

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Permanently Delete Account</h3>
        <p>
          This action cannot be undone.
          Your account and all related data will be permanently deleted.
        </p>

        <input
          type="password"
          placeholder="Enter your password to confirm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="modal-input"
        />

        <div className="modal-actions">
          <button
            className="delete-confirm-btn"
            onClick={() => onConfirm(password)}
            disabled={!password}
          >
            Delete Permanently
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;