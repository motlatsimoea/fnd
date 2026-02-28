import React from "react";
import "./Legal.css";

const PrivacyPolicy = () => {
  return (
    <div className="legal-container">
      <div className="legal-card">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().getFullYear()}</p>

        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide when creating an account,
          including your email address, username, and profile details.
        </p>
        <p>
          We also collect user-generated content such as posts and messages
          that you choose to send through the platform.
        </p>

        <h2>2. How We Use Information</h2>
        <p>
          Your information is used to operate, maintain, and improve the
          platform. We do not sell your personal data.
        </p>

        <h2>3. Private Messaging</h2>
        <p>
          Messages are private between users. We do not monitor private
          messages but may access them if required for security,
          abuse prevention, or legal compliance.
        </p>

        <h2>4. Account Deactivation & Deletion</h2>
        <p>
          You may deactivate your account. After 30 days of deactivation,
          accounts may be permanently deleted.
        </p>

        <h2>5. Security</h2>
        <p>
          We implement reasonable technical and organizational safeguards
          to protect your data.
        </p>

        <h2>6. Contact</h2>
        <p>
          For questions about this policy, please contact us through the
          platform.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;