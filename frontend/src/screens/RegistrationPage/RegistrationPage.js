import React, { useState } from 'react';
import './RegistrationPage.css';

const RegistrationPage = () => {
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
    'Livestock',
    'Crop Farming',
    'Aquaculture',
    'Horticulture',
    'Agroforestry',
    'Poultry Farming',
  ];

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const checkPasswordStrength = (password) => {
    if (password.length < 6) {
      return 'Weak';
    } else if (password.length < 10) {
      return 'Moderate';
    } else {
      return 'Strong';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevState) => {
      if (checked) {
        return { ...prevState, sectors: [...prevState.sectors, value] };
      } else {
        return {
          ...prevState,
          sectors: prevState.sectors.filter((sector) => sector !== value),
        };
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required.';
    if (!formData.email || !validateEmail(formData.email))
      newErrors.email = 'Valid email is required.';
    if (!formData.password || formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    alert('Registration Successful!');
    console.log('Form Data:', formData);
    // Add an API call here to send the form data to a backend
  };

  return (
    <div className="registration-page">
      <h1>Welcome to FND. Register here...</h1>
      <form onSubmit={handleSubmit} className="registration-form" noValidate>
        {/* Username */}
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          aria-describedby="usernameError"
          required
        />
        {errors.username && <p id="usernameError" className="error">{errors.username}</p>}

        {/* Email */}
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          aria-describedby="emailError"
          required
        />
        {errors.email && <p id="emailError" className="error">{errors.email}</p>}

        {/* Farming Sectors */}
        <fieldset className="farming-sectors">
          <legend>Farming Sector(s):</legend>
          {farmingSectors.map((sector) => (
            <label key={sector}>
              <input
                type="checkbox"
                name="sectors"
                value={sector}
                onChange={handleCheckboxChange}
              />
              {sector}
            </label>
          ))}
        </fieldset>

        {/* Password */}
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          aria-describedby="passwordError passwordStrength"
          required
        />
        {errors.password && <p id="passwordError" className="error">{errors.password}</p>}
        <p id="passwordStrength" className={`strength ${passwordStrength.toLowerCase()}`}>
          Strength: {passwordStrength}
        </p>

        {/* Confirm Password */}
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          aria-describedby="confirmPasswordError"
          required
        />
        {errors.confirmPassword && <p id="confirmPasswordError" className="error">{errors.confirmPassword}</p>}


        {/* Submit Button */}
        <button type="submit" className="submit-button">
          Register
        </button>
      </form>

      {/* Redirect to Login */}
      <p className="login-link">
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
};

export default RegistrationPage;
