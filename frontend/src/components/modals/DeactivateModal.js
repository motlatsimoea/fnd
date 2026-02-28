import './DeactivateModal.css';

const DeactivateModal = ({ onClose, onConfirm }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Deactivate Account</h3>
        <p>
          Your account will be deactivated immediately.
          You will have 30 days to log back in.
          After 30 days, your account will be permanently deleted.
        </p>

        <div className="modal-actions">
          <button className="confirm-btn" onClick={onConfirm}>
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