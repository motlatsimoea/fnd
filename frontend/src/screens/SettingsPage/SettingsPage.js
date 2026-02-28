import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deactivateAccount, deleteAccount, logout } from '../../features/users/auth-slice';
import DeactivateModal from '../../components/modals/DeactivateModal';
import DeleteModal from '../../components/modals/DeleteModal';
import './SettingsPage.css';

const SettingsPage = () => {
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ Handle Deactivate
  const handleDeactivate = async (password) => {
    try {
      await dispatch(deactivateAccount(password)).unwrap();

      dispatch(logout());           // clear redux state
      setShowDeactivate(false);     // close modal
      navigate('/login');           // redirect to login

    } catch (error) {
      throw error; // let modal display incorrect password
    }
  };

  // ✅ Handle Delete
  const handleDelete = async (password) => {
    try {
      await dispatch(deleteAccount(password)).unwrap();

      dispatch(logout());           // clear redux state
      setShowDelete(false);         // close modal
      navigate('/register');        // redirect to register

    } catch (error) {
      throw error; // let modal display incorrect password
    }
  };

  return (
    <div className="settings-container">
      <h2>Account Settings</h2>

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

      {showDeactivate && (
        <DeactivateModal
          onClose={() => setShowDeactivate(false)}
          onConfirm={handleDeactivate}   // 🔥 now passes password
        />
      )}

      {showDelete && (
        <DeleteModal
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}       // 🔥 already password-aware
        />
      )}
    </div>
  );
};

export default SettingsPage;