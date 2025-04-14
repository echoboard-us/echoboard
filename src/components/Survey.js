import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaClock, FaTrash, FaEdit, FaShare, FaRobot, FaLightbulb, FaLink, FaCopy, FaClone } from 'react-icons/fa';
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
  const [loading, setLoading] = useState(false);
  const [setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [viewingSurvey, setViewingSurvey] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    questions: []
  });
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [shareTokenExpiry, setShareTokenExpiry] = useState(null);
  const [shareTokenLoading, setShareTokenLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(null); // Changed to null to track which question is being edited
  
  // New state variables for templates
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null);

  // Helper function to parse rating scale from question text
  const getRatingScale = (questionText) => {
    // Match patterns like "1-10", "0-5", etc.
    const match = questionText.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.max(1, max - min + 1); // Ensure at least 1 star
    }
    return 5; // Default to 5 stars if no scale found
  };

  // Fetch surveys from Supabase
  const fetchSurveys = useCallback(async () => {
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
  }, [user]);

  // Fetch survey templates
  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('survey_templates')
        .select('id, title, description, type');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching survey templates:', error);
    }
  }, []);

  // Fetch a single template with questions
  const fetchTemplateDetails = useCallback(async (templateId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('survey_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      
      // Parse JSONB questions if needed
      if (data.questions && typeof data.questions === 'string') {
        data.questions = JSON.parse(data.questions);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching template details:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when component mounts
  useEffect(() => {
    if (user) { // Only fetch if we have a user
      fetchSurveys();
      fetchTemplates(); // Fetch templates when component mounts
    }
  }, [user, fetchSurveys, fetchTemplates]); // Re-fetch when user changes

  // Handle template selection
  const handleTemplateSelect = useCallback(async (templateId) => {
    try {
      const template = await fetchTemplateDetails(templateId);
      if (!template) return;

      // Convert template questions to survey format
      const questions = template.questions.map(q => ({
        text: q.question,
        type: q.type,
        options: q.choices || [],
        required: false
      }));

      setNewSurvey({
        title: template.title,
        description: template.description,
        questions: questions,
        template_id: template.id,
        type: template.type
      });

      setShowTemplateModal(false);
      setShowCreateForm(true);
    } catch (error) {
      console.error('Error selecting template:', error);
    }
  }, [fetchTemplateDetails]);

  // View template details
  const handleViewTemplate = useCallback(async (templateId) => {
    try {
      const template = await fetchTemplateDetails(templateId);
      if (template) {
        setViewingTemplate(template);
      }
    } catch (error) {
      console.error('Error viewing template:', error);
    }
  }, [fetchTemplateDetails]);

  const handleCreateSurvey = useCallback(async () => {
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
        creator_id: user.id,
        template_id: newSurvey.template_id || null
      });
      
      // Insert survey with creator_id and template_id if available
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .insert([{
          title: newSurvey.title,
          description: newSurvey.description,
          is_public: true,
          status: 'draft',
          creator_id: user.id,
          template_id: newSurvey.template_id || null // Add template_id if available
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
  }, [newSurvey, user, fetchSurveys]);

  const handleUpdateSurvey = useCallback(async () => {
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
  }, [editingSurvey, user, fetchSurveys]);

  const handleDeleteClick = useCallback((survey) => {
    setSelectedSurvey(survey);
    setShowDeleteConfirmModal(true);
  }, []);

  const handleDeleteSurvey = useCallback(async () => {
    if (!selectedSurvey) return;

    try {
      setLoading(true);
      // First verify the user owns this survey
      const { data: surveyData, error: fetchError } = await supabase
        .from('surveys')
        .select('creator_id')
        .eq('id', selectedSurvey.id)
        .single();

      if (fetchError) throw fetchError;
      if (surveyData.creator_id !== user.id) {
        throw new Error('You do not have permission to delete this survey');
      }

      // Delete survey (cascade will handle related records)
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', selectedSurvey.id)
        .eq('creator_id', user.id); // Additional check to ensure ownership

      if (error) throw error;
      fetchSurveys(); // Refresh the surveys list
      setShowDeleteConfirmModal(false);
      setSelectedSurvey(null);
    } catch (error) {
      console.error('Error deleting survey:', error);
      setError('Failed to delete survey: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSurvey, user, fetchSurveys, setError]);

  const addQuestion = useCallback((survey = newSurvey) => {
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
  }, [editingSurvey, newSurvey]);

  const updateQuestion = useCallback((index, field, value, survey = newSurvey) => {
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
  }, [editingSurvey, newSurvey]);

  const addOption = useCallback((questionIndex, survey = newSurvey) => {
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
  }, [editingSurvey, newSurvey]);

  const updateOption = useCallback((questionIndex, optionIndex, value, survey = newSurvey) => {
    const updatedQuestions = [...survey.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    if (editingSurvey) {
      setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
    } else {
      setNewSurvey({ ...survey, questions: updatedQuestions });
    }
  }, [editingSurvey, newSurvey]);

  const removeOption = useCallback((questionIndex, optionIndex, survey = newSurvey) => {
    const updatedQuestions = [...survey.questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    if (editingSurvey) {
      setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
    } else {
      setNewSurvey({ ...survey, questions: updatedQuestions });
    }
  }, [editingSurvey, newSurvey]);

  const handleAiQuery = useCallback(async (e) => {
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
  }, [aiQuery, editingSurvey, showAiInput]);

  const applySuggestion = useCallback((suggestion) => {
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
  }, [editingSurvey]);

  const handleStatusChange = useCallback(async (surveyId, newStatus) => {
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
  }, [surveys, viewingSurvey, user]);

  const prepareQuestionsForEdit = useCallback((questions) => {
    return questions.map(q => ({
      text: q.question,
      type: q.type,
      options: q.choices || [],
      question_order: q.question_order
    }));
  }, []);

  const handleEdit = useCallback((survey) => {
    setEditingSurvey({
      ...survey,
      questions: prepareQuestionsForEdit(survey.questions)
    });
    setShowCreateForm(true);
  }, [prepareQuestionsForEdit]);

  // Function to generate a share token and save it to survey_share_links
  const generateShareToken = useCallback(async (surveyId) => {
    setShareTokenLoading(true);
    try {
      // Generate a random token
      const tokenBytes = new Uint8Array(16);
      window.crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Set expiry date (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      // Save to survey_share_links table
      const { data: tokenData, error } = await supabase
        .from('survey_share_links')
        .insert([{
          survey_id: surveyId,
          token: token,
          expires_at: expiryDate.toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setShareToken(token);
      setShareTokenExpiry(expiryDate);
      return token;
    } catch (error) {
      console.error('Error generating share token:', error);
      alert('Failed to generate share link. Please try again.');
      return null;
    } finally {
      setShareTokenLoading(false);
    }
  }, []);

  const ViewSurveyModal = useCallback(({ survey, onClose }) => {
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
                        {Array.from({length: getRatingScale(question.question)}).map((_, num) => (
                          <span key={num} className="rating-star">★</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="survey-actions">
              <button 
                className="share-btn"
                onClick={async () => {
                  setShowShareModal(true);
                  // Generate token when share button is clicked
                  if (!shareToken) {
                    const token = await generateShareToken(survey.id);
                    setShareToken(token);
                  }
                }}
              >
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
                        : window.location.origin}/survey/${survey.id}?token=${shareToken}`}
                      readOnly
                    />
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${process.env.NODE_ENV === 'development' 
                        ? 'http://localhost:3000' 
                        : window.location.origin}/survey/${survey.id}?token=${shareToken}`);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}>
                      {copySuccess ? 'Copied!' : <FaCopy />}
                    </button>
                  </div>
                  {shareTokenExpiry && (
                    <p className="share-expiry">
                      This link will expire on {new Date(shareTokenExpiry).toLocaleDateString()}
                    </p>
                  )}
                  {shareTokenLoading && (
                    <p className="share-loading">Generating secure link...</p>
                  )}
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
  }, [handleStatusChange, showShareModal, copySuccess, shareToken, shareTokenExpiry, shareTokenLoading, generateShareToken]);

  // Template Modal Component
  const TemplateModal = useCallback(() => {
    return (
      <div className="modal-overlay">
        <div className="template-modal">
          <div className="modal-header">
            <h2>Select a Survey Template</h2>
            <button className="close-modal-btn" onClick={() => setShowTemplateModal(false)}>×</button>
          </div>
          
          <div className="modal-content">
            <div className="templates-grid">
              {templates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    {template.type && (
                      <span className="template-type-badge">{template.type}</span>
                    )}
                    <h3>{template.title}</h3>
                  </div>
                  <p>{template.description}</p>
                  <div className="template-actions">
                    <button 
                      className="preview-template-btn"
                      onClick={() => handleViewTemplate(template.id)}
                    >
                      Preview
                    </button>
                    <button 
                      className="use-template-btn"
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      Use This Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }, [templates, handleViewTemplate, handleTemplateSelect]);

  // Template Preview Modal Component
  const TemplatePreviewModal = useCallback(({ template, onClose }) => {
    if (!template) return null;

    return (
      <div className="modal-overlay">
        <div className="view-survey-modal">
          <div className="modal-header">
            <h2>{template.title}</h2>
            <button className="close-modal-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-content">
            <div className="survey-info">
              <p className="survey-description">{template.description}</p>
            </div>

            <div className="survey-questions">
              <h3>Questions</h3>
              {template.questions && template.questions.map((question, index) => (
                <div key={index} className="survey-question">
                  <div className="question-number">Q{index + 1}</div>
                  <div className="question-content">
                    <p className="question-text">{question.question}</p>
                    
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
                        {Array.from({length: getRatingScale(question.question)}).map((_, num) => (
                          <span key={num} className="rating-star">★</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="template-actions">
              <button 
                className="use-template-btn"
                onClick={() => {
                  handleTemplateSelect(template.id);
                  onClose();
                }}
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [handleTemplateSelect]);

  const renderQuestionForm = useCallback((question, index, survey = newSurvey) => (
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
  ), [newSurvey, editingSurvey, showAiInput, aiQuery, aiSuggestions, loading, handleAiQuery, updateQuestion, updateOption, removeOption, addOption, applySuggestion]);

  return (
    <div className="survey-container">
      <div className="survey-header">
        <h1>Surveys</h1>
        <div className="survey-header-buttons">
          <button 
            className="create-survey-btn"
            onClick={() => {
              setNewSurvey({
                title: '',
                description: '',
                questions: [{ text: '', type: 'text', options: [], required: false }],
                type: null
              });
              setShowCreateForm(true);
            }}
          >
            Create New Survey
          </button>
          <button 
            className="template-survey-btn"
            onClick={() => setShowTemplateModal(true)}
          >
            <FaClone /> From Template
          </button>
        </div>
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
                    onClick={() => handleDeleteClick(survey)}
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

      {/* Delete Survey Confirmation Modal */}
      {showDeleteConfirmModal && selectedSurvey && (
        <div className="modal-overlay">
          <div className="delete-modal-content">
            <h3>Delete Survey</h3>
            <p className="delete-confirmation-message">
              Are you sure you want to delete the survey "
              {selectedSurvey.title || "Unnamed Survey"}"? This action cannot be
              undone.
            </p>
            <p className="delete-warning">
              This will permanently delete all survey data and responses.
            </p>
            <div className="modal-actions">
              <button
                className="delete-confirm-btn"
                onClick={handleDeleteSurvey}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Survey"}
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setSelectedSurvey(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && <TemplateModal />}

      {/* Template Preview Modal */}
      {viewingTemplate && (
        <TemplatePreviewModal
          template={viewingTemplate}
          onClose={() => setViewingTemplate(null)}
        />
      )}
    </div>
  );
};

export default Survey;