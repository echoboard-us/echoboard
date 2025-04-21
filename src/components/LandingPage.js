import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import { TbDeviceAnalytics } from 'react-icons/tb';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <nav className="landing-nav">
          <div className="logo-container">
            <div className="logo-icon-container">
              <img 
                src="/echoboard logo transparent.png" 
                alt="EchoBoard Logo" 
                className="landing-logo"
              />
            </div>
            <span className="logo-text">EchoBoard</span>
          </div>
          <div className="nav-links">
            <Link to="/signin" className="sign-in-button">Sign In</Link>
          </div>
        </nav>

        <div className="hero-section">
          <div className="hero-text">
            <h1>Welcome.</h1>
            <h2>Real Insights. Real Impact.</h2>
            <p>
              Transform your team's feedback into actionable insights.
              EchoBoard helps you collect, analyze, and act on survey data
              to drive meaningful organizational change.
            </p>
            <div className="cta-buttons">
              <Link to="/signup" className="cta-button primary">Get Started</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-element">
              <TbDeviceAnalytics className="visual-icon" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
