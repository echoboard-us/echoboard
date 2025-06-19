import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './BetaAdmin.css';

const BetaAdmin = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For testing, allow access if user is logged in OR if we're in development
    if (user || process.env.NODE_ENV === 'development') {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId, status) => {
    try {
      // Update the request status
      const { data: requestData, error: requestError } = await supabase
        .from('beta_access_requests')
        .update({
          status,
          approved_by: user?.id || 'admin',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (requestError) throw requestError;

      // If approving, also set beta_approved = true in profiles for this email (if profile exists)
      if (status === 'approved' && requestData?.email) {
        await supabase
          .from('profiles')
          .update({ beta_approved: true })
          .eq('email', requestData.email);
      }

      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const handleDecline = async (requestId) => {
    try {
      await supabase
        .from('beta_access_requests')
        .delete()
        .eq('id', requestId);
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  // Show access denied with helpful information
  if (!user && process.env.NODE_ENV !== 'development') {
    return (
      <div className="beta-admin">
        <h1>Access Denied</h1>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>You need to be logged in with <strong>sashank.tadimeti@gmail.com</strong> to access this page.</p>
          <p>Current user: {user ? user.email : 'Not logged in'}</p>
          <p><a href="/signin">Log in</a> | <a href="/signup">Sign Up</a></p>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="beta-admin">
      <div className="beta-admin-card">
        <h1>Admin Page</h1>
        <h2>Beta Access Requests</h2>
        <table className="beta-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  No beta access requests found.
                </td>
              </tr>
            )}
            {requests.map(request => (
              <tr key={request.id}>
                <td>{request.first_name} {request.last_name}</td>
                <td>{request.email}</td>
                <td>{request.company}</td>
                <td>
                  <span className={`status-badge ${request.status}`}>
                    {request.status}
                  </span>
                </td>
                <td>
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproval(request.id, 'approved')}
                        className="beta-action-btn"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecline(request.id)}
                        className="beta-action-btn"
                        style={{ marginLeft: '0.5rem', background: '#ef4444' }}
                      >
                        Decline
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BetaAdmin;