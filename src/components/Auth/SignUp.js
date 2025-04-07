import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Adjust the path as needed
import './Auth.css';

const SignUp = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
            full_name: fullName, // Optional: store full name in auth metadata
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup succeeded but no user data returned.');

      // Step 2: Insert user details into the public.users table
      // This is done client-side after successful auth signup.
      // For more security, this could be moved to a Supabase Edge Function triggered by auth.users creation.
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // Use the UUID from auth user
          full_name: fullName,
          email: email,
          role: 'member', // Default role
          // created_at and updated_at should default via PostgreSQL triggers or default values
        });

      if (insertError) {
        // Optional: Consider how to handle this failure. 
        // Maybe attempt to delete the auth user? Or just log the error?
        console.error('Error inserting user into public.users:', insertError);
        // Notify the user, they have an auth account but profile creation failed.
        setError(`Signup successful, but failed to save user profile: ${insertError.message}. Please contact support.`);
        // Don't navigate away, let them see the error.
        setLoading(false);
        return; // Stop execution here
      }

      // If signup and insert are successful
      alert('Signup successful! Please check your email to verify your account.');
      navigate('/signin'); // Redirect to signin page after signup

    } catch (error) {
      console.error('Signup Error:', error);
      setError(error.message || 'An unexpected error occurred during sign up.');
    } finally {
      // Only set loading to false if we haven't already in the insertError block
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
