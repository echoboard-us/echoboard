import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  FaUsers, FaChartBar, FaComments, FaStar,
  FaCalendarAlt, FaFilter, FaDownload, FaShare
} from 'react-icons/fa';
import './Analytics.css';

// Mock data for charts
const responseData = [
  { date: '2024-01', responses: 120 },
  { date: '2024-02', responses: 150 },
  { date: '2024-03', responses: 180 },
  { date: '2024-04', responses: 210 },
  { date: '2024-05', responses: 250 },
];

const satisfactionData = [
  { name: 'Very Satisfied', value: 45 },
  { name: 'Satisfied', value: 30 },
  { name: 'Neutral', value: 15 },
  { name: 'Dissatisfied', value: 7 },
  { name: 'Very Dissatisfied', value: 3 },
];

const categoryData = [
  { category: 'Product', responses: 85 },
  { category: 'Service', responses: 65 },
  { category: 'Support', responses: 45 },
  { category: 'Features', responses: 35 },
  { category: 'UX/UI', responses: 30 },
];

const COLORS = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetrics, setSelectedMetrics] = useState(['responses', 'satisfaction']);

  const metrics = {
    totalResponses: 910,
    averageRating: 4.2,
    completionRate: '87%',
    avgTimeToComplete: '4.5 min'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="value">{`${payload[0].value} responses`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <p className="subtitle">Comprehensive survey performance metrics and insights</p>
      </div>

      <div className="analytics-controls">
        <div className="control-group">
          <button className="control-btn">
            <FaCalendarAlt /> Last 30 Days
          </button>
          <button className="control-btn">
            <FaFilter /> Filter
          </button>
        </div>
        <div className="control-group">
          <button className="control-btn">
            <FaDownload /> Export
          </button>
          <button className="control-btn">
            <FaShare /> Share
          </button>
        </div>
      </div>

      <div className="metrics-overview">
        <div className="metric-card">
          <div className="metric-icon">
            <FaUsers />
          </div>
          <div className="metric-content">
            <h3>Total Responses</h3>
            <p className="metric-value">{metrics.totalResponses}</p>
            <p className="metric-trend positive">+12.5% vs last month</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FaStar />
          </div>
          <div className="metric-content">
            <h3>Average Rating</h3>
            <p className="metric-value">{metrics.averageRating}</p>
            <p className="metric-trend positive">+0.3 vs last month</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FaChartBar />
          </div>
          <div className="metric-content">
            <h3>Completion Rate</h3>
            <p className="metric-value">{metrics.completionRate}</p>
            <p className="metric-trend positive">+5% vs last month</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FaComments />
          </div>
          <div className="metric-content">
            <h3>Avg. Time to Complete</h3>
            <p className="metric-value">{metrics.avgTimeToComplete}</p>
            <p className="metric-trend negative">+0.5 min vs last month</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Response Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={responseData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="responses" 
                stroke="var(--primary-color)" 
                fillOpacity={1} 
                fill="url(#responseGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Satisfaction Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={satisfactionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {satisfactionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Response Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="responses" fill="var(--primary-color)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Response Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={responseData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="responses" 
                stroke="#82ca9d" 
                fillOpacity={1} 
                fill="url(#timeGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 