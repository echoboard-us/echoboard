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
      // Auto-approve if email is in beta_access_requests and approved
      const { data: approvedRequest } = await supabase
        .from('beta_access_requests')
        .select('id')
        .eq('email', email)
        .eq('status', 'approved')
        .single();
      if (approvedRequest) {
        await supabaseAdmin
          .from('profiles')
          .update({ beta_approved: true })
          .eq('id', authData.user.id);
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
    <div className="auth-bg-centered">
      <div className="auth-card-centered">
        <Link to="/">
          <img src="/icon-transparent.png" alt="EchoBoard Logo" className="auth-logo-centered" />
        </Link>
        <h2 className="auth-title-centered">Create your account</h2>
        <div className="auth-subtitle-centered">Get started with EchoBoard today</div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSignUp} className="auth-form-centered">
          <div className="auth-input-centered">
            <FaUser className="auth-input-icon" />
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Full Name"
              autoComplete="name"
            />
          </div>
          <div className="auth-input-centered">
            <FaEnvelope className="auth-input-icon" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              autoComplete="email"
            />
          </div>
          <div className="auth-input-centered">
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
          <button type="submit" className="auth-button-gradient" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-signup-link-centered">
          Already have an account? <Link to="/signin">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
