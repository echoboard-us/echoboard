import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ContactPage.css';
import { FaLinkedin } from 'react-icons/fa6';
import { supabase } from '../supabaseClient'; // Ensure this import is correct
import { useAuth } from '../context/AuthContext';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, signOut } = useAuth();
  const [betaApproved, setBetaApproved] = useState(null);
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchBetaApproved = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('beta_approved')
          .eq('id', user.id)
          .single();
        if (!error && profile) {
          setBetaApproved(profile.beta_approved);
        } else {
          setBetaApproved(false);
        }
      } else {
        setBetaApproved(null);
      }
      setChecking(false);
    };
    fetchBetaApproved();
  }, [user]);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (!error && profile) {
          setRole(profile.role);
        } else {
          setRole(null);
        }
      } else {
        setRole(null);
      }
    };
    fetchRole();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, phone, message } = formData;
    if (!firstName || !lastName || !email || !message) {
      setStatus('Please fill out all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .insert([{
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_number: phone,
          message: message
        }]);
      if (error) throw error;
      setStatus('Message sent! We will get back to you soon.');
      setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        {/* Navbar */}
        <nav className="landing-nav">
          <div className="logo-container">
            <Link to="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <div className="logo-icon-container">
                <img 
                  src="/icon-transparent.png" 
                  alt="EchoBoard Logo" 
                  className="landing-logo"
                />
              </div>
              <span className="logo-text">EchoBoard</span>
            </Link>
          </div>
          <div className="nav-links">
            {/* <Link to="/pricing" className="nav-link">Pricing</Link> */}
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/signin" className="cta-button">Sign In</Link>
            {!user || role === 'new' ? (
              <button className="sign-in-button" onClick={() => window.location.href = '/#early-access'}>Get Early Access</button>
            ) : null}
            {(role === 'approved' || role === 'admin') && (
              <button className="sign-in-button" onClick={signOut}>Sign Out</button>
            )}
            {role === 'admin' && (
              <Link to="/admin/beta" className="nav-link">Admin</Link>
            )}
          </div>
        </nav>

        {/* Contact Content */}
        <div className="contact-container">
          <h1 className="contact-title">Lets Have a Chat <span role="img" aria-label="wave">👋</span></h1>
          <p className="contact-subtitle">Questions about our products/services or just want to say hello? We're here to help.</p>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
            />
            <button type="submit" className="contact-send-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
          {status && <p className="status-message">{status}</p>}
          <div className="contact-socials">
            <a href="https://www.linkedin.com/company/echoboard-us" target="_blank" rel="noopener noreferrer" className="contact-social"><FaLinkedin /></a>
          </div>
        </div>

        {/* Footer */}
        <footer className="landing-footer" style={{marginTop: '3rem'}}>
          <div className="footer-content">
            <div className="footer-logo">
              <img 
                src="/EchoBoardLogo.png" 
                alt="EchoBoard Logo" 
                className="footer-logo-img"
              />
              <span className="footer-tagline">EchoBoard: AI-Driven Survey Insights</span>
            </div>
            <div className="footer-links">
              <a href="https://www.linkedin.com/company/echoboard-us" target="_blank" rel="noopener noreferrer" className="footer-link linkedin-link">
                <FaLinkedin style={{ verticalAlign: 'middle', fontSize: '1.3em', marginRight: '0.5em' }} />
              </a>
              {/* <Link to="/pricing" className="footer-link">Pricing</Link> */}
              <Link to="/contact" className="footer-link">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ContactPage; 