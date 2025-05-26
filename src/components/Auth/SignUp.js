import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../../supabaseClient';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import '../Auth.css';

const SignUp = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getSiteURL = () => {
    if (process.env.REACT_APP_SITE_URL) {
      return process.env.REACT_APP_SITE_URL;
    }
    return window.location.origin;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${getSiteURL()}/signin`,
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup succeeded but no user data returned.');
      if (!supabaseAdmin) {
        setError('Unable to create user profile. Please contact support.');
        setLoading(false);
        return;
      }
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      if (insertError) {
        setError(`Signup successful, but failed to save user profile: ${insertError.message}. Please contact support.`);
        setLoading(false);
        return;
      }
      alert('Signup successful! Please check your email to verify your account.');
      navigate('/signin');
    } catch (error) {
      setError(error.message || 'An unexpected error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-bg">
      <div className="auth-split-container">
        {/* Left: Form */}
        <div className="auth-split-left">
          <div className="auth-card-dark">
            <Link to="/">
              <img src="/EchoBoardLogo.png" alt="EchoBoard Logo" className="auth-logo auth-logo-visible" />
            </Link>
            <h2 className="auth-title">Get started with EchoBoard</h2>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSignUp} className="auth-form-modern">
              <div className="auth-input-modern">
                <FaUser className="auth-input-icon" />
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Name"
                  autoComplete="name"
                />
              </div>
              <div className="auth-input-modern">
                <FaEnvelope className="auth-input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email Address"
                  autoComplete="email"
                />
              </div>
              <div className="auth-input-modern">
                <FaLock className="auth-input-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  minLength="6"
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="auth-button-purple" disabled={loading}>
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </form>
            <div className="auth-signup-link">
              Already have an account? <Link to="/signin">Sign in</Link>
            </div>
          </div>
        </div>
        {/* Right: Brand Message */}
        <div className="auth-split-right">
          <div className="auth-split-message">
            <h1>Join the future of feedback</h1>
            <p>EchoBoard empowers you to collect, analyze, and act on survey data for real organizational impact.</p>
          </div>
          <div className="auth-bg-shapes">
            {/* Stylized chart SVG */}
            <svg className="auth-bg-svg chart-svg" width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position:'absolute',top:'8%',left:'62%',opacity:0.7}}>
              <polyline points="10,70 40,40 70,60 100,20" stroke="#4f8cff" strokeWidth="4" fill="none" />
              <circle cx="10" cy="70" r="4" fill="#a29ffd" />
              <circle cx="40" cy="40" r="4" fill="#a29ffd" />
              <circle cx="70" cy="60" r="4" fill="#a29ffd" />
              <circle cx="100" cy="20" r="4" fill="#a29ffd" />
            </svg>
            {/* Speech bubble SVG */}
            <svg className="auth-bg-svg bubble-svg" width="90" height="70" viewBox="0 0 90 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position:'absolute',bottom:'12%',left:'12%',opacity:0.5}}>
              <ellipse cx="45" cy="30" rx="40" ry="25" fill="#5956bc" fillOpacity="0.5" />
              <polygon points="35,55 45,45 55,55" fill="#5956bc" fillOpacity="0.5" />
            </svg>
            {/* Echo/soundwave SVG */}
            <svg className="auth-bg-svg echo-svg" width="140" height="60" viewBox="0 0 140 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position:'absolute',bottom:'8%',right:'10%',opacity:0.4}}>
              <path d="M10 30 Q 40 10, 70 30 T 130 30" stroke="#a29ffd" strokeWidth="3" fill="none" />
              <path d="M20 40 Q 50 20, 80 40 T 120 40" stroke="#4f8cff" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
