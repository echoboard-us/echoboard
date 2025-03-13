import React from 'react';
import './Insights.css'; // optional separate CSS

const Insights = () => {
  return (
    <div className="insights-container">
      <h1>Insights</h1>
      <p className="subtitle">AI-powered analysis of your survey data</p>
      <h2>AI-Driven Insights</h2>

      <div className="insights-grid">
        <div className="insight-card">
          <h3>Accountability</h3>
          <p>Team members feel responsible for their work and outcomes.</p>
        </div>
        <div className="insight-card">
          <h3>Communication</h3>
          <p>Clear and effective communication across teams and departments.</p>
        </div>
        <div className="insight-card">
          <h3>Management</h3>
          <p>Leadership effectiveness and support for team members.</p>
        </div>
        <div className="insight-card">
          <h3>Project Teams</h3>
          <p>Collaboration and efficiency within project-specific teams.</p>
        </div>
        <div className="insight-card">
          <h3>Goal Alignment</h3>
          <p>Alignment between individual, team, and organizational goals.</p>
        </div>
        <div className="insight-card">
          <h3>Recognition</h3>
          <p>Acknowledgment of achievements and contributions.</p>
        </div>
        <div className="insight-card">
          <h3>Professional Growth</h3>
          <p>Opportunities for skill development and career advancement.</p>
        </div>
        <div className="insight-card">
          <h3>Work Quality</h3>
          <p>Standards of excellence and quality in deliverables.</p>
        </div>
      </div>
    </div>
  );
};

export default Insights;