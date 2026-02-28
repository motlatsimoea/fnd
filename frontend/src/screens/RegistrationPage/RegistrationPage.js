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
    agreedToTerms: false,   // ✅ added
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');

  const farmingSectors = [
    'Livestock','Crop Farming','Aquaculture','Horticulture',
    'Agroforestry','Poultry Farming','Dairy Farming','Beekeeping',
    'Viticulture(Grapes & Wine)','Sericulture(Silk Production)',
    'Mushroom Farming','Organic Farming','Greenhouse Farming',
    'Hydroponics','Arable Farming','Mixed Farming',
    'Fish Farming','Goat Farming','Sheep Farming','Pig Farming'
  ];

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const checkEmailExists = async () => {
    if (!formData.email || !validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: 'Valid email is required.' }));
      return;
    }
    try {
      const response = await axios.post('/api/users/check-email/', { email: formData.email });
      if (response.data.exists) {
        setErrors((prev) => ({ ...prev, email: 'Email already in use.' }));
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
    const { name, value, type, checked } = e.target;

    const newValue = type === "checkbox" ? checked : value;

    setFormData({ ...formData, [name]: newValue });
    setErrors((prev) => ({ ...prev, [name]: null }));

    if (name === 'password')
      setPasswordStrength(checkPasswordStrength(value));
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

    if (!formData.username)
      newErrors.username = 'Username is required.';

    if (!formData.email || !validateEmail(formData.email))
      newErrors.email = 'Valid email is required.';

    if (!formData.password || formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters.';

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';

    if (!formData.agreedToTerms)
      newErrors.agreedToTerms = 'You must agree to the Terms and Privacy Policy.';

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clientErrors = validateForm();

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    // Map frontend field to backend field
    const payload = {
      ...formData,
      agreed_to_terms: formData.agreedToTerms,
    };

    dispatch(registerUser(payload));
  };

  useEffect(() => {
    if (message) {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        sectors: [],
        agreedToTerms: false,
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

        {/* Username */}
        <label>Username:</label>
        <input
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
        />
        {errors.username && <p className="error">{errors.username}</p>}

        {/* Email */}
        <label>Email:</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={checkEmailExists}
        />
        {errors.email && <p className="error">{errors.email}</p>}

        {/* Sectors */}
        <fieldset className="farming-sectors">
          <legend>Farming Sector(s):</legend>
          {farmingSectors.map((sector) => (
            <label key={sector}>
              <input
                type="checkbox"
                value={sector}
                checked={formData.sectors.includes(sector)}
                onChange={handleCheckboxChange}
              />
              {sector}
            </label>
          ))}
        </fieldset>

        {/* Password */}
        <label>Password:</label>
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
        />
        {errors.password && <p className="error">{errors.password}</p>}
        <p className={`strength ${passwordStrength.toLowerCase()}`}>
          Strength: {passwordStrength}
        </p>

        {/* Confirm Password */}
        <label>Confirm Password:</label>
        <input
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}

        {/* ✅ Terms Agreement */}
        <div className="terms-agreement">
          <label>
            <input
              type="checkbox"
              name="agreedToTerms"
              checked={formData.agreedToTerms}
              onChange={handleChange}
            />
            I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </label>
        </div>
        {errors.agreedToTerms && (
          <p className="error">{errors.agreedToTerms}</p>
        )}

        <button
          type="submit"
          disabled={loading || !formData.agreedToTerms}
        >
          Register
        </button>
      </form>

      <p className="login-link">
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
};

export default RegistrationPage;