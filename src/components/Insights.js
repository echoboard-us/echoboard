import React, { useState } from "react";
import { 
  FaCheckCircle, FaComments, FaUserTie, FaUsers, FaBullseye, 
  FaAward, FaChartLine, FaSignal, FaTimes, FaChevronUp,
  FaChevronDown, FaExternalLinkAlt
} from "react-icons/fa";
import "./Insights.css";

const insightsData = [
  {
    icon: <FaCheckCircle />,
    title: "Accountability",
    description: "Team members feel responsible for their work and outcomes.",
    detailedInsights: {
      summary: "Overall accountability score is 8.2/10 based on recent survey data.",
      keyMetrics: [
        { label: "Task Completion Rate", value: "94%", trend: "up" },
        { label: "Deadline Adherence", value: "87%", trend: "up" },
        { label: "Quality Standards Met", value: "92%", trend: "stable" }
      ],
      trends: [
        "Increased ownership of project deliverables",
        "Better documentation of decisions and rationale",
        "More proactive issue reporting"
      ],
      recommendations: [
        "Implement regular progress check-ins",
        "Create clear responsibility matrices",
        "Establish metrics for measuring individual contributions"
      ]
    }
  },
  {
    icon: <FaComments />,
    title: "Communication",
    description: "Clear and effective communication across teams and departments.",
    detailedInsights: {
      summary: "Communication effectiveness rated at 7.8/10 with room for improvement in cross-team collaboration.",
      keyMetrics: [
        { label: "Meeting Effectiveness", value: "82%", trend: "up" },
        { label: "Response Time", value: "2.4h", trend: "down" },
        { label: "Documentation Quality", value: "88%", trend: "up" }
      ],
      trends: [
        "Increased use of collaboration tools",
        "More structured team meetings",
        "Better documentation practices"
      ],
      recommendations: [
        "Standardize communication channels",
        "Implement async communication guidelines",
        "Regular communication training sessions"
      ]
    }
  },
  {
    icon: <FaUserTie />,
    title: "Management",
    description: "Leadership effectiveness and support for team members.",
    detailedInsights: {
      summary: "Leadership effectiveness scored 8.5/10, with strong performance in team support and guidance.",
      keyMetrics: [
        { label: "Team Satisfaction", value: "85%", trend: "up" },
        { label: "Goal Achievement", value: "91%", trend: "up" },
        { label: "Resource Allocation", value: "83%", trend: "stable" }
      ],
      trends: [
        "Improved feedback mechanisms",
        "More regular one-on-ones",
        "Better resource planning"
      ],
      recommendations: [
        "Develop leadership training program",
        "Implement 360-degree feedback",
        "Create mentorship opportunities"
      ]
    }
  },
  {
    icon: <FaUsers />,
    title: "Project Teams",
    description: "Collaboration and efficiency within project-specific teams.",
    detailedInsights: {
      summary: "Project team effectiveness rated at 8.0/10 with strong collaboration scores.",
      keyMetrics: [
        { label: "Team Velocity", value: "89%", trend: "up" },
        { label: "Collaboration Score", value: "86%", trend: "up" },
        { label: "Sprint Success Rate", value: "92%", trend: "up" }
      ],
      trends: [
        "Better cross-functional collaboration",
        "Improved sprint planning",
        "More effective team ceremonies"
      ],
      recommendations: [
        "Enhance team building activities",
        "Implement agile best practices",
        "Regular retrospectives"
      ]
    }
  },
  {
    icon: <FaBullseye />,
    title: "Goal Alignment",
    description: "Alignment between individual, team, and organizational goals.",
    detailedInsights: {
      summary: "Goal alignment effectiveness is 7.9/10, showing good progress in strategic alignment.",
      keyMetrics: [
        { label: "Goal Achievement", value: "84%", trend: "up" },
        { label: "Strategy Alignment", value: "88%", trend: "up" },
        { label: "OKR Completion", value: "79%", trend: "stable" }
      ],
      trends: [
        "Better understanding of company vision",
        "Improved goal setting process",
        "More regular goal reviews"
      ],
      recommendations: [
        "Regular strategy alignment sessions",
        "Implement OKR framework",
        "Create goal tracking dashboard"
      ]
    }
  },
  {
    icon: <FaAward />,
    title: "Recognition",
    description: "Acknowledgment of achievements and contributions.",
    detailedInsights: {
      summary: "Recognition program effectiveness rated 7.5/10, with opportunities for improvement.",
      keyMetrics: [
        { label: "Peer Recognition", value: "76%", trend: "up" },
        { label: "Award Distribution", value: "82%", trend: "stable" },
        { label: "Feedback Quality", value: "85%", trend: "up" }
      ],
      trends: [
        "Increased peer-to-peer recognition",
        "More regular celebration of wins",
        "Better recognition programs"
      ],
      recommendations: [
        "Implement recognition platform",
        "Create recognition guidelines",
        "Regular recognition events"
      ]
    }
  },
  {
    icon: <FaChartLine />,
    title: "Professional Growth",
    description: "Opportunities for skill development and career advancement.",
    detailedInsights: {
      summary: "Professional development satisfaction scored 7.8/10, with strong interest in learning opportunities.",
      keyMetrics: [
        { label: "Training Completion", value: "87%", trend: "up" },
        { label: "Skill Growth", value: "82%", trend: "up" },
        { label: "Career Progress", value: "75%", trend: "stable" }
      ],
      trends: [
        "Increased training participation",
        "More mentorship programs",
        "Better skill tracking"
      ],
      recommendations: [
        "Expand learning resources",
        "Create career paths",
        "Regular skill assessments"
      ]
    }
  },
  {
    icon: <FaSignal />,
    title: "Work Quality",
    description: "Standards of excellence and quality in deliverables.",
    detailedInsights: {
      summary: "Work quality metrics show an 8.3/10 average, with consistent improvement in standards.",
      keyMetrics: [
        { label: "Quality Score", value: "91%", trend: "up" },
        { label: "Error Rate", value: "2.1%", trend: "down" },
        { label: "Client Satisfaction", value: "89%", trend: "up" }
      ],
      trends: [
        "Improved quality control processes",
        "Better review procedures",
        "Enhanced testing practices"
      ],
      recommendations: [
        "Implement quality metrics",
        "Regular quality training",
        "Create quality guidelines"
      ]
    }
  }
];

