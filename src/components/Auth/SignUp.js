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
    <div className="auth-bg-tech">
      <div className="auth-center-wrapper">
        <div className="auth-card-dark">
          <Link to="/">
            <img src="/EchoBoardLogo.png" alt="EchoBoard Logo" className="auth-logo auth-logo-visible" />
          </Link>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtext">Already have an account? <Link to="/signin">Sign in</Link></p>
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
                placeholder="Full name"
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
        </div>
      </div>
    </div>
  );
};

export default SignUp;
