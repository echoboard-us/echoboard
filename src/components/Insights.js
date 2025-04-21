import React, { useState, useEffect, useCallback } from "react";
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { generateSurveyInsights, generateTeamInsights } from '../services/openai';
import { 
  FaRobot, FaBell, FaTimes, FaChartBar, 
  FaChevronDown, FaChevronRight, FaDatabase, FaUsers
} from "react-icons/fa";
import "./Insights.css";

const InsightsModal = ({ survey, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [responseData, setResponseData] = useState([]);
  const [newResponseAlert, setNewResponseAlert] = useState(false);
  
  const processInsights = useCallback(async (responseData) => {
    try {
      setLoading(true);
      
      const responseRate = responseData.length;
      
      const answersByQuestion = {};
      responseData.forEach(response => {
        response.answers.forEach(answer => {
          if (!answersByQuestion[answer.question_id]) {
            answersByQuestion[answer.question_id] = [];
          }
          answersByQuestion[answer.question_id].push(answer.answer);
        });
      });

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
        keyMetrics: [
          { 
            label: "Total Submissions", 
            value: responseRate.toString(),
            trend: "up"
          },
          ...(responseRate > 0 ? [{
            label: "Completion Rate", 
            value: `${((responseData.filter(r => r.completed).length / responseRate) * 100).toFixed(0)}%`,
            trend: "stable"
          }] : []),
          ...(calculateAverageTime(responseData) !== "N/A" ? [{
            label: "Average Time",
            value: calculateAverageTime(responseData),
            trend: "neutral"
          }] : [])
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
  }, [survey]);

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
        setResponseData(data);
        await processInsights(data);
      } catch (error) {
        console.error('Error fetching responses:', error);
      }
    };

    fetchResponses();

    const subscription = supabase
      .channel('responses-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'responses',
        filter: `survey_id=eq.${survey.id}`
      }, async (payload) => {
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
          setResponseData(prev => {
            const updatedResponses = [...prev, newResponse];
            processInsights(updatedResponses);
            return updatedResponses;
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [survey.id, processInsights]);

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
        <div className="modal-header">
          <h2>{survey.title} - Insights</h2>
          {newResponseAlert && (
            <div className="new-response-alert" onClick={() => setNewResponseAlert(false)}>
              <FaBell /> New responses received! Analysis updated.
            </div>
          )}
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          <div className="insights-container-box">
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
                      {/* Key Findings Section */}
                      <div className="ai-section">
                        <h4>Key Findings</h4>
                        <div className="findings-list">
                          {aiAnalysis.structured_analysis.key_findings?.map((finding, index) => {

                            let titleText = finding.title;
                            let descriptionText = finding.description;
                            
                            survey.questions.forEach(q => {
                              const idStr = `Question ${q.id}`;
                              const uuidPattern = new RegExp(`Question [a-f0-9-]{36}`, 'g');
                              
                              if (titleText) {
                                titleText = titleText.replace(new RegExp(idStr, 'g'), `"${q.question}"`);
                                titleText = titleText.replace(uuidPattern, (match) => {

                                  const uuid = match.replace('Question ', '');
                                  const matchedQuestion = survey.questions.find(q => q.id === uuid);
                                  return matchedQuestion ? `"${matchedQuestion.question}"` : match;
                                });
                              }
                              
                              if (descriptionText) {
                                descriptionText = descriptionText.replace(new RegExp(idStr, 'g'), `"${q.question}"`);
                                descriptionText = descriptionText.replace(uuidPattern, (match) => {

                                  const uuid = match.replace('Question ', '');
                                  const matchedQuestion = survey.questions.find(q => q.id === uuid);
                                  return matchedQuestion ? `"${matchedQuestion.question}"` : match;
                                });
                              }
                            });
                            

                            const processedStats = finding.supporting_stats?.map(stat => {
                              let statText = stat;
                              survey.questions.forEach(q => {
                                const idStr = `Question ${q.id}`;
                                if (statText) {
                                  statText = statText.replace(new RegExp(idStr, 'g'), `"${q.question}"`);
                                }
                              });

                              const uuidPattern = new RegExp(`Question [a-f0-9-]{36}`, 'g');
                              statText = statText.replace(uuidPattern, (match) => {
                                const uuid = match.replace('Question ', '');
                                const matchedQuestion = survey.questions.find(q => q.id === uuid);
                                return matchedQuestion ? `"${matchedQuestion.question}"` : match;
                              });
                              return statText;
                            });
                            
                            return (
                              <div key={index} className="finding-item">
                                <h5>{titleText}</h5>
                                <p>{descriptionText}</p>
                                {processedStats && processedStats.length > 0 && (
                                  <ul className="supporting-stats">
                                    {processedStats.map((stat, i) => (
                                      <li key={i}>{stat}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sentiment Summary Section */}
                      <div className="ai-section">
                        <h4>Sentiment Analysis</h4>
                        <div className="sentiment-summary">
                          <div className="overall-sentiment">
                            <p>Overall: <span className={`sentiment ${aiAnalysis.structured_analysis.sentiment_summary?.overall}`}>
                              {aiAnalysis.structured_analysis.sentiment_summary?.overall || 'N/A'}
                            </span></p>
                          </div>
                          {aiAnalysis.structured_analysis.sentiment_summary?.by_question && (
                            <div className="sentiment-by-question">
                              <h5>By Question:</h5>
                              <ul>
                                {aiAnalysis.structured_analysis.sentiment_summary.by_question.map((item, i) => {

                                  const question = survey.questions.find(q => 
                                    q.id === parseInt(item.question_id) || 
                                    q.id === item.question_id ||
                                    q.id.toString() === item.question_id
                                  );
                                  
                                  return (
                                    <li key={i}>
                                      <span className="question-text">{question ? question.question : `Question ${item.question_id}`}: </span>
                                      <span className={`sentiment ${item.sentiment}`}>{item.sentiment}</span>
                                      {item.score && <span className="score"> ({item.score.toFixed(1)})</span>}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Patterns and Trends Section */}
                      <div className="ai-section">
                        <h4>Patterns & Trends</h4>
                        <div className="patterns-list">
                          {aiAnalysis.structured_analysis.patterns_and_trends?.map((pattern, index) => {
                            let patternText = pattern.pattern;
                            let detailsText = pattern.details;
                            

                            const uuidPattern = new RegExp(`Question [a-f0-9-]{36}`, 'g');
                            
                            if (patternText) {
                              survey.questions.forEach(q => {
                                const idStr = `Question ${q.id}`;
                                if (patternText.includes(idStr)) {
                                  patternText = patternText.replace(new RegExp(idStr, 'g'), `"${q.question}"`);
                                }
                              });
                              

                              patternText = patternText.replace(uuidPattern, (match) => {
                                const uuid = match.replace('Question ', '');
                                const matchedQuestion = survey.questions.find(q => q.id === uuid);
                                return matchedQuestion ? `"${matchedQuestion.question}"` : match;
                              });
                            }
                            
                            if (detailsText) {
                              survey.questions.forEach(q => {
                                const idStr = `Question ${q.id}`;
                                if (detailsText.includes(idStr)) {
                                  detailsText = detailsText.replace(new RegExp(idStr, 'g'), `"${q.question}"`);
                                }
                              });
                              

                              detailsText = detailsText.replace(uuidPattern, (match) => {
                                const uuid = match.replace('Question ', '');
                                const matchedQuestion = survey.questions.find(q => q.id === uuid);
                                return matchedQuestion ? `"${matchedQuestion.question}"` : match;
                              });
                            }
                            
                            return (
                              <div key={index} className="pattern-item">
                                <h5>{patternText}</h5>
                                <p>{detailsText}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Statistical Highlights Section */}
                      <div className="ai-section">
                        <h4>Statistical Highlights</h4>
                        <div className="stats-list">
                          {aiAnalysis.structured_analysis.statistical_highlights?.map((stat, index) => {

                            let metricText = stat.metric;
                            let contextText = stat.context;
                            
                            const uuidPattern = new RegExp(`Question [a-f0-9-]{36}`, 'g');
                            
                            if (metricText) {
                              survey.questions.forEach(q => {
                                const idStr = `Question ${q.id}`;
                                if (metricText.includes(idStr)) {
                                  metricText = metricText.replace(new RegExp(idStr, 'g'), `"${q.question}"`);
                                }
                              });
                              
                              metricText = metricText.replace(uuidPattern, (match) => {
                                const uuid = match.replace('Question ', '');
                                const matchedQuestion = survey.questions.find(q => q.id === uuid);
                                return matchedQuestion ? `"${matchedQuestion.question}"` : match;
                              });
                            }
                            
                            if (contextText) {
                              survey.questions.forEach(q => {
                                const idStr = `Question ${q.id}`;
                                if (contextText.includes(idStr)) {
                                  contextText = contextText.replace(new RegExp(idStr, 'g'), `"${q.question}"`);
                                }
                              });
                              contextText = contextText.replace(uuidPattern, (match) => {
                                const uuid = match.replace('Question ', '');
                                const matchedQuestion = survey.questions.find(q => q.id === uuid);
                                return matchedQuestion ? `"${matchedQuestion.question}"` : match;
                              });
                            }
                            
                            return (
                              <div key={index} className="stat-item">
                                <span className="stat-metric">{metricText}: </span>
                                <span className="stat-value">{stat.value}</span>
                                <p className="stat-context">{contextText}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Areas for Attention Section */}
                      <div className="ai-section">
                        <h4>Areas Needing Attention</h4>
                        <div className="attention-list">
                          {aiAnalysis.structured_analysis.areas_for_attention?.map((area, index) => {
                            const question = survey.questions.find(q => 
                              q.id === parseInt(area.question_id) || 
                              q.id === area.question_id ||
                              q.id.toString() === area.question_id
                            );
                            
                            let issueText = area.issue;
                            
                            const uuidPattern = new RegExp(`Question [a-f0-9-]{36}`, 'g');
                            
                            if (issueText) {
                              survey.questions.forEach(q => {
                                const idStr = `Question ${q.id}`;
                                if (issueText.includes(idStr)) {
                                  issueText = issueText.replace(new RegExp(idStr, 'g'), `"${q.question}"`);
                                }
                              });
                              
                              // Also try to match UUID pattern
                              issueText = issueText.replace(uuidPattern, (match) => {
                                const uuid = match.replace('Question ', '');
                                const matchedQuestion = survey.questions.find(q => q.id === uuid);
                                return matchedQuestion ? `"${matchedQuestion.question}"` : match;
                              });
                            }
                            
                            let questionText = question ? question.question : `Question ${area.question_id}`;
                            // If the question ID is a UUID, try to find a better match
                            if (!question && area.question_id && area.question_id.includes('-')) {
                              const matchedQuestion = survey.questions.find(q => q.id === area.question_id);
                              if (matchedQuestion) {
                                questionText = matchedQuestion.question;
                              }
                            }
                            
                            return (
                              <div key={index} className={`attention-item severity-${area.severity}`}>
                                <h5>{questionText}</h5>
                                <p>{issueText}</p>
                                <span className="severity-badge">{area.severity}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recommendations Section */}
                      <div className="ai-section">
                        <h4>Recommendations</h4>
                        <div className="recommendations-list">
                          {aiAnalysis.structured_analysis.recommendations?.map((rec, index) => (
                            <div key={index} className={`recommendation-item priority-${rec.priority}`}>
                              <h5>{rec.action}</h5>
                              <p>{rec.rationale}</p>
                              <span className="priority-badge">{rec.priority} priority</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RawResponsesModal = ({ survey, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState([]);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  
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
        setResponseData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching responses:', error);
        setLoading(false);
      }
    };

    fetchResponses();
  }, [survey.id]);

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  if (loading) {
    return (
      <div className="insights-modal-overlay">
        <div className="insights-modal loading-modal" onClick={e => e.stopPropagation()}>
          <div className="loading-container">
            <div className="loading-animation"></div>
            <h3 className="loading-text">Loading Responses</h3>
            <p className="loading-subtext">Retrieving survey responses...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Group answers by question
  const answersByQuestion = {};
  responseData.forEach(response => {
    response.answers.forEach(answer => {
      if (!answersByQuestion[answer.question_id]) {
        answersByQuestion[answer.question_id] = [];
      }
      answersByQuestion[answer.question_id].push({
        responseId: response.id,
        answer: answer.answer,
        submittedAt: response.created_at || response.completed_at || new Date().toISOString()
      });
    });
  });

  return (
    <div className="insights-modal-overlay" onClick={onClose}>
      <div className="insights-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{survey.title} - Raw Responses</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          <div className="insights-container-box">
            <div className="response-summary">
              <h3>Response Summary</h3>
              <p>Total Responses: {responseData.length}</p>
            </div>

            <div className="raw-responses-container">
              {survey.questions.map(question => {
                const answers = answersByQuestion[question.id] || [];
                const isExpanded = expandedQuestions[question.id];
                
                return (
                  <div key={question.id} className="question-responses-card">
                    <div 
                      className="question-header" 
                      onClick={() => toggleQuestion(question.id)}
                    >
                      {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                      <h4>{question.question}</h4>
                      <span className="response-count">{answers.length} responses</span>
                    </div>
                    
                    {isExpanded && (
                      <div className="answers-list">
                        {answers.length > 0 ? (
                          answers.map((answer, index) => (
                            <div key={index} className="answer-item">
                              <p className="answer-text">{answer.answer}</p>
                              <span className="answer-date">
                                {answer.submittedAt ? new Date(answer.submittedAt).toLocaleString() : 'No date available'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="no-answers">No responses for this question</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamInsightsModal = ({ team, onClose }) => {
  const [aiLoading, setAiLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      try {
        setAiLoading(true);
        // Fetch recent actions with reasons
        const { data: actions, error: actionsError } = await supabase
          .from('team_member_actions')
          .select('action, reason, created_at')
          .eq('team_id', team.id)
          .order('created_at', { ascending: true });
        if (actionsError) throw actionsError;
        // Fetch member count
        const { count: memberCount, error: mcError } = await supabase
          .from('team_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('team_id', team.id);
        if (mcError) throw mcError;
        // Fetch survey count
        const { count: surveyCount, error: scError } = await supabase
          .from('team_surveys')
          .select('survey_id', { count: 'exact', head: true })
          .eq('team_id', team.id);
        if (scError) throw scError;
        // Generate AI insights
        const { structured_analysis } = await generateTeamInsights(team, actions, memberCount, surveyCount);
        setAnalysis(structured_analysis);
      } catch (err) {
        console.error('Error generating team insights:', err);
        setAnalysis(`Error generating insights: ${err.message}`);
      } finally {
        setAiLoading(false);
      }
    };
    fetchAndAnalyze();
  }, [team]);

  if (aiLoading) {
    return (
      <div className="insights-modal-overlay">
        <div className="insights-modal loading-modal" onClick={e => e.stopPropagation()}>
          <div className="loading-container">
            <div className="loading-animation"></div>
            <h3 className="loading-text">Generating Insights</h3>
            <p className="loading-subtext">Analyzing team data and preparing your insights...</p>
          </div>
        </div>
      </div>
    );
  }

  const actionSummaryItems = analysis?.action_reason_summary
    ? Array.isArray(analysis.action_reason_summary)
      ? analysis.action_reason_summary
      : Object.entries(analysis.action_reason_summary).map(([reason, summary]) => ({ reason, summary }))
    : [];

  return (
    <div className="insights-modal-overlay" onClick={onClose}>
      <div className="insights-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{team.name} - Insights</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-content">
          <div className="insights-container-box">
            <div className="ai-insights">
              {/* Post-Mortem Analysis Section */}
              {analysis.post_mortem && (
                <div className="ai-section">
                  <h4>Project Post-Mortem Analysis</h4>
                  {/* Issues */}
                  <div className="post-mortem-section">
                    <h5>Key Issues Identified</h5>
                    <div className="post-mortem-list">
                      {analysis.post_mortem.issues?.map((issue, idx) => (
                        <div key={idx} className="post-mortem-item">
                          <h6>{issue.title}</h6>
                          <p className="description">{issue.description}</p>
                          <div className="post-mortem-details">
                            <div className="detail-item">
                              <span className="label">Root Cause:</span>
                              <span className="value">{issue.root_cause}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Impact:</span>
                              <span className="value">{issue.impact}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Challenges */}
                  <div className="post-mortem-section">
                    <h5>Challenges Faced</h5>
                    <div className="post-mortem-list">
                      {analysis.post_mortem.challenges?.map((challenge, idx) => (
                        <div key={idx} className="post-mortem-item">
                          <h6>{challenge.area}</h6>
                          <p className="description">{challenge.description}</p>
                          <div className="post-mortem-details">
                            <div className="detail-item">
                              <span className="label">Resolution Attempts:</span>
                              <span className="value">{challenge.resolution_attempts}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Lessons Learned */}
                  <div className="post-mortem-section">
                    <h5>Lessons Learned</h5>
                    <div className="post-mortem-list">
                      {analysis.post_mortem.lessons_learned?.map((lesson, idx) => (
                        <div key={idx} className="post-mortem-item">
                          <h6>{lesson.lesson}</h6>
                          <div className="post-mortem-details">
                            <div className="detail-item">
                              <span className="label">Preventive Measure:</span>
                              <span className="value">{lesson.preventive_measure}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* Key Findings Section */}
              {analysis.key_findings && (
                <div className="ai-section">
                  <h4>Key Findings</h4>
                  <div className="findings-list">
                    {analysis.key_findings.map((f, i) => (
                      <div key={i} className="finding-item">
                        <h5>{f.title}</h5>
                        <p>{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Action Reason Summary Section */}
              {actionSummaryItems.length > 0 && (
                <div className="ai-section">
                  <h4>Action Reason Summary</h4>
                  <div className="patterns-list">
                    {actionSummaryItems.map((item, i) => (
                      <div key={i} className="pattern-item">
                        <h5>{item.reason}</h5>
                        {item.summary && typeof item.summary === 'object' ? (
                          <ul className="summary-list">
                            {Object.entries(item.summary).map(([key, value], idx) => (
                              <li key={idx}>
                                <strong>{key.replace(/_/g, ' ')}</strong>: {value}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>{item.summary || item.details || JSON.stringify(item)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Recommendations Section */}
              {analysis.recommendations && (
                <div className="ai-section">
                  <h4>Recommendations</h4>
                  <div className="recommendations-list">
                    {analysis.recommendations.map((rec, index) => (
                      <div key={index} className={`recommendation-item priority-${rec.priority}`}>
                        <h5>{rec.action}</h5>
                        <p>{rec.rationale}</p>
                        <span className="priority-badge">{rec.priority} priority</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
  const [viewMode, setViewMode] = useState(null); // 'ai' or 'raw'
  const [insightsTab, setInsightsTab] = useState('survey');
  const [teamsData, setTeamsData] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeamInsights, setSelectedTeamInsights] = useState(null);

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

  useEffect(() => {
    if (insightsTab !== 'team' || !user) return;
    const fetchTeamsInsights = async () => {
      setLoadingTeams(true);
      try {
        const { data: memberTeams, error: mtError } = await supabase
          .from('team_members')
          .select(`
            teams!inner (
              id,
              name,
              description
            )
          `)
          .eq('user_id', user.id);
        if (mtError) throw mtError;
        const formatted = memberTeams.map(mt => ({
          id: mt.teams.id,
          name: mt.teams.name,
          description: mt.teams.description
        }));
        setTeamsData(formatted);
      } catch (err) {
        console.error('Error fetching teams:', err);
      }
      setLoadingTeams(false);
    };
    fetchTeamsInsights();
  }, [insightsTab, user]);

  const openModal = (survey, mode) => {
    setSelectedSurvey(survey);
    setViewMode(mode);
  };

  const closeModal = () => {
    setSelectedSurvey(null);
    setViewMode(null);
  };

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
      <div className="insights-tabs">
        <button className={`tab-btn ${insightsTab==='survey'?'active':''}`} onClick={()=>setInsightsTab('survey')}>Survey Insights</button>
        <button className={`tab-btn ${insightsTab==='team'?'active':''}`} onClick={()=>setInsightsTab('team')}>Team Insights</button>
      </div>
      <h1>{insightsTab==='survey'?'Survey Insights':'Team Insights'}</h1>
      {surveys.length === 0 ? (
        <div className="no-surveys">
          <p>No completed surveys found. Complete a survey to see insights.</p>
        </div>
      ) : (
        insightsTab === 'survey' ? (
          <div className="surveys-grid">
            {surveys.map(survey => (
              <div key={survey.id} className="survey-card">
                <div className="card-icon">
                  <FaChartBar />
                </div>
                <h3>{survey.title}</h3>
                <p>{survey.description || 'No description provided'}</p>
                <div className="survey-card-buttons">
                  <button 
                    className="view-insights-btn ai-insights-btn"
                    onClick={() => openModal(survey, 'ai')}
                  >
                    <FaRobot className="btn-icon" /> View AI Insights
                  </button>
                  <button 
                    className="view-insights-btn raw-data-btn"
                    onClick={() => openModal(survey, 'raw')}
                  >
                    <FaDatabase className="btn-icon" /> View Raw Responses
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="teams-grid">
            {loadingTeams ? (
              <div>Loading teams...</div>
            ) : (
              teamsData.map(team => (
                <div key={team.id} className="survey-card">
                  <div className="card-icon"><FaUsers /></div>
                  <h3>{team.name}</h3>
                  <p>{team.description || 'No description provided'}</p>
                  <div className="survey-card-buttons">
                    <button className="view-insights-btn ai-insights-btn" onClick={()=>setSelectedTeamInsights(team)}>
                      <FaRobot className="btn-icon" /> View AI Insights
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      )}

      {selectedSurvey && viewMode === 'ai' && (
        <InsightsModal 
          survey={selectedSurvey} 
          onClose={closeModal} 
        />
      )}
      
      {selectedSurvey && viewMode === 'raw' && (
        <RawResponsesModal 
          survey={selectedSurvey} 
          onClose={closeModal} 
        />
      )}

      {selectedTeamInsights && (
        <TeamInsightsModal team={selectedTeamInsights} onClose={()=>setSelectedTeamInsights(null)} />
      )}
    </div>
  );
};

export default Insights;