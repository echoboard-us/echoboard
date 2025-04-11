import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaChartBar, FaEdit, FaTrash } from 'react-icons/fa';
import './TeamSurveys.css';

const TeamSurveys = ({ teamId, isAdmin }) => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSurveys, setUserSurveys] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchTeamSurveys();
    if (isAdmin) {
      fetchUserSurveys();
    }
  }, [teamId, isAdmin]);

  const fetchTeamSurveys = async () => {
    try {
      const { data: teamSurveys, error: teamError } = await supabase
        .from('team_surveys')
        .select(`
          survey_id,
          surveys (
            id,
            title,
            description,
            created_at,
            status,
            creator_id,
            questions (count)
          )
        `)
        .eq('team_id', teamId);

      if (teamError) throw teamError;

      // Filter out null surveys and format the data
      const formattedSurveys = teamSurveys
        .filter(ts => ts.surveys)
        .map(ts => ({
          ...ts.surveys,
          questionCount: ts.surveys.questions,
        }));

      setSurveys(formattedSurveys);
    } catch (error) {
      console.error('Error fetching team surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('creator_id', user.id)
        .not('id', 'in', surveys.map(s => s.id));

      if (error) throw error;
      setUserSurveys(data);
    } catch (error) {
      console.error('Error fetching user surveys:', error);
    }
  };

  const addSurveyToTeam = async (surveyId) => {
    try {
      const { error } = await supabase
        .from('team_surveys')
        .insert({
          team_id: teamId,
          survey_id: surveyId,
          created_by: user.id
        });

      if (error) throw error;
      
      // Refresh the surveys list
      fetchTeamSurveys();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding survey to team:', error);
    }
  };

  const removeSurveyFromTeam = async (surveyId) => {
    try {
      const { error } = await supabase
        .from('team_surveys')
        .delete()
        .eq('team_id', teamId)
        .eq('survey_id', surveyId);

      if (error) throw error;
      
      // Refresh the surveys list
      fetchTeamSurveys();
    } catch (error) {
      console.error('Error removing survey from team:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading team surveys...</div>;
  }

  return (
    <div className="team-surveys">
      <div className="surveys-header">
        <h2>Team Surveys</h2>
        {isAdmin && (
          <button className="add-survey-btn" onClick={() => setShowAddModal(true)}>
            <FaPlus /> Add Survey
          </button>
        )}
      </div>

      <div className="surveys-grid">
        {surveys.map(survey => (
          <div key={survey.id} className="survey-card">
            <h3>{survey.title}</h3>
            <p>{survey.description}</p>
            <div className="survey-meta">
              <span>{survey.questionCount} questions</span>
              <span>Status: {survey.status}</span>
            </div>
            <div className="survey-actions">
              <button className="action-btn view-btn">
                <FaChartBar /> View Results
              </button>
              {isAdmin && (
                <>
                  <button className="action-btn edit-btn">
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => removeSurveyFromTeam(survey.id)}
                  >
                    <FaTrash /> Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Survey to Team</h3>
            <div className="surveys-list">
              {userSurveys.map(survey => (
                <div key={survey.id} className="survey-item">
                  <div className="survey-info">
                    <h4>{survey.title}</h4>
                    <p>{survey.description}</p>
                  </div>
                  <button 
                    className="add-btn"
                    onClick={() => addSurveyToTeam(survey.id)}
                  >
                    Add
                  </button>
                </div>
              ))}
              {userSurveys.length === 0 && (
                <p>No surveys available to add.</p>
              )}
            </div>
            <button 
              className="close-btn"
              onClick={() => setShowAddModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSurveys; 