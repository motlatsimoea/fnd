import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { verifyOTP } from '../../features/users/auth-slice';
import './RegistrationPage.css';

const VerifyOTPPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const { userId } = useSelector(state => state.register);
  const { loading, error } = useSelector(state => state.auth);

  const handleVerify = async () => {
    if (!otp) {
      setLocalError('Please enter the OTP code.');
      return;
    }

    setLocalError('');
    setSuccessMessage('');

    try {
      const result = await dispatch(
        verifyOTP({
          user_id: userId,
          code: otp,
        })
      ).unwrap();

      setSuccessMessage(result.message || 'Account verified successfully. Redirecting to login...');

      setTimeout(() => {
        navigate('/login');
      }, 1800);
    } catch (err) {
      setLocalError(err || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-form">
        <h1>Verify Your Account</h1>

        {successMessage && (
          <p className="success">{successMessage}</p>
        )}

        {(localError || error) && (
          <p className="error">{localError || error}</p>
        )}

        <label>Enter OTP</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value);
            setLocalError('');
          }}
          placeholder="6-digit code"
          maxLength="6"
        />

        <button onClick={handleVerify} disabled={loading || successMessage}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  );
};

export default VerifyOTPPage;