import React from "react";
import { FaClock, FaUsers, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { useSurveys } from "../context/SurveyContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./Dashboard.css";

// Register necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { surveys } = useSurveys();

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <p className="subtitle">Welcome to EchoBoard, your AI-driven survey and insights platform.</p>
      {/* Main Insights Section */}
      <section className="main-insights">
        <div className="insights-text">
          <h2>Main Insights</h2>
          <button className="latest-results">
            Latest survey results and key findings
          </button>
          <ul className="key-findings-list">
            <li>85% of respondents reported improved team communication</li>
            <li>Project satisfaction increased by 23% compared to last quarter</li>
            <li>Management responsiveness scored highest among all metrics</li>
          </ul>
          <button className="primary-btn">Read Full Analysis →</button>
        </div>

        {/* Insights Chart */}
        <div className="chart-placeholder">
          <Bar
            data={{
              labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
              datasets: [
                {
                  label: "Previous Period",
                  backgroundColor: "#e57373",
                  data: [8, 5, 7, 6, 9, 6, 7],
                },
                {
                  label: "Current Period",
                  backgroundColor: "#4db6ac",
                  data: [4, 3, 8, 7, 11, 8, 9],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: true,
                  text: "Survey Data",
                },
              },
            }}
          />
        </div>
      </section>

      {/* Recent Surveys Section */}
      <section className="recent-surveys-section">
        <div className="survey-header">
          <h2>Recent Surveys</h2>
          <Link to="/surveys" className="view-all-btn">
            View All
          </Link>
        </div>

        <div className="survey-cards">
          {surveys.slice(0, 6).map((survey) => (
            <div key={survey.id} className="survey-card">
              <div className="survey-card-header">
                <span className={`status ${survey.status.toLowerCase()}`}>
                  {survey.status}
                </span>
                <span className="date">
                  <FaClock className="icon" /> {survey.date}
                </span>
              </div>
              <h3>{survey.title}</h3>
              <p className="description">{survey.description}</p>
              <p className="respondents">
                <FaUsers className="icon" /> {survey.respondents} respondents
              </p>
              <button className="view-results-btn">
                View Results <FaArrowRight className="arrow-icon" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;