const InsightsModal = ({ insight, onClose }) => {
  const [activeSection, setActiveSection] = useState('all');
  
  return (
    <div className="insights-modal-overlay" onClick={onClose}>
      <div className="insights-modal-content" onClick={e => e.stopPropagation()}>
        <div className="insights-modal-header">
          <div className="modal-title">
            <div className="modal-icon">{insight.icon}</div>
            <h2>{insight.title}</h2>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="insights-modal-body">
          <div className="insights-summary">
            <p>{insight.detailedInsights.summary}</p>
          </div>

          <div className="insights-metrics">
            <h3>Key Metrics</h3>
            <div className="metrics-grid">
              {insight.detailedInsights.keyMetrics.map((metric, index) => (
                <div key={index} className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">{metric.label}</span>
                    <span className={`metric-trend ${metric.trend}`}>
                      <FaChevronUp className={metric.trend === 'up' ? 'trend-up' : ''} />
                      <FaChevronDown className={metric.trend === 'down' ? 'trend-down' : ''} />
                    </span>
                  </div>
                  <div className="metric-value">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="insights-trends">
            <h3>Recent Trends</h3>
            <ul>
              {insight.detailedInsights.trends.map((trend, index) => (
                <li key={index}>
                  <FaChartLine className="trend-icon" />
                  {trend}
                </li>
              ))}
            </ul>
          </div>

          <div className="insights-recommendations">
            <h3>Recommendations</h3>
            <ul>
              {insight.detailedInsights.recommendations.map((rec, index) => (
                <li key={index}>
                  <FaExternalLinkAlt className="recommendation-icon" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const Insights = () => {
  const [selectedInsight, setSelectedInsight] = useState(null);

  return (
    <div className="insights-container">
      <h1>Insights</h1>
      <p className="subtitle">AI-powered analysis of your survey data.</p>
      <h2 className="section-title">AI-Driven Insights</h2>

      <div className="insights-grid">
        {insightsData.map((insight, index) => (
          <div 
            key={index} 
            className="insight-card"
            onClick={() => setSelectedInsight(insight)}
          >
            <div className="insight-icon">{insight.icon}</div>
            <h3>{insight.title}</h3>
            <p>{insight.description}</p>
          </div>
        ))}
      </div>

      {selectedInsight && (
        <InsightsModal 
          insight={selectedInsight} 
          onClose={() => setSelectedInsight(null)} 
        />
      )}
    </div>
  );
};

export default Insights;