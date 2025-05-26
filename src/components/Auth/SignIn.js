import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import '../Auth.css';

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Invalid login credentials.');
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
            <h2 className="auth-title">Sign in to EchoBoard</h2>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSignIn} className="auth-form-modern">
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
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="auth-button-blue" disabled={loading}>
                {loading ? 'Signing In...' : 'Login'}
              </button>
            </form>
            <div className="auth-signup-link">
              Don&apos;t have an account? <Link to="/signup">Sign up</Link>
            </div>
          </div>
        </div>
        {/* Right: Brand Message */}
        <div className="auth-split-right">
          <div className="auth-split-message">
            <h1>Welcome back—let’s dive in</h1>
            <p>Your team’s insights are waiting. Visualize trends, uncover patterns, and share next steps without any extra clicks required.</p>
          </div>
          {/* Optionally add some subtle background shapes here for visual interest */}
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

export default SignIn;
