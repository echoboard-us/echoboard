import React from "react";
import { NavLink } from "react-router-dom";
import { FaTachometerAlt, FaClipboardList, FaLightbulb, FaChartBar } from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
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
    </aside>
  );
};

export default Sidebar;