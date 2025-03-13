import React from 'react';
import { useSurveys } from '../context/SurveyContext';
import { useTheme } from '../context/ThemeContext';
import { FaUsers, FaChartBar, FaArrowUp, FaArrowDown, FaClock } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import './Analytics.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Analytics = () => {
  const { surveys } = useSurveys();
  const { isDarkMode } = useTheme();

  // Calculate analytics data
  const totalSurveys = surveys.length;
  const activeSurveys = surveys.filter(s => s.status === 'Active').length;
  const completedSurveys = surveys.filter(s => s.status === 'Completed').length;
  const totalRespondents = surveys.reduce((sum, survey) => sum + survey.respondents, 0);
  const averageRespondents = Math.round(totalRespondents / totalSurveys);

  // Common chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#b3b3b3' : '#666666',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: isDarkMode ? '#b3b3b3' : '#666666',
        },
        grid: {
          color: isDarkMode ? '#404040' : '#e0e0e0',
        },
      },
      x: {
        ticks: {
          color: isDarkMode ? '#b3b3b3' : '#666666',
        },
        grid: {
          color: isDarkMode ? '#404040' : '#e0e0e0',
        },
      },
    },
  };

  // Response rate trends data
  const responseRateData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Response Rate',
        data: [65, 72, 68, 75, 82, 78, 85],
        borderColor: '#6a4ef9',
        backgroundColor: isDarkMode ? 'rgba(106, 78, 249, 0.2)' : 'rgba(106, 78, 249, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Survey status distribution
  const statusData = {
    labels: ['Active', 'Completed', 'Draft'],
    datasets: [
      {
        data: [activeSurveys, completedSurveys, totalSurveys - activeSurveys - completedSurveys],
        backgroundColor: ['#1976d2', '#2e7d32', '#757575'],
        borderWidth: 0,
      },
    ],
  };

  // Respondent trends
  const respondentData = {
    labels: surveys.slice(0, 5).map(survey => survey.title),
    datasets: [
      {
        label: 'Respondents',
        data: surveys.slice(0, 5).map(survey => survey.respondents),
        backgroundColor: '#6a4ef9',
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <p className="subtitle">Comprehensive insights and metrics for your surveys</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <FaUsers />
          </div>
          <div className="metric-content">
            <h3>Total Respondents</h3>
            <p className="metric-value">{totalRespondents}</p>
            <p className="metric-change positive">
              <FaArrowUp /> 12% from last month
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FaChartBar />
          </div>
          <div className="metric-content">
            <h3>Active Surveys</h3>
            <p className="metric-value">{activeSurveys}</p>
            <p className="metric-change positive">
              <FaArrowUp /> 5% from last month
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FaClock />
          </div>
          <div className="metric-content">
            <h3>Avg. Response Time</h3>
            <p className="metric-value">2.5 days</p>
            <p className="metric-change negative">
              <FaArrowDown /> 8% from last month
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FaChartBar />
          </div>
          <div className="metric-content">
            <h3>Completion Rate</h3>
            <p className="metric-value">78%</p>
            <p className="metric-change positive">
              <FaArrowUp /> 3% from last month
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Response Rate Trends</h3>
          <div className="chart-container">
            <Line
              data={responseRateData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    ...chartOptions.scales.y,
                    max: 100,
                    ticks: {
                      ...chartOptions.scales.y.ticks,
                      callback: (value) => `${value}%`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <h3>Survey Status Distribution</h3>
          <div className="chart-container">
            <Pie
              data={statusData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-card full-width">
          <h3>Recent Survey Respondents</h3>
          <div className="chart-container">
            <Bar
              data={respondentData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    ...chartOptions.scales.y,
                    ticks: {
                      ...chartOptions.scales.y.ticks,
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <h2>Key Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Survey Engagement</h4>
            <p>Employee satisfaction surveys show the highest engagement rates, with an average response rate of 85%.</p>
          </div>
          <div className="insight-card">
            <h4>Response Patterns</h4>
            <p>Most responses are submitted within the first 48 hours of survey distribution.</p>
          </div>
          <div className="insight-card">
            <h4>Question Analysis</h4>
            <p>Multiple-choice questions have a 92% completion rate compared to 78% for open-ended questions.</p>
          </div>
          <div className="insight-card">
            <h4>Trend Analysis</h4>
            <p>Overall survey participation has increased by 15% over the last quarter.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 