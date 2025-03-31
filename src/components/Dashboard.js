import React, { useState } from 'react';
import { 
  FaSearch, FaUser, FaCalendar, FaDollarSign, FaBriefcase, 
  FaBell, FaCog, FaRobot, FaChevronDown, FaSyncAlt,
  FaDownload, FaSave, FaTimes, FaGripVertical, FaUsers,
  FaProjectDiagram, FaChartLine, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('Weekly');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState('Strategy Team');
  const [aiQuery, setAiQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());
  const [teamOptions] = useState(['Strategy Team', 'Technology Team', 'Operations Team', 'Finance Team']);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [aiSidePanelExpanded, setAiSidePanelExpanded] = useState(false);

  // Example prompt suggestions
  const promptSuggestions = [
    "Show project completion trends",
    "Compare client satisfaction Q1 vs Q2",
    "Analyze consultant utilization rates",
    "Identify high-growth client sectors"
  ];

  // Mock data for stats
  const stats = [
    {
      title: 'Active Projects',
      value: '24',
      change: '+3 vs last month',
      isPositive: true,
      icon: <FaProjectDiagram />,
      aiNote: "15% above quarterly target",
      autoUpdate: true
    },
    {
      title: 'Consultant Utilization',
      value: '86%',
      change: '+2.67%',
      isPositive: true,
      icon: <FaUsers />,
      aiNote: "Optimal range achieved",
      autoUpdate: true
    },
    {
      title: 'Revenue Pipeline',
      value: '$8.2M',
      change: '+12.54%',
      isPositive: true,
      icon: <FaDollarSign />,
      aiNote: "Strong Q3 forecast",
      autoUpdate: true
    },
    {
      title: 'Client Satisfaction',
      value: '94%',
      change: '-1.57%',
      isPositive: false,
      icon: <FaChartLine />,
      aiNote: "Action needed in Tech sector",
      autoUpdate: false
    }
  ];

  // Mock data for projects
  const projects = [
    {
      name: 'Digital Transformation',
      client: 'TechCorp Inc.',
      team: 'Technology',
      members: '6 Consultants',
      status: 'In Progress'
    },
    {
      name: 'Market Entry Strategy',
      client: 'Global Ventures',
      team: 'Strategy',
      members: '4 Consultants',
      status: 'Planning'
    },
    {
      name: 'Operations Optimization',
      client: 'Manufacturing Co.',
      team: 'Operations',
      members: '5 Consultants',
      status: 'In Progress'
    }
  ];

  // Mock data for performance metrics
  const performanceData = [
    { week: 'Week 1', value: 82 },
    { week: 'Week 2', value: 85 },
    { week: 'Week 3', value: 89 },
    { week: 'Week 4', value: 87 },
    { week: 'Week 5', value: 91 },
    { week: 'Week 6', value: 92 },
    { week: 'Week 7', value: 90 }
  ];

  // Mock data for top performing sectors
  const sectors = [
    {
      name: 'Technology & Digital',
      growth: '+24%',
      revenue: '$2.8M'
    },
    {
      name: 'Financial Services',
      growth: '+18%',
      revenue: '$2.1M'
    },
    {
      name: 'Healthcare & Life Sciences',
      growth: '+15%',
      revenue: '$1.9M'
    }
  ];

  // Mock data for additional charts
  const utilizationData = [
    { week: 'Week 1', value: 78 },
    { week: 'Week 2', value: 82 },
    { week: 'Week 3', value: 85 },
    { week: 'Week 4', value: 88 },
    { week: 'Week 5', value: 86 },
    { week: 'Week 6', value: 89 },
    { week: 'Week 7', value: 92 }
  ];

  const revenueData = [
    { week: 'Week 1', value: 720000 },
    { week: 'Week 2', value: 850000 },
    { week: 'Week 3', value: 950000 },
    { week: 'Week 4', value: 880000 },
    { week: 'Week 5', value: 1020000 },
    { week: 'Week 6', value: 1150000 },
    { week: 'Week 7', value: 1250000 }
  ];

  // Add campaign performance data
  const campaignData = [
    { week: 'Week 1', impressions: 125000, clicks: 2800 },
    { week: 'Week 2', impressions: 145000, clicks: 3200 },
    { week: 'Week 3', impressions: 165000, clicks: 3600 },
    { week: 'Week 4', impressions: 155000, clicks: 3400 },
    { week: 'Week 5', impressions: 175000, clicks: 3900 },
    { week: 'Week 6', impressions: 185000, clicks: 4100 },
    { week: 'Week 7', impressions: 195000, clicks: 4300 }
  ];

  const handleAiQuery = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to process the AI query
    console.log('Processing query:', aiQuery);
    setAiPanelOpen(true);
  };

  const handleTeamChange = (team) => {
    setCurrentTeam(team);
  };

  const handleAutoUpdateToggle = (index) => {
    // Toggle auto-update status for a stat card
    const updatedStats = [...stats];
    updatedStats[index].autoUpdate = !updatedStats[index].autoUpdate;
    // You would typically update the state here
  };

  const toggleAiPanel = () => {
    setAiSidePanelExpanded(!aiSidePanelExpanded);
  };

  return (
    <div className="dashboard-container">
      {/* Dashboard Title Section */}
      <div className="dashboard-title-section">
        <h1>Dashboard</h1>
        <p>Your own customizable insights dashboard for monitoring performance metrics and analytics.</p>
      </div>

      {/* Digital Advertising Performance Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="team-switcher" onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}>
              <FaBriefcase />
              <span>{currentTeam}</span>
              <FaChevronDown />
              {teamDropdownOpen && (
                <div className="team-dropdown">
                  {teamOptions.map((team) => (
                    <div
                      key={team}
                      className="team-option"
                      onClick={() => handleTeamChange(team)}
                    >
                      {team}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="header-filters">
            <div className="date-range-picker">
              <FaCalendar />
              <span>2022-05-31 - 2022-11-16</span>
            </div>
            <div className="segment-selector">
              <select defaultValue="all">
                <option value="all">All</option>
                <option value="facebook">Facebook</option>
                <option value="google">Google Ads</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
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
              onClick={toggleAiPanel}
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
                title={stat.autoUpdate ? 'Auto-updating' : 'Click to enable auto-update'}
              >
                <FaSyncAlt />
              </button>
            </div>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-title">{stat.title}</div>
            <div className="stat-value">{stat.value}</div>
            <div className={`stat-change ${stat.isPositive ? 'positive' : 'negative'}`}>
              {stat.change}
            </div>
            <div className="ai-note">{stat.aiNote}</div>
          </div>
        ))}
      </div>

      {/* Dashboard Cards Grid */}
      <div className="dashboard-cards">
        {/* Team Performance Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Team Performance Metrics</h2>
            <div className="card-actions">
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'Weekly' ? 'active' : ''}`}
                  onClick={() => setViewMode('Weekly')}
                >
                  Weekly
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'Monthly' ? 'active' : ''}`}
                  onClick={() => setViewMode('Monthly')}
                >
                  Monthly
                </button>
              </div>
              <button className="auto-update-toggle active">
                <FaSyncAlt />
              </button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consultant Utilization Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Consultant Utilization</h2>
            <div className="card-actions">
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'Weekly' ? 'active' : ''}`}
                  onClick={() => setViewMode('Weekly')}
                >
                  Weekly
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'Monthly' ? 'active' : ''}`}
                  onClick={() => setViewMode('Monthly')}
                >
                  Monthly
                </button>
              </div>
              <button className="auto-update-toggle active">
                <FaSyncAlt />
              </button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilizationData}>
                <defs>
                  <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2ecc71" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2ecc71" 
                  fillOpacity={1} 
                  fill="url(#colorUtilization)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trends Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Revenue Trends</h2>
            <div className="card-actions">
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'Weekly' ? 'active' : ''}`}
                  onClick={() => setViewMode('Weekly')}
                >
                  Weekly
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'Monthly' ? 'active' : ''}`}
                  onClick={() => setViewMode('Monthly')}
                >
                  Monthly
                </button>
              </div>
              <button className="auto-update-toggle active">
                <FaSyncAlt />
              </button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3498db" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3498db" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3498db" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Performance Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Campaign Performance</h2>
            <div className="card-actions">
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'Weekly' ? 'active' : ''}`}
                  onClick={() => setViewMode('Weekly')}
                >
                  Weekly
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'Monthly' ? 'active' : ''}`}
                  onClick={() => setViewMode('Monthly')}
                >
                  Monthly
                </button>
              </div>
              <button className="auto-update-toggle active">
                <FaSyncAlt />
              </button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={campaignData}>
                <defs>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e74c3c" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#e74c3c" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f39c12" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f39c12" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="#e74c3c" 
                  fillOpacity={1} 
                  fill="url(#colorImpressions)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#f39c12" 
                  fillOpacity={1} 
                  fill="url(#colorClicks)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Assistant Side Panel */}
      <div className={`ai-side-panel ${aiSidePanelExpanded ? 'expanded' : ''}`}>
        <div className="panel-header">
          <h3>Echo AI Assistant</h3>
          <button className="close-button" onClick={toggleAiPanel}>
            <FaTimes />
          </button>
        </div>
        
        <div className="ai-query-section">
          <form className="ai-query-form" onSubmit={handleAiQuery}>
            <input
              type="text"
              placeholder="Ask about your metrics..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
            />
            <button type="submit" className="ai-button">
              <FaSearch />
            </button>
          </form>
        </div>

        <div className="prompt-suggestions">
          <h4>Try asking about:</h4>
          {promptSuggestions.map((prompt, index) => (
            <button
              key={index}
              className="prompt-suggestion"
              onClick={() => setAiQuery(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="ai-response">
          {aiQuery && (
            <div className="response-content">
              <p>Find ads channel with best conversion rate in 2022</p>
              <div className="sql-query">
                SELECT channel, campaign, SUM(clicks)/SUM(impressions) AS ctr
                FROM digital_ads_performance
                WHERE date BETWEEN '2022-01-01' AND '2022-12-31'
                GROUP BY channel, campaign
                ORDER BY ctr DESC
                LIMIT 1;
              </div>
              <div className="query-result">
                <table>
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Campaign</th>
                      <th>CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Instagram</td>
                      <td>Campaign 8</td>
                      <td>0.214022140221402</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <div className="footer-left">
          <span>Last updated: {lastUpdated}</span>
        </div>
        <div className="footer-right">
          <button className="footer-button">
            <FaSave /> Save Dashboard
          </button>
          <button className="footer-button">
            <FaDownload /> Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;