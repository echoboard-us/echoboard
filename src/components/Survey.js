import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { FaUsers, FaClock, FaTrash, FaEdit, FaShare, FaRobot, FaLightbulb, FaChartBar, FaChevronDown, FaChevronUp, FaLink, FaCopy } from 'react-icons/fa';
import './Survey.css';

// Question type enum values
const QUESTION_TYPES = {
  TEXT: 'short_text',
  LONG_TEXT: 'long_text',
  MULTIPLE_CHOICE: 'multiple_choice',
  CHECKBOX: 'checkbox',
  DROPDOWN: 'dropdown',
  RATING: 'rating'
};

const Survey = () => {
  const [surveys, setSurveys] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    questions: []
  });
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  const [selectedSurveyInsights, setSelectedSurveyInsights] = useState(null);
  const [showRawResponses, setShowRawResponses] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [viewingSurvey, setViewingSurvey] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch surveys from Supabase
  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          questions (
            *
          ),
          survey_insights (
            *
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  };

  const handleCreateSurvey = async () => {
    if (!newSurvey.title.trim()) {
      alert('Please enter a survey title');
      return;
    }

    try {
      // Insert survey without creator_id
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .insert([{
          title: newSurvey.title,
          description: newSurvey.description,
          is_public: true,
          status: 'draft' // Add default status
        }])
        .select()
        .single();

      if (surveyError) {
        console.error('Survey creation error:', surveyError);
        alert(`Failed to create survey: ${surveyError.message}`);
        return;
      }

      // Insert questions
      if (newSurvey.questions.length > 0) {
        const questionsToInsert = newSurvey.questions.map((q, index) => {
          // Ensure options is always an array
          const choices = Array.isArray(q.options) ? q.options.filter(opt => opt !== '') : [];
          
          return {
            survey_id: surveyData.id,
            question: q.text,
            type: q.type,
            choices: choices.length > 0 ? choices : null,
            order: index,
          };
        });

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) {
          console.error('Questions creation error:', questionsError);
          alert(`Failed to create questions: ${questionsError.message}`);
          return;
        }
      }

      setNewSurvey({ title: '', description: '', questions: [] });
      setShowCreateForm(false);
      fetchSurveys(); // Refresh the surveys list
    } catch (error) {
      console.error('Error creating survey:', error);
      alert(`Failed to create survey: ${error.message}`);
    }
  };

  const handleUpdateSurvey = async () => {
    if (!editingSurvey.title.trim()) {
      alert('Please enter a survey title');
      return;
    }

    try {
      // Update survey without creator_id
      const { error: surveyError } = await supabase
        .from('surveys')
        .update({
          title: editingSurvey.title,
          description: editingSurvey.description,
        })
        .eq('id', editingSurvey.id);

      if (surveyError) {
        console.error('Survey update error:', surveyError);
        alert(`Failed to update survey: ${surveyError.message}`);
        return;
      }

      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('survey_id', editingSurvey.id);

      if (deleteError) {
        console.error('Questions deletion error:', deleteError);
        alert(`Failed to update questions: ${deleteError.message}`);
        return;
      }

      // Insert updated questions
      if (editingSurvey.questions.length > 0) {
        const questionsToInsert = editingSurvey.questions.map((q, index) => {
          // Ensure options is always an array
          const choices = Array.isArray(q.options) ? q.options.filter(opt => opt !== '') : [];
          
          return {
            survey_id: editingSurvey.id,
            question: q.text,
            type: q.type,
            choices: choices.length > 0 ? choices : null,
            order: index,
          };
        });

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) {
          console.error('Questions creation error:', questionsError);
          alert(`Failed to update questions: ${questionsError.message}`);
          return;
        }
      }

      setEditingSurvey(null);
      fetchSurveys(); // Refresh the surveys list
    } catch (error) {
      console.error('Error updating survey:', error);
      alert(`Failed to update survey: ${error.message}`);
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (window.confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      try {
        // Delete survey (cascade will handle related records)
        const { error } = await supabase
          .from('surveys')
          .delete()
          .eq('id', surveyId);

        if (error) throw error;
        fetchSurveys(); // Refresh the surveys list
      } catch (error) {
        console.error('Error deleting survey:', error);
        alert('Failed to delete survey. Please try again.');
      }
    }
  };

  const addQuestion = (survey = newSurvey) => {
    const updatedQuestions = [...survey.questions, { 
      text: '', 
      type: QUESTION_TYPES.TEXT,
      options: [],
      required: false
    }];
    if (editingSurvey) {
      setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
    } else {
      setNewSurvey({ ...survey, questions: updatedQuestions });
    }
  };

  const updateQuestion = (index, field, value, survey = newSurvey) => {
    const updatedQuestions = [...survey.questions];
    // If updating the type field, ensure we use a valid enum value
    if (field === 'type') {
      value = QUESTION_TYPES[value.toUpperCase()] || QUESTION_TYPES.TEXT;
    }
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    if (editingSurvey) {
      setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
    } else {
      setNewSurvey({ ...survey, questions: updatedQuestions });
    }
  };

  const addOption = (questionIndex, survey = newSurvey) => {
    const updatedQuestions = [...survey.questions];
    updatedQuestions[questionIndex].options = [
      ...(updatedQuestions[questionIndex].options || []),
      ''
    ];
    if (editingSurvey) {
      setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
    } else {
      setNewSurvey({ ...survey, questions: updatedQuestions });
    }
  };

  const updateOption = (questionIndex, optionIndex, value, survey = newSurvey) => {
    const updatedQuestions = [...survey.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    if (editingSurvey) {
      setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
    } else {
      setNewSurvey({ ...survey, questions: updatedQuestions });
    }
  };

  const removeOption = (questionIndex, optionIndex, survey = newSurvey) => {
    const updatedQuestions = [...survey.questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    if (editingSurvey) {
      setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
    } else {
      setNewSurvey({ ...survey, questions: updatedQuestions });
    }
  };

  const handleAiQuery = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim() || !editingSurvey) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockResponse = {
        suggestions: [
          {
            type: 'question_improvement',
            text: 'Consider adding a rating scale to measure satisfaction levels',
            questionIndex: selectedQuestionIndex
          },
          {
            type: 'question_addition',
            text: 'Add a follow-up question about specific pain points',
            questionIndex: selectedQuestionIndex
          },
          {
            type: 'question_clarification',
            text: 'Make the question more specific to get better responses',
            questionIndex: selectedQuestionIndex
          }
        ],
        recommendations: [
          'Add demographic questions to better segment responses',
          'Include a mix of quantitative and qualitative questions',
          'Consider adding a progress indicator for long surveys'
        ]
      };

      setAiSuggestions(mockResponse);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion) => {
    if (!editingSurvey) return;

    const updatedQuestions = [...editingSurvey.questions];
    
    switch (suggestion.type) {
      case 'question_improvement':
        // Update existing question
        updatedQuestions[suggestion.questionIndex] = {
          ...updatedQuestions[suggestion.questionIndex],
          text: suggestion.text
        };
        break;
      case 'question_addition':
        // Add new question after the selected one
        updatedQuestions.splice(suggestion.questionIndex + 1, 0, {
          text: suggestion.text,
          type: 'text',
          options: [],
          required: false
        });
        break;
      case 'question_clarification':
        // Update question text with clarification
        updatedQuestions[suggestion.questionIndex] = {
          ...updatedQuestions[suggestion.questionIndex],
          text: suggestion.text
        };
        break;
    }

    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
    setAiSuggestions(null);
  };

  const handleShowInsights = async (survey) => {
    setSelectedSurveyInsights(survey);
    setInsightsLoading(true);
    try {
      // TODO: Replace with actual API call
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock insights data
      const mockInsights = {
        summary: "Based on 50 responses, the overall sentiment is positive with 75% satisfaction rate.",
        keyFindings: [
          "Most respondents (80%) rated the service above 4 stars",
          "Common feedback themes: ease of use, quick response times",
          "Areas for improvement: mobile experience, documentation"
        ],
        sentimentAnalysis: {
          positive: 75,
          neutral: 15,
          negative: 10
        },
        trends: [
          "Increasing satisfaction over the past 3 months",
          "Higher engagement from enterprise users",
          "Growing demand for mobile features"
        ],
        recommendations: [
          "Consider prioritizing mobile app development",
          "Expand documentation with more examples",
          "Add more enterprise-focused features"
        ],
        rawResponses: [
          { question: "How satisfied are you?", response: "Very satisfied", respondent: "User 1" },
          { question: "What features do you use most?", response: "Dashboard and analytics", respondent: "User 2" },
          { question: "Areas for improvement?", response: "Mobile app needed", respondent: "User 3" }
        ]
      };
      
      setSelectedSurveyInsights({ ...survey, insights: mockInsights });
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const InsightsModal = ({ survey, onClose }) => {
    if (!survey || !survey.insights) return null;
    
    return (
      <div className="modal-overlay">
        <div className="insights-modal">
          <div className="modal-header">
            <h2>{survey.title} - Insights</h2>
            <button className="close-modal-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-content">
            <div className="insights-summary">
              <h3>Summary</h3>
              <p>{survey.insights.summary}</p>
            </div>

            <div className="insights-section">
              <h3>Key Findings</h3>
              <ul>
                {survey.insights.keyFindings.map((finding, index) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            </div>

            <div className="insights-section">
              <h3>Sentiment Analysis</h3>
              <div className="sentiment-bars">
                {Object.entries(survey.insights.sentimentAnalysis).map(([type, value]) => (
                  <div key={type} className="sentiment-bar">
                    <span className="sentiment-label">{type}</span>
                    <div className="sentiment-bar-container">
                      <div 
                        className={`sentiment-bar-fill ${type}`}
                        style={{ width: `${value}%` }}
                      >
                        {value}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="insights-section">
              <h3>Trends</h3>
              <ul>
                {survey.insights.trends.map((trend, index) => (
                  <li key={index}>{trend}</li>
                ))}
              </ul>
            </div>

            <div className="insights-section">
              <h3>Recommendations</h3>
              <ul>
                {survey.insights.recommendations.map((rec, index) => (
                  <li key={index}>
                    <FaLightbulb className="recommendation-icon" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <div className="insights-section raw-responses">
              <div 
                className="raw-responses-header"
                onClick={() => setShowRawResponses(!showRawResponses)}
              >
                <h3>Raw Responses</h3>
                {showRawResponses ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              
              {showRawResponses && (
                <div className="responses-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Response</th>
                        <th>Respondent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {survey.insights.rawResponses.map((response, index) => (
                        <tr key={index}>
                          <td>{response.question}</td>
                          <td>{response.response}</td>
                          <td>{response.respondent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ViewSurveyModal = ({ survey, onClose }) => {
    if (!survey) return null;

    // Get a safe status value
    const surveyStatus = survey.status || 'draft';

    const handleShare = async () => {
      try {
        // Create a share link
        const { data: shareLink, error } = await supabase
          .from('survey_share_links')
          .insert([{
            survey_id: survey.id,
            token: crypto.randomUUID(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days expiry
          }])
          .select()
          .single();

        if (error) {
          console.error('Share link creation error:', error);
          alert(`Failed to create share link: ${error.message}`);
          return;
        }

        // Update UI with share link
        setShowShareModal(true);
        const surveyLink = `${window.location.origin}/survey/${shareLink.token}`;
        // Store the link in state or use it in your UI
      } catch (error) {
        console.error('Error creating share link:', error);
        alert(`Failed to create share link: ${error.message}`);
      }
    };

    const handleCopyLink = async () => {
      // Generate a unique survey link (in production, this would be a proper URL)
      const surveyLink = `${window.location.origin}/survey/${survey.id}`;
      try {
        await navigator.clipboard.writeText(surveyLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    };

    return (
      <div className="modal-overlay">
        <div className="view-survey-modal">
          <div className="modal-header">
            <h2>{survey.title}</h2>
            <button className="close-modal-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-content">
            <div className="survey-info">
              <p className="survey-description">{survey.description}</p>
              <div className="survey-meta">
                <span className={`status ${surveyStatus.toLowerCase()}`}>
                  {surveyStatus}
                </span>
                <span className="respondents">
                  <FaUsers /> {survey.respondents || 0} respondents
                </span>
                <span className="date">
                  <FaClock /> {survey.created_at ? new Date(survey.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="survey-questions">
              <h3>Questions</h3>
              {survey.questions.map((question, index) => (
                <div key={index} className="survey-question">
                  <div className="question-number">Q{index + 1}</div>
                  <div className="question-content">
                    <p className="question-text">{question.text}</p>
                    {question.required && <span className="required-badge">Required</span>}
                    {(question.type === 'multiple-choice' || question.type === 'checkbox' || question.type === 'dropdown') && (
                      <div className="question-options">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="option">
                            {question.type === 'checkbox' ? '☐' : '○'} {option}
                          </div>
                        ))}
                      </div>
                    )}
                    {question.type === 'rating' && (
                      <div className="rating-preview">
                        {[1, 2, 3, 4, 5].map(num => (
                          <span key={num} className="rating-star">★</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="survey-actions">
              <button className="share-btn" onClick={handleShare}>
                <FaShare /> Share Survey
              </button>
            </div>

            {showShareModal && (
              <div className="share-modal">
                <div className="share-content">
                  <h3>Share Survey</h3>
                  <div className="share-link">
                    <FaLink />
                    <input 
                      type="text" 
                      value={`${window.location.origin}/survey/${survey.id}`}
                      readOnly
                    />
                    <button onClick={handleCopyLink}>
                      {copySuccess ? 'Copied!' : <FaCopy />}
                    </button>
                  </div>
                  <button className="close-share-btn" onClick={() => setShowShareModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionForm = (question, index, survey = newSurvey) => (
    <div key={index} className="question-item">
    <div className="question-header">
      {/* Question text input wrapped in a container to pick up .question-text styles */}
      <div className="question-text">
        <input
          type="text"
          placeholder="Question text"
          value={question.text}
          onChange={(e) => updateQuestion(index, 'text', e.target.value, survey)}
        />
      </div>
      
      {/* Dropdown with modern styling via .question-type-select */}
      <select
        className="question-type-select"
        value={question.type}
        onChange={(e) => updateQuestion(index, 'type', e.target.value, survey)}
      >
        <option value={QUESTION_TYPES.TEXT}>Short Text</option>
        <option value={QUESTION_TYPES.LONG_TEXT}>Long Text</option>
        <option value={QUESTION_TYPES.MULTIPLE_CHOICE}>Multiple Choice</option>
        <option value={QUESTION_TYPES.CHECKBOX}>Checkbox</option>
        <option value={QUESTION_TYPES.DROPDOWN}>Dropdown</option>
        <option value={QUESTION_TYPES.RATING}>Rating</option>
      </select>

      {/* Required checkbox */}
      <label className="required-toggle">
        <input
          type="checkbox"
          checked={question.required}
          onChange={(e) => updateQuestion(index, 'required', e.target.checked, survey)}
        />
        Required
      </label>

      {/* Trash icon button */}
      <button 
        className="remove-question-btn"
        onClick={() => {
          const updatedQuestions = survey.questions.filter((_, i) => i !== index);
          if (editingSurvey) {
            setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
          } else {
            setNewSurvey({ ...survey, questions: updatedQuestions });
          }
        }}
      >
        <FaTrash />
      </button>
    </div>

      {(question.type === 'multiple-choice' || question.type === 'checkbox' || question.type === 'dropdown') && (
        <div className="options-section">
          <h4>Options</h4>
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="option-item">
              <input
                type="text"
                placeholder={`Option ${optionIndex + 1}`}
                value={option}
                onChange={(e) => updateOption(index, optionIndex, e.target.value, survey)}
              />
              <button 
                className="remove-option-btn"
                onClick={() => removeOption(index, optionIndex, survey)}
              >
                <FaTrash />
              </button>
            </div>
          ))}
          <button 
            className="add-option-btn"
            onClick={() => addOption(index, survey)}
          >
            Add Option
          </button>
        </div>
      )}

      {editingSurvey && (
        <div className="ai-assistance-section">
          <button 
            className="ai-help-btn"
            onClick={() => setSelectedQuestionIndex(index)}
          >
            <FaRobot /> Get AI Help
          </button>
          
          {selectedQuestionIndex === index && (
            <div className="ai-suggestions">
              <form onSubmit={handleAiQuery} className="ai-query-form">
                <div className="query-input-wrapper">
                  <FaRobot className="ai-icon" />
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ask AI to help improve this question..."
                    className="query-input"
                  />
                </div>
                <button 
                  type="submit" 
                  className="query-submit"
                  disabled={loading || !aiQuery.trim()}
                >
                  {loading ? 'Analyzing...' : 'Get Suggestions'}
                </button>
              </form>

              {aiSuggestions && (
                <div className="suggestions-display">
                  <h4>AI Suggestions</h4>
                  <div className="suggestions-list">
                    {aiSuggestions.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="suggestion-item">
                        <FaLightbulb className="suggestion-icon" />
                        <div className="suggestion-content">
                          <p>{suggestion.text}</p>
                          <button 
                            className="apply-suggestion-btn"
                            onClick={() => applySuggestion(suggestion)}
                          >
                            Apply Suggestion
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="survey-container">
      <div className="survey-header">
        <h1>Surveys</h1>
        <button 
          className="create-survey-btn"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Survey
        </button>
      </div>

      {(showCreateForm || editingSurvey) && (
        <div className="create-survey-form">
          <h2>{editingSurvey ? 'Edit Survey' : 'Create New Survey'}</h2>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={editingSurvey ? editingSurvey.title : newSurvey.title}
              onChange={(e) => editingSurvey 
                ? setEditingSurvey({ ...editingSurvey, title: e.target.value })
                : setNewSurvey({ ...newSurvey, title: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={editingSurvey ? editingSurvey.description : newSurvey.description}
              onChange={(e) => editingSurvey
                ? setEditingSurvey({ ...editingSurvey, description: e.target.value })
                : setNewSurvey({ ...newSurvey, description: e.target.value })
              }
            />
          </div>
          
          <div className="questions-section">
            <h3>Questions</h3>
            {(editingSurvey ? editingSurvey.questions : newSurvey.questions).map((question, index) => 
              renderQuestionForm(question, index, editingSurvey || newSurvey)
            )}
            <button 
              className="add-question-btn" 
              onClick={() => addQuestion(editingSurvey || newSurvey)}
            >
              Add Question
            </button>
          </div>

          <div className="form-actions">
            <button 
              className="save-survey-btn" 
              onClick={editingSurvey ? handleUpdateSurvey : handleCreateSurvey}
            >
              {editingSurvey ? 'Update Survey' : 'Save Survey'}
            </button>
            <button 
              className="cancel-btn"
              onClick={() => {
                setEditingSurvey(null);
                setShowCreateForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="surveys-list">
        <h2>Your Surveys</h2>
        {surveys.length === 0 ? (
          <p className="no-surveys">No surveys created yet. Create one to get started!</p>
        ) : (
          <div className="surveys-grid">
            {surveys.map((survey) => (
              <div key={survey.id} className="survey-card">
                <div className="survey-card-header">
                  <span className={`status ${(survey.status || 'draft').toLowerCase()}`}>
                    {survey.status || 'draft'}
                  </span>
                  <span className="date">
                    <FaClock className="icon" /> {survey.created_at ? new Date(survey.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <h3>{survey.title}</h3>
                <p>{survey.description}</p>
                <div className="survey-stats">
                  <span><FaUsers className="icon" /> {survey.respondents || 0} respondents</span>
                  <span>{survey.questions ? survey.questions.length : 0} questions</span>
                </div>
                <div className="survey-actions">
                  <button 
                    className="edit-survey-btn"
                    onClick={() => setEditingSurvey(survey)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="view-survey-btn"
                    onClick={() => setViewingSurvey(survey)}
                  >
                    <FaShare /> View & Share
                  </button>
                  <button 
                    className="insights-btn"
                    onClick={() => handleShowInsights(survey)}
                  >
                    <FaChartBar /> Insights
                  </button>
                  <button 
                    className="delete-survey-btn"
                    onClick={() => handleDeleteSurvey(survey.id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSurveyInsights && (
        <InsightsModal 
          survey={selectedSurveyInsights} 
          onClose={() => setSelectedSurveyInsights(null)} 
        />
      )}

      {viewingSurvey && (
        <ViewSurveyModal
          survey={viewingSurvey}
          onClose={() => {
            setViewingSurvey(null);
            setShowShareModal(false);
            setCopySuccess(false);
          }}
        />
      )}
    </div>
  );
};

export default Survey; 