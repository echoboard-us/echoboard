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
    <div className="auth-bg-tech">
      <div className="auth-center-wrapper">
        <div className="auth-card-dark">
          <Link to="/">
            <img src="/echoboard logo transparent.png" alt="EchoBoard Logo" className="auth-logo auth-logo-visible" />
          </Link>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtext">Don't have an account yet? <Link to="/signup">Sign up</Link></p>
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
        </div>
      </div>
    </div>
  );
};

export default SignIn;
