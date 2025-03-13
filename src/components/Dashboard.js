import React from 'react';
import './Dashboard.css'; // optional separate CSS

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <h1 className="page-title">Dashboard</h1>
      <p className="welcome-text">
        Welcome to EchoBoard, your AI-driven survey and insights platform
      </p>

      {/* Main Insights / Key Findings */}
      <div className="main-insights">
        <h2>Main Insights</h2>
        <p className="latest-results">Latest survey results and key findings</p>
        <div className="key-findings">
          <ul>
            <li>85% of respondents reported improved team communication</li>
            <li>Project satisfaction increased by 23% compared to last quarter</li>
            <li>Management responsiveness scored highest among all metrics</li>
          </ul>
          <button className="read-analysis-btn">Read Full Analysis &rarr;</button>
        </div>
        {/* Placeholder chart */}
        <div className="chart-placeholder">
          <p>Bar Chart Goes Here</p>
        </div>
      </div>

      {/* Recent Surveys */}
      <h2 className="recent-surveys-title">Recent Surveys</h2>
      <div className="survey-cards">
        <div className="survey-card">
          <span className="status active">Active</span>
          <h3>Q2 Employee Satisfaction</h3>
          <p>Quarterly survey to measure employee satisfaction...</p>
          <p><strong>124 respondents</strong></p>
          <p className="time-info">2 days ago</p>
          <button className="view-results-btn">View Results</button>
        </div>

        <div className="survey-card">
          <span className="status completed">Completed</span>
          <h3>Project Feedback – Mobile App</h3>
          <p>Gathering feedback on the recent mobile app development project...</p>
          <p><strong>32 respondents</strong></p>
          <p className="time-info">1 week ago</p>
          <button className="view-results-btn">View Results</button>
        </div>

        <div className="survey-card">
          <span className="status completed">Completed</span>
          <h3>Management Effectiveness</h3>
          <p>Assessment of management effectiveness across departments...</p>
          <p><strong>78 respondents</strong></p>
          <p className="time-info">2 weeks ago</p>
          <button className="view-results-btn">View Results</button>
        </div>

        {/* Add more survey cards as needed */}
      </div>
    </div>
  );
};

export default Dashboard;