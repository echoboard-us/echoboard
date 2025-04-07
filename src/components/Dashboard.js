import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  FaSearch, FaUser, FaCalendar, FaDollarSign, FaBriefcase, 
  FaBell, FaCog, FaRobot, FaChevronDown, FaSyncAlt,
  FaDownload, FaSave, FaTimes, FaGripVertical, FaUsers,
  FaProjectDiagram, FaChartLine, FaChevronLeft, FaChevronRight,
  FaClipboardList
} from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('Weekly');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());
  const [teamOptions, setTeamOptions] = useState([]);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [aiSidePanelExpanded, setAiSidePanelExpanded] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    surveys: [],
    responses: [],
    insights: [],
    stats: {
      totalSurveys: 0,
      totalResponses: 0,
      averageResponseRate: 0,
      activeSurveys: 0
    }
  });

  // Fetch user's dashboard data
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchUserTeams();
    }
  }, [user]);

  const fetchUserTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('team_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentTeam(data.team_name);
        setTeamOptions([data.team_name]); // In this case, user belongs to one team
      }
    } catch (error) {
      console.error('Error fetching user teams:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch surveys
      const { data: surveys, error: surveysError } = await supabase
        .from('surveys')
        .select(`
          *,
          questions (count),
          survey_responses (count)
        `)
        .eq('creator_id', user.id);

      if (surveysError) throw surveysError;

      // Calculate stats
      const activeSurveys = surveys.filter(s => s.status === 'active').length;
      const totalResponses = surveys.reduce((sum, survey) => sum + (survey.survey_responses?.count || 0), 0);
      const averageResponseRate = surveys.length > 0 
        ? (totalResponses / surveys.length).toFixed(2) 
        : 0;

      // Update dashboard data
      setDashboardData({
        surveys,
        stats: {
          totalSurveys: surveys.length,
          totalResponses,
          averageResponseRate,
          activeSurveys
        }
      });

      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Generate chart data from surveys
  const generateChartData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date,
      responses: dashboardData.surveys.reduce((sum, survey) => {
        const responsesOnDate = survey.survey_responses?.filter(
          r => r.created_at.startsWith(date)
        ).length || 0;
        return sum + responsesOnDate;
      }, 0)
    }));
  };

  const stats = [
    {
      title: 'Total Surveys',
      value: dashboardData.stats.totalSurveys,
      change: '+3 vs last month',
      isPositive: true,
      icon: <FaClipboardList />,
      aiNote: "Creating regular surveys",
      autoUpdate: true
    },
    {
      title: 'Total Responses',
      value: dashboardData.stats.totalResponses,
      change: `+${Math.floor(Math.random() * 10)}%`,
      isPositive: true,
      icon: <FaUsers />,
      aiNote: "Good response rate",
      autoUpdate: true
    },
    {
      title: 'Active Surveys',
      value: dashboardData.stats.activeSurveys,
      change: `${Math.floor(Math.random() * 5)}`,
      isPositive: true,
      icon: <FaChartLine />,
      aiNote: "Surveys actively collecting data",
      autoUpdate: true
    },
    {
      title: 'Average Response Rate',
      value: `${dashboardData.stats.averageResponseRate}%`,
      change: `${(Math.random() * 2 - 1).toFixed(2)}%`,
      isPositive: Math.random() > 0.5,
      icon: <FaProjectDiagram />,
      aiNote: "Maintaining good engagement",
      autoUpdate: false
    }
  ];

  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <div className="dashboard-container">
      {!user ? (
        <div className="text-center p-4">
          <h2>Please log in to view your dashboard</h2>
        </div>
      ) : (
        <>
          {/* Dashboard Title Section */}
          <div className="dashboard-title-section">
            <h1>Dashboard</h1>
            <p>Welcome back, {user.user_metadata.full_name}! Here's your survey analytics overview.</p>
          </div>

          {/* Dashboard Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <div className="team-switcher">
                  <FaBriefcase />
                  <span>{currentTeam}</span>
                </div>
              </div>

              <div className="header-filters">
                <div className="date-range-picker">
                  <FaCalendar />
                  <span>Last 7 days</span>
                </div>
                <button onClick={handleRefresh} className="refresh-button">
                  <FaSyncAlt /> Refresh
                </button>
              </div>

              <div className="header-right">
                <button className="icon-button" title="Notifications">
                  <FaBell />
                </button>
                <button className="icon-button" title="Settings">
                  <FaCog />
                </button>
                <button 
                  className={`ai-toggle-button ${aiSidePanelExpanded ? 'active' : ''}`}
                  onClick={() => setAiSidePanelExpanded(!aiSidePanelExpanded)}
                  title="AI Assistant"
                >
                  <FaRobot />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="stats-overview">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card" draggable="true">
                <div className="stat-card-header">
                  <FaGripVertical className="drag-handle" />
                  <button 
                    className={`auto-update-toggle ${stat.autoUpdate ? 'active' : ''}`}
                    onClick={() => handleAutoUpdateToggle(index)}
                  >
                    <FaSyncAlt />
                  </button>
                </div>
                <div className="stat-card-content">
                  <div className="stat-icon">{stat.icon}</div>
                  <h3>{stat.title}</h3>
                  <div className="stat-value">{stat.value}</div>
                  <div className={`stat-change ${stat.isPositive ? 'positive' : 'negative'}`}>
                    {stat.change}
                  </div>
                  <div className="ai-note">
                    <FaRobot />
                    <span>{stat.aiNote}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Response Trends Chart */}
          <div className="chart-section">
            <h2>Response Trends</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={generateChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="responses" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Surveys */}
          <div className="recent-surveys">
            <h2>Recent Surveys</h2>
            <div className="surveys-grid">
              {dashboardData.surveys.slice(0, 3).map((survey) => (
                <div key={survey.id} className="survey-card">
                  <h3>{survey.title}</h3>
                  <p>{survey.description}</p>
                  <div className="survey-meta">
                    <span>{survey.questions?.count || 0} questions</span>
                    <span>{survey.survey_responses?.count || 0} responses</span>
                    <span className={`status ${survey.status}`}>{survey.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="last-updated">
            Last updated: {lastUpdated}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;