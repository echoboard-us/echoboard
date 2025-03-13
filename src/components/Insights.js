import React from "react";
import { FaCheckCircle, FaComments, FaUserTie, FaUsers, FaBullseye, FaAward, FaChartLine, FaSignal } from "react-icons/fa";
import "./Insights.css";

const insightsData = [
  { icon: <FaCheckCircle />, title: "Accountability", description: "Team members feel responsible for their work and outcomes." },
  { icon: <FaComments />, title: "Communication", description: "Clear and effective communication across teams and departments." },
  { icon: <FaUserTie />, title: "Management", description: "Leadership effectiveness and support for team members." },
  { icon: <FaUsers />, title: "Project Teams", description: "Collaboration and efficiency within project-specific teams." },
  { icon: <FaBullseye />, title: "Goal Alignment", description: "Alignment between individual, team, and organizational goals." },
  { icon: <FaAward />, title: "Recognition", description: "Acknowledgment of achievements and contributions." },
  { icon: <FaChartLine />, title: "Professional Growth", description: "Opportunities for skill development and career advancement." },
  { icon: <FaSignal />, title: "Work Quality", description: "Standards of excellence and quality in deliverables." },
];

const Insights = () => {
  return (
    <div className="insights-container">
      <h1>Insights</h1>
      <p className="subtitle">AI-powered analysis of your survey data</p>
      <h2 className="section-title">AI-Driven Insights</h2>

      <div className="insights-grid">
        {insightsData.map((insight, index) => (
          <div key={index} className="insight-card">
            <div className="insight-icon">{insight.icon}</div>
            <h3>{insight.title}</h3>
            <p>{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Insights;