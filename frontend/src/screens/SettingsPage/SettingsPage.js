import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  deactivateAccount,
  deleteAccount,
  logout,
  changePassword,
} from '../../features/users/auth-slice';

import DeactivateModal from '../../components/modals/DeactivateModal';
import DeleteModal from '../../components/modals/DeleteModal';
import ChangePasswordModal from '../../components/modals/ChangePasswordModal';
import './SettingsPage.css';

const SettingsPage = () => {
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChangePassword = async (passwordData) => {
    try {
      const result = await dispatch(changePassword(passwordData)).unwrap();

      setSuccessMessage(result?.detail || "Password changed successfully.");
      setErrorMessage("");
      setShowChangePassword(false);

      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      setErrorMessage(error);
      throw error;
    }
  };

  const handleDeactivate = async (password) => {
    try {
      await dispatch(deactivateAccount(password)).unwrap();

      dispatch(logout());
      setShowDeactivate(false);
      navigate('/login');
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (password) => {
    try {
      await dispatch(deleteAccount(password)).unwrap();

      dispatch(logout());
      setShowDelete(false);
      navigate('/register');
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="settings-container">
      <h2>Account Settings</h2>

      {successMessage && (
        <div className="settings-alert success">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="settings-alert error">
          {errorMessage}
        </div>
      )}

      <div className="account-section">
        <h3>Security</h3>

        <button
          className="change-password-btn"
          onClick={() => {
            setSuccessMessage("");
            setErrorMessage("");
            setShowChangePassword(true);
          }}
        >
          Change Password
        </button>
      </div>

      <div className="danger-zone">
        <h3>Danger Zone</h3>

        <button
          className="deactivate-btn"
          onClick={() => setShowDeactivate(true)}
        >
          Deactivate Account
        </button>

        <button
          className="delete-btn"
          onClick={() => setShowDelete(true)}
        >
          Delete Account Permanently
        </button>
      </div>

      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onConfirm={handleChangePassword}
        />
      )}

      {showDeactivate && (
        <DeactivateModal
          onClose={() => setShowDeactivate(false)}
          onConfirm={handleDeactivate}
        />
      )}

      {showDelete && (
        <DeleteModal
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default SettingsPage;