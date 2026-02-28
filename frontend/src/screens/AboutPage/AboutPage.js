import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-container">
      <div className="about-card">
        <h1>About fnd</h1>

        <p>
          fnd is a community-driven platform designed to connect people,
          share ideas, and build meaningful conversations.
        </p>

        <p>
          Our mission is to create a clean, focused environment where users
          can communicate, explore opportunities, and grow their network
          without unnecessary noise.
        </p>

        <p>
          We prioritize privacy, simplicity, and a modern user experience.
          Your data belongs to you, and we aim to keep things transparent
          and secure.
        </p>

        <div className="about-cta">
          <h3>Ready to join?</h3>
          <Link to="/register" className="register-link">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;