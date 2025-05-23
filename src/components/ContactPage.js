import React from 'react';
import { Link } from 'react-router-dom';
import './ContactPage.css';
import { FaLinkedin, FaInstagram, FaDiscord, FaXTwitter } from 'react-icons/fa6';
import { TbDeviceAnalytics, TbBrain, TbChartBar, TbMail } from 'react-icons/tb';

const ContactPage = () => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        {/* Navbar */}
        <nav className="landing-nav">
          <div className="logo-container">
            <Link to="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <div className="logo-icon-container">
                <img 
                  src="/echoboard logo transparent.png" 
                  alt="EchoBoard Logo" 
                  className="landing-logo"
                />
              </div>
              <span className="logo-text">EchoBoard</span>
            </Link>
          </div>
          <div className="nav-links">
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/signin" className="sign-in-button">Sign In</Link>
          </div>
        </nav>

        {/* Contact Content */}
        <div className="contact-container">
          <h1 className="contact-title">Lets Have a Chat <span role="img" aria-label="wave">👋</span></h1>
          <p className="contact-subtitle">Questions about our products/services, orders, or just want to say hello? We're here to help</p>
          <form className="contact-form">
            <div className="form-row">
              <input type="text" placeholder="First name" name="firstName" autoComplete="given-name" />
              <input type="text" placeholder="Last name" name="lastName" autoComplete="family-name" />
            </div>
            <div className="form-row">
              <input type="email" placeholder="Email" name="email" autoComplete="email" />
              <input type="text" placeholder="Phone number" name="phone" autoComplete="tel" />
            </div>
            <textarea placeholder="Message" name="message" rows={4} />
            <button type="submit" className="contact-send-btn">Send message</button>
          </form>
          <div className="contact-socials">
            <a href="https://www.linkedin.com/company/echoboard-us" target="_blank" rel="noopener noreferrer" className="contact-social"><FaLinkedin /></a>
          </div>
        </div>

        {/* Footer */}
        <footer className="landing-footer" style={{marginTop: '3rem'}}>
          <div className="footer-content">
            <div className="footer-logo">
              <img 
                src="/echoboard logo transparent.png" 
                alt="EchoBoard Logo" 
                className="footer-logo-img"
              />
              <span className="footer-tagline">EchoBoard: AI-Driven Survey Insights</span>
            </div>
            <div className="footer-links">
              <a href="https://www.linkedin.com/company/echoboard-us" target="_blank" rel="noopener noreferrer" className="footer-link linkedin-link">
                <FaLinkedin style={{ verticalAlign: 'middle', fontSize: '1.3em', marginRight: '0.5em' }} />
              </a>
              <Link to="/pricing" className="footer-link">Pricing</Link>
              <Link to="/contact" className="footer-link">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ContactPage; 