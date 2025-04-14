import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getRatingScale } from '../utils/surveyUtils';
import './SurveyResponse.css';

const SurveyResponse = () => {
  const { surveyId } = useParams();
  const location = useLocation();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [token, setToken] = useState(null);

  // Extract token from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');  // expects URL like ?token=abc123
    console.log('Token extracted from URL:', t);
    setToken(t);
  }, [location.search]);

  useEffect(() => {
    const fetchSurvey = async () => {
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
          .eq('id', surveyId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Survey not found');

        // Sort questions by question_order
        data.questions.sort((a, b) => a.question_order - b.question_order);
        setSurvey(data);

        // Initialize responses object
        const initialResponses = {};
        data.questions.forEach(q => {
          initialResponses[q.id] = q.type === 'checkbox' ? [] : '';
        });
        setResponses(initialResponses);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching survey:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId, location.search]);

  const handleInputChange = (questionId, value, type = 'text') => {
    setResponses(prev => ({
      ...prev,
      [questionId]: type === 'checkbox' 
        ? (prev[questionId].includes(value)
          ? prev[questionId].filter(v => v !== value)
          : [...prev[questionId], value])
        : value
    }));
  };

  const validateResponses = () => {
    // Since required field doesn't exist in database, we'll treat all questions as required for now
    const unansweredQuestions = survey.questions.filter(q => {
      const response = responses[q.id];
      return !response || (Array.isArray(response) && response.length === 0);
    });

    if (unansweredQuestions.length > 0) {
      const questionNumbers = unansweredQuestions
        .map(q => survey.questions.findIndex(sq => sq.id === q.id) + 1)
        .join(', ');
      throw new Error(`Please answer all questions before submitting. Missing questions: ${questionNumbers}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      validateResponses();

      // Log the data being sent to verify token
      console.log({
        survey_id: surveyId,
        submitted_at: new Date().toISOString(),
        token,
        responder_id: null,
      });

      // Insert the response record
      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .insert([{
          survey_id: surveyId,
          submitted_at: new Date().toISOString(),
          token,             // Include the share link token
          responder_id: null // null for anonymous responses via share link
        }])
        .select()
        .single();

      if (responseError) {
        console.error('Error submitting response:', responseError);
        throw responseError;
      }

      // Insert all answers
      const answersToInsert = Object.entries(responses).map(([questionId, value]) => ({
        response_id: responseData.id,
        question_id: questionId,
        answer: Array.isArray(value) ? value.join(', ') : value.toString()
      }));

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert);

      if (answersError) throw answersError;

      // Update respondent count in the survey
      try {
        const { error: updateError } = await supabase
          .from('surveys')
          .update({ 
            respondents: survey.respondents ? survey.respondents + 1 : 1 
          })
          .eq('id', surveyId);
          
        if (updateError) {
          console.error('Error updating respondent count:', updateError);
        }
      } catch (countError) {
        // Don't fail the submission if count update fails
        console.error('Error updating respondent count:', countError);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting responses:', err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="survey-response-container">
        <div className="loading">Loading survey...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="survey-response-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="survey-response-container">
        <div className="success">
          <h2>Thank you for your response!</h2>
          <p>Your answers have been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-response-container">
      <div className="survey-header">
        <h1>{survey.title}</h1>
        {survey.description && <p className="description">{survey.description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="survey-form">
        {survey.questions.map((question, index) => (
          <div key={question.id} className="question-container">
            <label className="question-label">
              <span className="question-number">{index + 1}.</span>
              {question.question}
            </label>

            {question.type === 'short_text' && (
              <input
                type="text"
                value={responses[question.id] || ''}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                className="text-input"
                placeholder="Your answer"
              />
            )}

            {question.type === 'long_text' && (
              <textarea
                value={responses[question.id] || ''}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                className="textarea-input"
                placeholder="Your answer"
                rows={4}
              />
            )}

            {(question.type === 'multiple_choice' || question.type === 'dropdown') && (
              <div className="options-container">
                {question.choices.map((choice, choiceIndex) => (
                  <label key={choiceIndex} className="option-label">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={choice}
                      checked={responses[question.id] === choice}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                    />
                    {choice}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'checkbox' && (
              <div className="options-container">
                {question.choices.map((choice, choiceIndex) => (
                  <label key={choiceIndex} className="option-label">
                    <input
                      type="checkbox"
                      value={choice}
                      checked={responses[question.id].includes(choice)}
                      onChange={(e) => handleInputChange(question.id, e.target.value, 'checkbox')}
                    />
                    {choice}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'rating' && (
              <div className="rating-container">
                {Array.from({length: getRatingScale(question.question)}).map((_, index) => {
                  const value = index + 1;
                  return (
                    <label key={value} className="rating-label">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={value}
                        checked={responses[question.id] === value.toString()}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                      />
                      {value}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div className="form-actions">
          <button type="submit" className="submit-button">
            Submit Response
          </button>
        </div>
      </form>
    </div>
  );
};

export default SurveyResponse;
