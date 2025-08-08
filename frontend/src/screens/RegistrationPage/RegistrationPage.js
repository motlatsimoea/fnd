import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../features/users/register-slice';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import './RegistrationPage.css';

const RegistrationPage = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.register);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    sectors: [],
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');

  const farmingSectors = [
    'Livestock', 'Crop Farming', 'Aquaculture', 'Horticulture', 'Agroforestry', 'Poultry Farming',
  ];

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const checkEmailExists = async () => {
    if (!formData.email || !validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: 'Valid email is required.' }));
      return;
    }
    try {
      const response = await axios.post('/api/check-email/', { email: formData.email });
      if (response.data.exists) {
        setErrors((prev) => ({ ...prev, email: 'Email already in use. Please use a different email.' }));
      } else {
        setErrors((prev) => ({ ...prev, email: null }));
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length < 6) return 'Weak';
    if (password.length < 10) return 'Moderate';
    return 'Strong';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: null }));

    if (name === 'password') setPasswordStrength(checkPasswordStrength(value));
    if (name === 'email' && validateEmail(value)) setErrors((prev) => ({ ...prev, email: null }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      sectors: checked
        ? [...prev.sectors, value]
        : prev.sectors.filter((sector) => sector !== value),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required.';
    if (!formData.email || !validateEmail(formData.email)) newErrors.email = 'Valid email is required.';
    if (!formData.password || formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    dispatch(registerUser(formData));
  };

  // ✅ Reset form on success
  useEffect(() => {
    if (message) {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        sectors: [],
      });
      setErrors({});
      setPasswordStrength('');
    }
  }, [message]);

  return (
    <div className="registration-page">
      <h1>Welcome to FND. Register here...</h1>

      {loading && <Loader />}
      {message && <Message variant="success">{message}</Message>}
      {error?.detail && <Message variant="danger">{error.detail}</Message>}

      <form onSubmit={handleSubmit} className="registration-form" noValidate>
        <label htmlFor="username">Username:</label>
        <input
          id="username" name="username" type="text" required
          value={formData.username} onChange={handleChange}
        />
        {errors.username && <p className="error">{errors.username}</p>}
        {error?.username && <p className="error">{error.username}</p>}

        <label htmlFor="email">Email:</label>
        <input
          id="email" name="email" type="email" required
          value={formData.email}
          onChange={handleChange}
          onBlur={checkEmailExists}
        />
        {errors.email && <p className="error">{errors.email}</p>}
        {error?.email && <p className="error">{error.email}</p>}

        <fieldset className="farming-sectors">
          <legend>Farming Sector(s):</legend>
          {farmingSectors.map((sector) => (
            <label key={sector}>
              <input
                type="checkbox"
                name="sectors"
                value={sector}
                checked={formData.sectors.includes(sector)}
                onChange={handleCheckboxChange}
              />
              {sector}
            </label>
          ))}
        </fieldset>

        <label htmlFor="password">Password:</label>
        <input
          id="password" name="password" type="password" required
          value={formData.password} onChange={handleChange}
        />
        {errors.password && <p className="error">{errors.password}</p>}
        {error?.password && <p className="error">{error.password}</p>}
        <p className={`strength ${passwordStrength.toLowerCase()}`}>Strength: {passwordStrength}</p>

        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          id="confirmPassword" name="confirmPassword" type="password" required
          value={formData.confirmPassword} onChange={handleChange}
        />
        {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}

        <button type="submit" disabled={loading}>Register</button>
      </form>

      <p className="login-link">
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
};

export default RegistrationPage;
