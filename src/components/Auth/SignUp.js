import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../../supabaseClient';
import './Auth.css';

const SignUp = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get the site URL based on environment
  const getSiteURL = () => {
    if (process.env.REACT_APP_SITE_URL) {
      return process.env.REACT_APP_SITE_URL;
    }
    // Fallback to window.location.origin for development
    return window.location.origin;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${getSiteURL()}/signin`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup succeeded but no user data returned.');

      // Step 2: Create the profile using the admin client
      if (!supabaseAdmin) {
        console.error('Service role client not configured');
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
        console.error('Error creating user profile:', insertError);
        setError(`Signup successful, but failed to save user profile: ${insertError.message}. Please contact support.`);
        setLoading(false);
        return;
      }

      // Success - show message and redirect
      alert('Signup successful! Please check your email to verify your account.');
      navigate('/signin');

    } catch (error) {
      console.error('Signup Error:', error);
      setError(error.message || 'An unexpected error occurred during sign up.');
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h2>Create Your Account</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSignUp} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="full-name">Full Name</label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Enter your full name"
            />
          </div>
          <div className="auth-input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="auth-input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password (min. 6 characters)"
              minLength="6"
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/signin">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
