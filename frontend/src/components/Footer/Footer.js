import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <h3>fnd</h3>
          <p>Building meaningful digital connections.</p>
        </div>

        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/register">Register</Link>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} fnd. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;