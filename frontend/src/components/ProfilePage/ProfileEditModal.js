import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./ProfilePage_css/ProfileEditModal.css";

// Lazy-load Google Maps script
const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (document.getElementById("google-maps-script")) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject("Google Maps script failed to load");
    document.body.appendChild(script);
  });
};

// LocationInput that waits for Google Maps script
const LocationInput = ({ value, onChange, placeholder }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    const initAutocomplete = () => {
      if (!window.google || !inputRef.current) return;

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        { types: ["geocode"] } // country, city, village
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          onChange(place.formatted_address);
        } else if (place.name) {
          onChange(place.name);
        }
      });
    };

    initAutocomplete();
  }, [onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "Enter your location"}
    />
  );
};

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

  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load Google Maps script when modal mounts
  useEffect(() => {
    loadGoogleMapsScript("YOUR_API_KEY_HERE")
      .then(() => setMapsLoaded(true))
      .catch((err) => console.error(err));
  }, []);

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
            {mapsLoaded ? (
              <LocationInput
                value={formData.location}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, location: val }))
                }
              />
            ) : (
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Enter your location"
              />
            )}
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
