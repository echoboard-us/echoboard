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
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Check beta_approved and role in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('beta_approved, role')
        .eq('id', signInData.user.id)
        .single();
      console.log('Fetched profile:', profile);
      if (profileError) throw profileError;
      if (!profile?.beta_approved && profile?.role !== 'approved' && profile?.role !== 'admin') {
        await supabase.auth.signOut(); // Immediately sign out
        setError('Your account is pending approval. Please wait for admin approval.');
        setLoading(false);
        return;
      }
      console.log('Navigating to dashboard...');
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Invalid login credentials.');
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
        <h2 className="auth-title-centered">Welcome back</h2>
        <div className="auth-subtitle-centered">Sign in to your EchoBoard account</div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSignIn} className="auth-form-centered">
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
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="auth-button-gradient" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-signup-link-centered">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
