import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import {
  FaTachometerAlt,
  FaClipboardList,
  FaLightbulb,
  FaChartBar,
  FaUsers,
  FaSignOutAlt, 
  FaUserCircle  
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
  const { user, signOut } = useAuth(); 

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect handled by App.js
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <aside className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <img src="/echoboard logo transparent.png" alt="Echo Board" className="sidebar-logo" />
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className="nav-link" end>
          <FaTachometerAlt className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/teams" className="nav-link">
          <FaUsers className="nav-icon" />
          <span>Teams</span>
        </NavLink>
        <NavLink to="/surveys" className="nav-link">
          <FaClipboardList className="nav-icon" />
          <span>Surveys</span>
        </NavLink>
        <NavLink to="/insights" className="nav-link">
          <FaLightbulb className="nav-icon" />
          <span>Insights</span>
        </NavLink>
        <NavLink to="/analytics" className="nav-link">
          <FaChartBar className="nav-icon" />
          <span>Analytics</span>
        </NavLink>
      </nav>

      {/* User Info and Logout Section */}
      <div className="sidebar-footer">
        <div className="user-info">
          <FaUserCircle className="user-icon-sidebar" />
          <span className="user-email-sidebar">
            {user?.user_metadata?.full_name || user?.email || 'User'}
          </span>
        </div>
        <button onClick={handleLogout} className="logout-button-sidebar">
          <FaSignOutAlt className="logout-icon-sidebar" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
