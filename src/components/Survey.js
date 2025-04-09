import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaClock, FaTrash, FaEdit, FaShare, FaRobot, FaLightbulb, FaLink, FaCopy } from 'react-icons/fa';
import './Survey.css';
import './AiSuggestions.css';

// Question type enum values
const QUESTION_TYPES = {
  TEXT: 'short_text',
  LONG_TEXT: 'long_text',
  MULTIPLE_CHOICE: 'multiple_choice',
  CHECKBOX: 'checkbox',
  DROPDOWN: 'dropdown',
  RATING: 'rating'
};

// Survey status options
const SURVEY_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

const Survey = () => {
  const { user } = useAuth(); // Get the current user
  const [surveys, setSurveys] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    questions: []
  });
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewingSurvey, setViewingSurvey] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAiInput, setShowAiInput] = useState(null); // Changed to null to track which question is being edited

  // Fetch surveys from Supabase
  useEffect(() => {
    if (user) { // Only fetch if we have a user
      fetchSurveys();
    }
  }, [user]); // Re-fetch when user changes

  const fetchSurveys = async () => {
    try {
      console.log('Fetching surveys for user:', user.id);
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          questions:questions(
            id,
            question,
            type,
            choices,
            question_order
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched surveys:', data);
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
      console.log('Creating survey with data:', {
        title: newSurvey.title,
        description: newSurvey.description,
        is_public: true,
        status: 'draft',
        creator_id: user.id
      });
      
      // Insert survey with creator_id
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .insert([{
          title: newSurvey.title,
          description: newSurvey.description,
          is_public: true,
          status: 'draft',
          creator_id: user.id // Add creator_id
        }])
        .select()
        .single();

      if (surveyError) {
        console.error('Survey creation error:', surveyError);
        alert(`Failed to create survey: ${surveyError.message}`);
        return;
      }

      console.log('Created survey:', surveyData);

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
            question_order: index,
          };
        });

        console.log('Inserting questions:', questionsToInsert);

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
      
      // Add a small delay before fetching to ensure database consistency
      setTimeout(() => {
        console.log('Refreshing surveys list...');
        fetchSurveys();
      }, 500);
      
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
      // First verify the user owns this survey
      const { data: surveyData, error: fetchError } = await supabase
        .from('surveys')
        .select('creator_id')
        .eq('id', editingSurvey.id)
        .single();

      if (fetchError) throw fetchError;
      if (surveyData.creator_id !== user.id) {
        throw new Error('You do not have permission to edit this survey');
      }

      // Update survey
      const { error: surveyError } = await supabase
        .from('surveys')
        .update({
          title: editingSurvey.title,
          description: editingSurvey.description,
        })
        .eq('id', editingSurvey.id)
        .eq('creator_id', user.id); // Additional check to ensure ownership

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
            question_order: index,
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
      setShowCreateForm(false); // Add this line to hide the form after updating
      fetchSurveys(); // Refresh the surveys list
    } catch (error) {
      console.error('Error updating survey:', error);
      alert(`Failed to update survey: ${error.message}`);
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (window.confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      try {
        // First verify the user owns this survey
        const { data: surveyData, error: fetchError } = await supabase
          .from('surveys')
          .select('creator_id')
          .eq('id', surveyId)
          .single();

        if (fetchError) throw fetchError;
        if (surveyData.creator_id !== user.id) {
          throw new Error('You do not have permission to delete this survey');
        }

        // Delete survey (cascade will handle related records)
        const { error } = await supabase
          .from('surveys')
          .delete()
          .eq('id', surveyId)
          .eq('creator_id', user.id); // Additional check to ensure ownership

        if (error) throw error;
        fetchSurveys(); // Refresh the surveys list
      } catch (error) {
        console.error('Error deleting survey:', error);
        alert('Failed to delete survey: ' + error.message);
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

    // Get the current question index from the showAiInput state
    const index = showAiInput;
    
    setLoading(true);
    try {
      // Get the current question
      const currentQuestion = editingSurvey.questions[index];
      
      // Prepare the request payload
      const payload = {
        question: currentQuestion.text,
        promptText: aiQuery,
        questionType: currentQuestion.type || 'text',
        choices: currentQuestion.options || []
      };
      
      console.log('Sending AI suggestion request:', payload);
      
      // Call our backend API
      const response = await fetch('http://127.0.0.1:5001/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('AI suggestion response:', data);
      
      // Format the suggestions with questionIndex for the UI
      const formattedSuggestions = data.suggestions.map(suggestion => ({
        ...suggestion,
        questionIndex: index
      }));
      
      setAiSuggestions({
        suggestions: formattedSuggestions,
        questionIndex: index // Add questionIndex to track which question the suggestions are for
      });
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      alert('Failed to get AI suggestions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion) => {
    if (!editingSurvey) return;

    const updatedQuestions = [...editingSurvey.questions];
    
    // Handle question improvement
    if (suggestion.type === 'question_improvement') {
      const questionIndex = suggestion.questionIndex;
      
      // Create a copy of the current question
      const updatedQuestion = { ...updatedQuestions[questionIndex] };
      
      // Update the question text
      updatedQuestion.text = suggestion.text;
      
      // If the suggestion includes choices and the question is a type that uses choices
      if (suggestion.choices && ['multiple_choice', 'checkbox', 'dropdown'].includes(updatedQuestion.type)) {
        updatedQuestion.options = suggestion.choices;
      }
      
      // Update the question in the questions array
      updatedQuestions[questionIndex] = updatedQuestion;
      
      // Update the editing survey state
      setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
      
      // Clear suggestions after applying
      setAiSuggestions(null);
    }
  };

  const handleStatusChange = async (surveyId, newStatus) => {
    try {
      // First verify the user owns this survey
      const { data: surveyData, error: fetchError } = await supabase
        .from('surveys')
        .select('creator_id')
        .eq('id', surveyId)
        .single();

      if (fetchError) throw fetchError;
      if (surveyData.creator_id !== user.id) {
        throw new Error('You do not have permission to update this survey');
      }

      const { error } = await supabase
        .from('surveys')
        .update({ status: newStatus })
        .eq('id', surveyId)
        .eq('creator_id', user.id); // Additional check to ensure ownership

      if (error) throw error;
      
      // Update local state
      const updatedSurveys = surveys.map(survey => 
        survey.id === surveyId ? { ...survey, status: newStatus } : survey
      );
      setSurveys(updatedSurveys);
      
      // Update the viewing survey if it's the one being modified
      if (viewingSurvey && viewingSurvey.id === surveyId) {
        setViewingSurvey({ ...viewingSurvey, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating survey status:', error);
      alert('Failed to update survey status: ' + error.message);
    }
  };

  const prepareQuestionsForEdit = (questions) => {
    return questions.map(q => ({
      text: q.question,
      type: q.type,
      options: q.choices || [],
      question_order: q.question_order
    }));
  };

  const handleEdit = (survey) => {
    setEditingSurvey({
      ...survey,
      questions: prepareQuestionsForEdit(survey.questions)
    });
    setShowCreateForm(true);
  };

  const ViewSurveyModal = ({ survey, onClose }) => {
    if (!survey) return null;

    // Get a safe status value
    const surveyStatus = survey.status || 'draft';

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
                <select 
                  className={`status ${surveyStatus.toLowerCase()}`}
                  value={surveyStatus}
                  onChange={(e) => handleStatusChange(survey.id, e.target.value)}
                >
                  <option value={SURVEY_STATUS.DRAFT}>Draft</option>
                  <option value={SURVEY_STATUS.ACTIVE}>Active</option>
                  <option value={SURVEY_STATUS.COMPLETED}>Completed</option>
                </select>
                <span className="respondents">
                  <FaUsers /> {survey.respondents || 0} respondents
                </span>
                <span className="date">
                  <FaClock className="icon" /> {survey.created_at ? new Date(survey.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="survey-questions">
              <h3>Questions</h3>
              {survey.questions && survey.questions.map((question, index) => (
                <div key={index} className="survey-question">
                  <div className="question-number">Q{index + 1}</div>
                  <div className="question-content">
                    <p className="question-text">{question.question}</p>
                    {question.required && <span className="required-badge">Required</span>}
                    
                    {/* Display options based on question type */}
                    {(question.type === 'multiple_choice' || question.type === 'checkbox' || question.type === 'dropdown') && question.choices && (
                      <div className="question-options">
                        {question.choices.map((option, optionIndex) => (
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
              <button className="share-btn" onClick={() => setShowShareModal(true)}>
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
                      value={`${process.env.NODE_ENV === 'development' 
                        ? 'http://localhost:3000' 
                        : window.location.origin}/survey/${survey.id}`}
                      readOnly
                    />
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${process.env.NODE_ENV === 'development' 
                        ? 'http://localhost:3000' 
                        : window.location.origin}/survey/${survey.id}`);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}>
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
          {showAiInput !== index ? (
            <button 
              className="ai-help-btn"
              onClick={() => setShowAiInput(index)}
            >
              <FaRobot /> Get AI Help
            </button>
          ) : (
            <div className="ai-suggestions">
              <form onSubmit={handleAiQuery} className="ai-query-form">
                <div className="query-input-wrapper">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ask AI to help improve this question..."
                    className="query-input"
                    autoFocus
                  />
                </div>
                <div className="buttons-row">
                  <button 
                    type="submit" 
                    className="query-submit"
                    disabled={loading || !aiQuery.trim()}
                  >
                    {loading ? 'Analyzing...' : 'Get Suggestions'}
                    {loading && <span className="loading-spinner"></span>}
                  </button>
                  <button 
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowAiInput(null);
                      setAiQuery('');
                      setAiSuggestions(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {aiSuggestions && aiSuggestions.questionIndex === index && (
                <div className="suggestions-display">
                  <h4>
                    <FaLightbulb style={{ color: '#fbbc05' }} />
                    AI Suggestions
                  </h4>
                  <div className="suggestions-list">
                    {aiSuggestions.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="suggestion-item">
                        <FaLightbulb className="suggestion-icon" />
                        <div className="suggestion-content">
                          <p>{suggestion.text}</p>
                          {suggestion.choices && suggestion.choices.length > 0 && (
                            <ul className="suggestion-choices">
                              {suggestion.choices.map((choice, choiceIdx) => (
                                <li key={choiceIdx}>{choice}</li>
                              ))}
                            </ul>
                          )}
                          <button 
                            className="apply-suggestion-btn"
                            onClick={() => {
                              applySuggestion(suggestion);
                              setShowAiInput(null);
                              setAiSuggestions(null);
                              setAiQuery('');
                            }}
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
                    onClick={() => handleEdit(survey)}
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