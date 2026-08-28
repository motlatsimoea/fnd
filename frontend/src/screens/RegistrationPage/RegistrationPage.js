import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../../utils/axiosInstance';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { registerUser } from '../../features/users/register-slice';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './RegistrationPage.css';

const RegistrationPage = () => {
  const dispatch = useDispatch();
  const { loading, error, message, userId } = useSelector((state) => state.register);

  const [formData, setFormData] = useState({
    username: '',
    contactMethod: 'email',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    sectors: [],
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [availableSectors, setAvailableSectors] = useState([]);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const navigate = useNavigate();

  // 🔍 UPDATED: works for email OR phone
  const checkUserExists = async () => {
    try {
      let payload = {};

      if (formData.contactMethod === 'email') {
        if (!formData.email || !validateEmail(formData.email)) return;
        payload = { email: formData.email };
      } else {
        if (!formData.phone_number) return;
        payload = { phone_number: `+${formData.phone_number}` };
      }

      const response = await axiosInstance.post('/api/users/check-user/', payload);

      if (response.data.exists) {
        setErrors((prev) => ({
          ...prev,
          contactMethod: 'Already in use.'
        }));
      }
    } catch (err) {
      console.error(err);
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

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
      ...(name === "contactMethod" && {
        email: '',
        phone_number: ''
      })
    }));

    setErrors(prev => ({ ...prev, [name]: null }));

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleCheckboxChange = (e) => {
    const id = Number(e.target.value);
    const checked = e.target.checked;
    setFormData(prev=>({
        ...prev,
        sectors: checked
          ? [...prev.sectors,id]
          : prev.sectors.filter(
              sectorId => sectorId !== id
            )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username)
      newErrors.username = 'Username is required.';

    if (formData.contactMethod === 'email') {
      if (!formData.email || !validateEmail(formData.email))
        newErrors.email = 'Valid email is required.';
    }

    if (formData.contactMethod === 'phone') {
      if (!formData.phone_number)
        newErrors.phone_number = 'Phone number is required.';
    }

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

    const payload = {
      username: formData.username,
      password: formData.password,
      sectors: formData.sectors,
      agreed_to_terms: formData.agreedToTerms,
      ...(formData.contactMethod === 'email'
        ? { email: formData.email }
        : { phone_number: `+${formData.phone_number}` }),
    };

    dispatch(registerUser(payload));
  };

  useEffect(() => {
      const fetchSectors = async () => {
          try {
              const response = await axiosInstance.get(
                  "/users/sectors/"
              );
              setAvailableSectors(response.data);
          } catch(err){
              console.error(err);
          }
      };
      fetchSectors();
  }, []);

  useEffect(() => {
    if (message) {
      setFormData({
        username: '',
        contactMethod: 'email',
        email: '',
        phone_number: '',
        password: '',
        confirmPassword: '',
        sectors: [],
        agreedToTerms: false,
      });
      setErrors({});
      setPasswordStrength('');

      if (userId) {
        navigate("/verify-otp");
      }
    }
  }, [message, userId, navigate]);

  return (
    <div className="registration-page">
      <div className="registration-card">
          <h1>Welcome to FND...</h1>

      {loading && <Loader />}
      {message && <Message variant="success">{message}</Message>}
      {error?.detail && <Message variant="danger">{error.detail}</Message>}

      <form onSubmit={handleSubmit} className="registration-form">
        {/* Username */}
        <label>Username:</label>
        <input
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
        />
        {errors.username && <p className="error">{errors.username}</p>}

        {/* Contact Method */}
        <label>Register with:</label>
        <div className="contact-toggle">
          <button
            type="button"
            className={formData.contactMethod === "email" ? "active" : ""}
            onClick={() => setFormData({...formData, contactMethod: "email"})}
          >
            Email
          </button>

          <button
            type="button"
            className={formData.contactMethod === "phone" ? "active" : ""}
            onClick={() => setFormData({...formData, contactMethod: "phone"})}
          >
            Phone
          </button>
        </div>
        {errors.contactMethod && <p className="error">{errors.contactMethod}</p>}

        {/* Email */}
        {formData.contactMethod === "email" && (
          <>
            <label>Email:</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={checkUserExists}
            />
            {errors.email && <p className="error">{errors.email}</p>}
          </>
        )}

        {/* Phone */}
        {formData.contactMethod === "phone" && (
          <>
            <label>Phone Number:</label>
            <PhoneInput
              country={'ls'}
              value={formData.phone_number}
              onChange={(phone) =>
                setFormData({ ...formData, phone_number: phone })
              }
              onBlur={checkUserExists}
            />
            {errors.phone_number && <p className="error">{errors.phone_number}</p>}
          </>
        )}

        {/* Sectors */}
        <fieldset className="farming-sectors">
          <legend>Farming Sector(s):</legend>
          {availableSectors.map((sector)=>(

            <label key={sector.id}>
              <input
                type="checkbox"
                value={sector.id}
                checked={formData.sectors.includes(sector.id)}
                onChange={handleCheckboxChange}
              />
              {sector.name}
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

        {/* Terms */}
        <div className="terms-agreement">
          <label>
            <input
              type="checkbox"
              name="agreedToTerms"
              checked={formData.agreedToTerms}
              onChange={handleChange}
            />
            I agree to the Terms and Privacy Policy
          </label>
        </div>
        {errors.agreedToTerms && <p className="error">{errors.agreedToTerms}</p>}

        <button disabled={loading || !formData.agreedToTerms}>
          Register
        </button>
      </form>
      </div>
      
    </div>
  );
};

export default RegistrationPage;