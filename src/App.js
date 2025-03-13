import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Insights from './components/Insights';

import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Sidebar on the left */}
        <Sidebar />

        {/* Main content area */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/insights" element={<Insights />} />
            {/* Add more Routes for Surveys, Analytics, etc. */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;