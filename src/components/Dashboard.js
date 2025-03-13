import React from "react";
import { FaClock, FaUsers, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
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

const surveys = [
  {
    title: "Q2 Employee Satisfaction",
    description:
      "Quarterly survey to measure employee satisfaction, engagement, and gather feedback on company culture and work environment.",
    respondents: 124,
    status: "Active",
    date: "2 days ago",
  },
  {
    title: "Project Feedback – Mobile App",
    description:
      "Gathering feedback on the recent mobile app development project, focusing on team collaboration, resource allocation, and timeline management.",
    respondents: 32,
    status: "Completed",
    date: "1 week ago",
  },
  {
    title: "Management Effectiveness",
    description:
      "Assessment of management effectiveness across departments, focusing on leadership qualities, communication, and decision-making processes.",
    respondents: 78,
    status: "Completed",
    date: "2 weeks ago",
  },
  {
    title: "New Hire Onboarding Experience",
    description:
      "Survey for recent hires to evaluate the effectiveness of our onboarding process, training materials, and initial support systems.",
    respondents: 15,
    status: "Active",
    date: "3 weeks ago",
  },
  {
    title: "Remote Work Assessment",
    description:
      "Evaluation of remote work policies, tools, and practices to identify areas for improvement and ensure team productivity.",
    respondents: 0,
    status: "Draft",
    date: "1 day ago",
  },
  {
    title: "Customer Support Satisfaction",
    description:
      "Measuring customer satisfaction with our support team, response times, and issue resolution effectiveness.",
    respondents: 210,
    status: "Completed",
    date: "1 month ago",
  },
];

const Dashboard = () => {
  return (
    <div className="dashboard-container">
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
          {surveys.map((survey, index) => (
            <div key={index} className="survey-card">
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