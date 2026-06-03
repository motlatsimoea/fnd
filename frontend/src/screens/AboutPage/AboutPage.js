import React from "react";
import { Link } from "react-router-dom";
import "./AboutPage.css";

const AboutPage = () => {
  return (
    <div className="about-container">
      <div className="about-card">
        <h1>About fnd</h1>

        <p>
          fnd is a community-driven platform designed to connect people, share
          ideas, and build meaningful conversations.
        </p>

        <p>
          Our mission is to create a clean, focused environment where users can
          communicate, explore opportunities, and grow their network without
          unnecessary noise.
        </p>

        <div className="about-features">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3 className="feature-title">Meaningful Conversations</h3>
            <p className="feature-text">
              Connect with people and engage in discussions that matter.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">Privacy First</h3>
            <p className="feature-text">
              Your information remains yours. Transparency and security come
              first.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌱</div>
            <h3 className="feature-title">Grow Together</h3>
            <p className="feature-text">
              Discover opportunities, build connections, and share knowledge.
            </p>
          </div>
        </div>

        <p>
          We prioritize privacy, simplicity, and a modern user experience. Your
          data belongs to you, and we aim to keep things transparent and secure.
        </p>

        <div className="about-cta">
          <h3>Join the fnd Community</h3>
          <p>
            Start sharing ideas, connecting with others, and discovering
            opportunities today.
          </p>

          <Link to="/register" className="register-link">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;