import React, { useState } from 'react';
import { useSurveys } from '../context/SurveyContext';
import { FaUsers, FaClock, FaTrash, FaEdit, FaShare } from 'react-icons/fa';
import './Survey.css';

const Survey = () => {
  const { surveys, addSurvey, updateSurvey, deleteSurvey } = useSurveys();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    questions: []
  });
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [surveyToDelete, setSurveyToDelete] = useState(null);

  const handleCreateSurvey = () => {
    if (!newSurvey.title.trim()) {
      alert('Please enter a survey title');
      return;
    }
    addSurvey(newSurvey);
    setNewSurvey({ title: '', description: '', questions: [] });
    setShowCreateForm(false);
  };

  const handleUpdateSurvey = () => {
    if (!editingSurvey.title.trim()) {
      alert('Please enter a survey title');
      return;
    }
    updateSurvey(editingSurvey.id, editingSurvey);
    setEditingSurvey(null);
  };

  const handleDeleteSurvey = (surveyId) => {
    if (window.confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      deleteSurvey(surveyId);
      setSurveyToDelete(null);
    }
  };

  const addQuestion = (survey = newSurvey) => {
    const updatedQuestions = [...survey.questions, { 
      text: '', 
      type: 'text',
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

  const renderQuestionForm = (question, index, survey = newSurvey) => (
    <div key={index} className="question-item">
      <div className="question-header">
        <input
          type="text"
          placeholder="Question text"
          value={question.text}
          onChange={(e) => updateQuestion(index, 'text', e.target.value, survey)}
        />
        <select
          value={question.type}
          onChange={(e) => updateQuestion(index, 'type', e.target.value, survey)}
        >
          <option value="text">Text</option>
          <option value="multiple-choice">Multiple Choice</option>
          <option value="rating">Rating</option>
          <option value="checkbox">Checkbox</option>
          <option value="dropdown">Dropdown</option>
        </select>
        <label className="required-toggle">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) => updateQuestion(index, 'required', e.target.checked, survey)}
          />
          Required
        </label>
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
                  <span className={`status ${survey.status.toLowerCase()}`}>
                    {survey.status}
                  </span>
                  <span className="date">
                    <FaClock className="icon" /> {survey.date}
                  </span>
                </div>
                <h3>{survey.title}</h3>
                <p>{survey.description}</p>
                <div className="survey-stats">
                  <span><FaUsers className="icon" /> {survey.respondents} respondents</span>
                  <span>{survey.questions.length} questions</span>
                </div>
                <div className="survey-actions">
                  <button 
                    className="edit-survey-btn"
                    onClick={() => setEditingSurvey(survey)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button className="view-survey-btn">
                    View Survey
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
    </div>
  );
};

export default Survey; 