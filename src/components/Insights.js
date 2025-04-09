import React, { useState, useEffect } from "react";
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { generateSurveyInsights } from '../services/openai';
import { 
  FaChartBar, FaChevronUp, FaChevronDown, 
  FaExternalLinkAlt, FaTimes, FaRobot, FaBell
} from "react-icons/fa";
import "./Insights.css";

const InsightsModal = ({ survey, onClose }) => {
  const [activeSection, setActiveSection] = useState('all');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [responses, setResponses] = useState([]);
  const [newResponseAlert, setNewResponseAlert] = useState(false);
  
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const { data, error } = await supabase
          .from('responses')
          .select(`
            *,
            answers (
              question_id,
              answer
            )
          `)
          .eq('survey_id', survey.id);

        if (error) throw error;
        setResponses(data);
        await processInsights(data);
      } catch (error) {
        console.error('Error fetching responses:', error);
      }
    };

    fetchResponses();

    // Set up real-time subscription
    const subscription = supabase
      .channel('responses-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'responses',
        filter: `survey_id=eq.${survey.id}`
      }, async (payload) => {
        // Fetch the complete response with answers
        const { data: newResponse, error } = await supabase
          .from('responses')
          .select(`
            *,
            answers (
              question_id,
              answer
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (!error) {
          setNewResponseAlert(true);
          setResponses(prev => [...prev, newResponse]);
          // Update insights with new response
          await processInsights([...responses, newResponse]);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [survey.id]);

  const processInsights = async (responseData) => {
    try {
      setLoading(true);
      
      // Calculate response rate and metrics
      const responseRate = responseData.length;
      
      // Process answers
      const answersByQuestion = {};
      responseData.forEach(response => {
        response.answers.forEach(answer => {
          if (!answersByQuestion[answer.question_id]) {
            answersByQuestion[answer.question_id] = [];
          }
          answersByQuestion[answer.question_id].push(answer.answer);
        });
      });

      // Calculate metrics for each question
      const questionMetrics = {};
      Object.entries(answersByQuestion).forEach(([questionId, answers]) => {
        const question = survey.questions.find(q => q.id === parseInt(questionId));
        if (!question) return;

        if (question.type === 'rating') {
          const numericAnswers = answers.map(a => parseInt(a)).filter(a => !isNaN(a));
          const avg = numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length;
          questionMetrics[questionId] = {
            average: avg.toFixed(1),
            responses: answers.length,
            distribution: calculateDistribution(numericAnswers)
          };
        } else if (['multiple_choice', 'checkbox', 'dropdown'].includes(question.type)) {
          const counts = {};
          answers.forEach(answer => {
            const options = answer.split(', ');
            options.forEach(option => {
              counts[option] = (counts[option] || 0) + 1;
            });
          });
          questionMetrics[questionId] = {
            distribution: counts,
            responses: answers.length
          };
        }
      });

      const insightData = {
        summary: `Received ${responseRate} responses for "${survey.title}"`,
        keyMetrics: [
          { 
            label: "Total Submissions", 
            value: responseRate.toString(),
            trend: "up"
          },
          { 
            label: "Completion Rate", 
            value: `${((responseData.filter(r => r.completed).length / responseRate) * 100).toFixed(0)}%`,
            trend: "stable"
          },
          {
            label: "Average Time",
            value: calculateAverageTime(responseData),
            trend: "neutral"
          }
        ],
        questionInsights: Object.entries(questionMetrics).map(([questionId, metrics]) => {
          const question = survey.questions.find(q => q.id === parseInt(questionId));
          return {
            question: question.question,
            type: question.type,
            metrics: metrics
          };
        })
      };

      setInsights(insightData);
      
      // Generate AI insights if we have responses
      if (responseData.length > 0) {
        setAiLoading(true);
        try {
          const aiInsights = await generateSurveyInsights(survey, responseData);
          setAiAnalysis(aiInsights);
        } catch (error) {
          console.error('Error generating AI insights:', error);
        } finally {
          setAiLoading(false);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing insights:', error);
      setLoading(false);
    }
  };

  const calculateDistribution = (numbers) => {
    const distribution = {};
    numbers.forEach(num => {
      distribution[num] = (distribution[num] || 0) + 1;
    });
    return distribution;
  };

  const calculateAverageTime = (responseData) => {
    const times = responseData
      .filter(r => r.completed_at && r.created_at)
      .map(r => new Date(r.completed_at) - new Date(r.created_at));
    
    if (times.length === 0) return "N/A";
    
    const avgSeconds = Math.floor((times.reduce((a, b) => a + b, 0) / times.length) / 1000);
    return `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="insights-modal-overlay">
        <div className="insights-modal loading-modal" onClick={e => e.stopPropagation()}>
          <div className="loading-container">
            <div className="loading-animation"></div>
            <h3 className="loading-text">Generating Insights</h3>
            <p className="loading-subtext">Analyzing survey responses and preparing your insights...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="insights-modal-overlay" onClick={onClose}>
      <div className="insights-modal" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        
        <div className="modal-header">
          <h2>{survey.title} - Insights</h2>
          {newResponseAlert && (
            <div className="new-response-alert" onClick={() => setNewResponseAlert(false)}>
              <FaBell /> New responses received! Analysis updated.
            </div>
          )}
          <p className="summary">{insights.summary}</p>
        </div>

        <div className="modal-content">
          <div className="key-metrics">
            {insights.keyMetrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <h3>{metric.label}</h3>
                <p className="metric-value">
                  {metric.value}
                  {metric.trend === 'up' && <FaChevronUp className="trend up" />}
                  {metric.trend === 'down' && <FaChevronDown className="trend down" />}
                  {metric.trend === 'stable' && <FaExternalLinkAlt className="trend stable" />}
                </p>
              </div>
            ))}
          </div>

          <div className="question-insights">
            <h3>Question Analysis</h3>
            {insights.questionInsights.map((qi, index) => (
              <div key={index} className="question-insight-card">
                <h4>{qi.question}</h4>
                {qi.type === 'rating' && (
                  <div className="metric-value">
                    Average Rating: {qi.metrics.average}
                    <div className="distribution-chart">
                      {Object.entries(qi.metrics.distribution).map(([rating, count], i) => (
                        <div key={i} className="distribution-bar">
                          <span className="rating-label">{rating}</span>
                          <div className="bar-container">
                            <div 
                              className="bar" 
                              style={{ 
                                width: `${(count / qi.metrics.responses) * 100}%` 
                              }} 
                            />
                            <span className="count">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="response-count">
                      {qi.metrics.responses} responses
                    </div>
                  </div>
                )}
                {['multiple_choice', 'checkbox', 'dropdown'].includes(qi.type) && (
                  <div className="distribution">
                    {Object.entries(qi.metrics.distribution).map(([option, count], i) => (
                      <div key={i} className="distribution-bar">
                        <span className="option-label">{option}:</span>
                        <div className="bar-container">
                          <div 
                            className="bar" 
                            style={{ 
                              width: `${(count / qi.metrics.responses) * 100}%` 
                            }} 
                          />
                          <span className="count">{count}</span>
                        </div>
                </div>
              ))}
            </div>
                )}
              </div>
            ))}
          </div>

          {aiAnalysis && (
            <div className="ai-insights">
              <h3>
                <FaRobot className="ai-icon" /> AI-Generated Insights
              </h3>
              <div className="ai-content">
                {aiLoading ? (
                  <div className="loading-spinner">
                    <span className="loading-dot">•</span> Updating AI insights...
                  </div>
                ) : (
                  <>
                    <div className="ai-summary">
                      {aiAnalysis.structured_analysis.summary}
                    </div>
                    {aiAnalysis.structured_analysis.sections.map((section, index) => (
                      <div key={index} className="ai-section">
                        <h4>{section.title}</h4>
                        <ul>
                          {section.content.map((item, i) => (
                            <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
                    ))}
                  </>
                )}
              </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Insights = () => {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('surveys')
          .select(`
            *,
            questions (
              id,
              question,
              type,
              choices,
              question_order
            )
          `)
          .eq('creator_id', user.id)
          .eq('status', 'completed');

        if (error) throw error;
        setSurveys(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching surveys:', error);
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [user]);

  if (loading) {
    return (
      <div className="insights-container">
        <div className="loading-spinner">
          <span className="loading-dot">•</span> Loading surveys...
        </div>
      </div>
    );
  }

  return (
    <div className="insights-container">
      <h1>Survey Insights</h1>
      
      {surveys.length === 0 ? (
        <div className="no-surveys">
          <p>No completed surveys found. Complete a survey to see insights.</p>
        </div>
      ) : (
        <div className="surveys-grid">
          {surveys.map(survey => (
            <div key={survey.id} className="survey-card" onClick={() => setSelectedSurvey(survey)}>
              <div className="card-icon">
                <FaChartBar />
              </div>
              <h3>{survey.title}</h3>
              <p>{survey.description || 'No description provided'}</p>
              <button className="view-insights-btn">
                View Insights
              </button>
          </div>
        ))}
      </div>
      )}

      {selectedSurvey && (
        <InsightsModal 
          survey={selectedSurvey} 
          onClose={() => setSelectedSurvey(null)} 
        />
      )}
    </div>
  );
};

export default Insights;