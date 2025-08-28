import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./ProfilePage_css/ProfileEditModal.css";

const ProfileEditModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    location: user.location || "",
    phone_number: user.phone_number || "",
    bio: user.bio || "",
    profile_picture: null,
    background_picture: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          
          <label>
            Username
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </label>

          <label>
            First Name
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </label>

          <label>
            Last Name
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </label>

          <label>
            Location
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </label>

          <label>
            Phone Number
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
            />
          </label>

          <label>
            Bio
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
            />
          </label>

          <label>
            Profile Picture
            <input
              type="file"
              name="profile_picture"
              accept="image/*"
              onChange={handleChange}
            />
          </label>

          <label>
            Background Picture
            <input
              type="file"
              name="background_picture"
              accept="image/*"
              onChange={handleChange}
            />
          </label>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProfileEditModal;
