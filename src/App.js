import React from 'react';
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
import './App.css';

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

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Application...</div>;
  }

  return (
    <Routes>
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUp />} />
      <Route path="/signin" element={user ? <Navigate to="/dashboard" /> : <SignIn />} />

      <Route path="/survey/:surveyId" element={<SurveyResponse />} />

      <Route 
        path="/*" 
        element={
          user ? (
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
