import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaClipboardList,
  FaLightbulb,
  FaChartBar,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <aside className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <h2 className="sidebar-logo">EchoBoard</h2>
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar-nav">
        <NavLink to="/" className="nav-link">
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

        {/* Logout Button */}
        <button onClick={handleLogout} className="nav-link logout-button">
          <FaSignOutAlt className="nav-icon" />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
