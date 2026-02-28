import React from "react";
import "./Legal.css";

const TermsOfService = () => {
  return (
    <div className="legal-container">
      <div className="legal-card">
        <h1>Terms of Service</h1>
        <p>Last updated: {new Date().getFullYear()}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By using this platform, you agree to comply with these Terms of
          Service.
        </p>

        <h2>2. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your
          login credentials and for all activities under your account.
        </p>

        <h2>3. User Conduct</h2>
        <p>
          You agree not to misuse the platform, engage in unlawful behavior,
          or attempt to compromise system integrity.
        </p>

        <h2>4. Content</h2>
        <p>
          You retain ownership of content you create, but grant us a license
          to display it within the platform.
        </p>

        <h2>5. Termination</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate
          these terms.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          The platform is provided “as is” without warranties of any kind.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;