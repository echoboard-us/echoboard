import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [accessAllowed, setAccessAllowed] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('beta_approved, role')
          .eq('id', user.id)
          .single();
        console.log('ProtectedRoute profile:', profile);
        if (!error && profile) {
          const allowed = profile.beta_approved || profile.role === 'approved' || profile.role === 'admin';
          console.log('ProtectedRoute accessAllowed:', allowed);
          setAccessAllowed(allowed);
        } else {
          setAccessAllowed(false);
        }
      } else {
        setAccessAllowed(false);
      }
      setChecking(false);
    };
    if (user) checkAccess();
    else setChecking(false);
  }, [user]);

  if (loading || checking) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!accessAllowed) {
    return <div style={{textAlign:'center',marginTop:'3rem',color:'#23234a',fontSize:'1.2rem'}}>Your account is pending approval. Please wait for admin approval.</div>;
  }

  return children;
};

export default ProtectedRoute;
