import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SurveyProvider } from './context/SurveyContext';
import { ThemeProvider } from "./context/ThemeContext"; 
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Insights from "./components/Insights"; 
import Survey from './components/Survey';
import SurveyResponse from "./components/SurveyResponse";
import Teams from './components/Teams';
import SignUp from './components/Auth/SignUp';
import SignIn from './components/Auth/SignIn';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import PricingPage from './components/PricingPage';
import ContactPage from './components/ContactPage';
import BetaAdmin from './components/BetaAdmin';
import './App.css';
import { supabase } from './supabaseClient';

function App() {
  return (
    <AuthProvider>
      <SurveyProvider> 
        <ThemeProvider>
          <Router>
            <AppContent />
          </Router>
        </ThemeProvider>
      </SurveyProvider>
    </AuthProvider>
  );
}

function AppContent() {
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
        if (!error && profile) {
          setAccessAllowed(
            profile.beta_approved || profile.role === 'approved' || profile.role === 'admin'
          );
        } else {
          setAccessAllowed(false);
        }
      } else {
        setAccessAllowed(null);
      }
      setChecking(false);
    };
    checkAccess();
  }, [user]);

  if (loading || checking) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Application...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={user && accessAllowed ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/signup" element={user && accessAllowed ? <Navigate to="/dashboard" /> : <SignUp />} />
      <Route path="/signin" element={user && accessAllowed ? <Navigate to="/dashboard" /> : <SignIn />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/survey/:surveyId" element={<SurveyResponse />} />
      <Route path="/admin/beta" element={<BetaAdmin />} />

      <Route 
        path="/*" 
        element={
          user && accessAllowed ? (
            <MainAppLayout />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />
    </Routes>
  );
}

const MainAppLayout = () => {
  return (
    <div className="app-container">
      <Sidebar /> 
      <div className="main-content">
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} /> 
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
            <Route path="surveys" element={<ProtectedRoute><Survey /></ProtectedRoute>} />
            <Route path="teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
            {/* Analytics route removed */}
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} /> 
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
