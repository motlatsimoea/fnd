import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import axiosInstance from '../../utils/axiosInstance';
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

    sector_ids:
        user.sectors?.map(
            sector => sector.id
        ) || [],
});

    const [profilePreview, setProfilePreview] = useState(
      user.profile_picture || "/default_profile.png"
    );

  const [backgroundPreview, setBackgroundPreview] = useState(
      user.background_picture || "/default_background.jpeg"
  );
  const [availableSectors, setAvailableSectors] = useState([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load Google Maps script when modal mounts
  useEffect(() => {
    loadGoogleMapsScript(process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
      .then(() => setMapsLoaded(true))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
      const loadSectors = async () => {
          try {
              const { data } = await axiosInstance.get(
                  "/api/users/sectors/"
              );
              setAvailableSectors(data);
          } catch (err) {

              console.error(err);
          }
      };
      loadSectors();
  }, []);

  const handleSectorChange = (e) => {
      const id = Number(e.target.value);
      const checked = e.target.checked;

      setFormData(prev => ({
          ...prev,
          sector_ids: checked
              ? [...prev.sector_ids, id]
              : prev.sector_ids.filter(
                  sectorId => sectorId !== id
              )
      }));
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files && files.length > 0) {
      const file = files[0];

      // Store the actual file for FormData upload
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));

      // Create temporary preview URL
      const preview = URL.createObjectURL(file);

      if (name === "profile_picture") {
        setProfilePreview(preview);
      }

      if (name === "background_picture") {
        setBackgroundPreview(preview);
      }

    } else {

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

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
            <div className="form-grid">
                <div className="form-column">
                    <label>Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <label>First Name</label>
                    <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                    />

                    <label>Last Name</label>
                    <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-column">

                    <label>Location</label>

                    {mapsLoaded ? (
                        <LocationInput
                            value={formData.location}
                            onChange={(value)=>
                                setFormData(prev=>({...prev,location:value}))
                            }
                        />
                    ) : (
                        <input
                            value={formData.location}
                            onChange={(e)=>
                                setFormData(prev=>({...prev,location:e.target.value}))
                            }
                        />
                    )}

                    <label>Phone</label>

                    <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                    />

                    <label>Bio</label>

                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                    />

                </div>
            </div>

            <div className="section">

                <h3>🌱 Farming Interests</h3>

                <div className="sector-grid">

                    {availableSectors.map(sector=>(
                        <label
                            key={sector.id}
                            className={`sector-chip ${
                                formData.sector_ids.includes(sector.id)
                                    ? "selected"
                                    : ""
                            }`}
                        >
                            <input
                                type="checkbox"
                                value={sector.id}
                                checked={formData.sector_ids.includes(sector.id)}
                                onChange={handleSectorChange}
                            />

                            {sector.name}

                        </label>
                    ))}

                </div>

            </div>
            <div className="section">
                <h3>Images</h3>
                <div className="image-upload-grid">

                    <div className="upload-card">
                        <h4>Profile Picture</h4>
                        <img
                            src={profilePreview}
                            alt="Profile Preview"
                            className="profile-preview"
                        />

                        <label className="upload-btn">

                            Change Photo

                            <input
                                type="file"
                                name="profile_picture"
                                accept="image/*"
                                onChange={handleChange}
                                hidden
                            />

                        </label>
                    </div>

                    <div className="upload-card">

                        <h4>Cover Photo</h4>

                        <img
                            src={backgroundPreview}
                            alt="Background Preview"
                            className="cover-preview"
                        />

                        <label className="upload-btn">

                            Change Cover

                            <input
                                type="file"
                                name="background_picture"
                                accept="image/*"
                                onChange={handleChange}
                                hidden
                            />
                        </label>
                    </div>
                </div>

            </div>
            <div className="modal-actions">
                <button
                    type="button"
                    className="cancel-btn"
                    onClick={onClose}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="save-btn"
                >
                    Save Changes
                </button>
            </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProfileEditModal;
