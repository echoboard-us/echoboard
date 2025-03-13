import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // optional separate CSS

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">EchoBoard</h2>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className="nav-link">Dashboard</Link>
        <Link to="/surveys" className="nav-link">Surveys</Link>
        <Link to="/insights" className="nav-link">Insights</Link>
        <Link to="/analytics" className="nav-link">Analytics</Link>
      </nav>
      <div className="sidebar-footer">
        <img 
          src="https://via.placeholder.com/40" 
          alt="User" 
          className="user-avatar"
        />
        <div className="user-info">
          <span className="user-name">Yusuf Hilmi</span>
          <span className="user-role">Admin</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;