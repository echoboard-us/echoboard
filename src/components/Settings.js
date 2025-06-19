import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Email change state
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: ''
  });
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        email: emailForm.newEmail
      });

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: 'Email update initiated! Please check your new email for confirmation.' 
      });
      setEmailForm({
        newEmail: '',
        currentPassword: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update email.' });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-content">
        {/* Profile Information */}
        <div className="settings-section">
          <h2>Profile Information</h2>
          <div className="profile-info">
            <div className="info-item">
              <FaUser className="info-icon" />
              <div>
                <label>Full Name</label>
                <span>{user?.user_metadata?.full_name || 'Not set'}</span>
              </div>
            </div>
            <div className="info-item">
              <FaEnvelope className="info-icon" />
              <div>
                <label>Email</label>
                <span>{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="settings-section">
          <h2>Change Password</h2>
          <form onSubmit={handlePasswordChange} className="settings-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input">
                <FaLock className="input-icon" />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="password-input">
                <FaLock className="input-icon" />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="settings-button" disabled={loading}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Change Email */}
        <div className="settings-section">
          <h2>Change Email</h2>
          <form onSubmit={handleEmailChange} className="settings-form">
            <div className="form-group">
              <label htmlFor="newEmail">New Email</label>
              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="newEmail"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                  placeholder="Enter new email address"
                  required
                />
              </div>
            </div>

            <button type="submit" className="settings-button" disabled={loading}>
              {loading ? 'Updating Email...' : 'Update Email'}
            </button>
          </form>
          <p className="form-note">
            You'll receive a confirmation email at the new address to verify the change.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings; 