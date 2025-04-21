import React, { useState, useEffect, useCallback } from "react";
import {
  FaUsers,
  FaPlus,
  FaTrash,
  FaUserPlus,
  FaBell,
  FaCheck,
  FaTimes,
  FaClipboardList,
  FaExternalLinkAlt,
  FaUserFriends,
  FaClock,
} from "react-icons/fa";
import {
  supabase,
} from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import TeamInvite from "./TeamInvite";
import "./Teams.css";
import { sendSurveyToTeam } from "../services/emailService";

const Teams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSurveysModal, setShowSurveysModal] = useState(false);
  const [selectedTeamForSurveys, setSelectedTeamForSurveys] = useState(null);
  const [teamSurveys, setTeamSurveys] = useState([]);
  const [availableSurveys, setAvailableSurveys] = useState([]);
  const [savingFrequency, setSavingFrequency] = useState({});
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [surveyFrequencies, setSurveyFrequencies] = useState({});

  // State for reason modal
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [modalReason, setModalReason] = useState("");
  const [modalConfig, setModalConfig] = useState({ type: '', inviteId: null, memberId: null, teamId: null });

  // Define fetchTeams with useCallback
  const fetchTeams = useCallback(async () => {
    try {
      console.log("Fetching teams for user:", user.id);

      // Fetch teams where user is a member with better join syntax
      const { data: memberTeams, error: memberError } = await supabase
        .from("team_members")
        .select(`
          team_id,
          role,
          teams!inner (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq("user_id", user.id);

      console.log("DEBUG - Teams fetch:", {
        userId: user.id,
        rawData: memberTeams,
        error: memberError
      });

      if (memberError) {
        console.error("Error fetching member teams:", memberError);
        throw memberError;
      }

      const formattedTeams = memberTeams.map((mt) => ({
        id: mt.teams.id,
        name: mt.teams.name || "Unnamed Team",
        description: mt.teams.description || "",
        role: mt.role || "member",
        created_at: mt.teams.created_at
      }));

      console.log("DEBUG - Formatted teams:", formattedTeams);
      setTeams(formattedTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setError("Failed to fetch teams: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPendingInvites = useCallback(async () => {
    try {
      console.log(
        "Fetching invites for user:",
        user.id,
        "User email:",
        user.email
      );

      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("User profile check:", { userProfile, profileError });

      const { data: invites, error } = await supabase
        .from("team_invitations")
        .select(
          `
          id,
          team_id,
          invited_by,
          invited_user,
          status,
          created_at,
          teams:team_id (
            id,
            name,
            description
          ),
          profiles:invited_by (
            email
          )
        `
        )
        .eq("invited_user", user.id)
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching invites:", error);
        throw error;
      }

      console.log("Raw invites data (pending only):", invites);
      console.log("Invites query conditions:", {
        invited_user: user.id,
        status: "pending",
      });

      setPendingInvites(invites || []);
    } catch (error) {
      console.error("Error fetching invites:", error);
      setError("Failed to fetch invitations: " + error.message);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTeams();
      fetchPendingInvites();
    }
  }, [user, fetchTeams, fetchPendingInvites]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;

    try {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert([
          {
            name: newTeam.name,
            description: newTeam.description,
            creator_id: user.id,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (teamError) {
        console.error("Error creating team:", teamError);
        setError(teamError.message);
        return;
      }

      console.log("Team created successfully:", team);

      // Then add the creator as a team member with 'owner' role
      const { error: memberError } = await supabase
        .from("team_members")
        .insert([
          {
            team_id: team.id,
            user_id: user.id,
            role: "owner",
          },
        ]);

      if (memberError) {
        console.error("Error adding team member:", memberError);
        setError(memberError.message);
        return;
      }

      console.log("Team member added successfully");

      setTeams([...teams, team]);
      setNewTeam({ name: "", description: "" });
      setShowCreateModal(false);
      setError(null);
    } catch (error) {
      console.error("Error in handleCreateTeam:", error);
      setError(error.message);
    }
  };

  const handleInviteClick = (team) => {
    setSelectedTeam(team);
    setShowInviteModal(true);
  };

  const openReasonModal = (type, inviteId=null, memberId=null, teamId=null) => {
    setModalConfig({ type, inviteId, memberId, teamId });
    setModalReason("");
    setShowReasonModal(true);
  };

  const processReasonAction = async () => {
    if (modalConfig.type === 'join') {
      const { error } = await supabase.rpc('accept_invite', { p_team_id: modalConfig.teamId, p_user_id: user.id, p_reason: modalReason });
      if (error) return setError(error.message);
      await Promise.all([fetchTeams(), fetchPendingInvites()]);
      setShowNotifications(false);
    } else if (modalConfig.type === 'remove') {
      const { error } = await supabase.rpc('remove_team_member', { p_team_id: modalConfig.teamId, p_user_id: modalConfig.memberId, p_reason: modalReason });
      if (error) return setError(error.message);
      await fetchTeamMembers(modalConfig.teamId);
    }
    setShowReasonModal(false);
    setError(null);
  };

  const handleAcceptInvite = async (inviteId, teamId) => {
    openReasonModal('join', inviteId, null, teamId);
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      const { error } = await supabase
        .from("team_invitations")
        .update({ status: "declined" })
        .eq("id", inviteId);

      if (error) throw error;
      fetchPendingInvites();
    } catch (error) {
      console.error("Error declining invite:", error);
      setError("Failed to decline invitation");
    }
  };

  const handleDeleteClick = (team) => {
    if (team.role !== "owner") {
      setError("Only team owners can delete teams.");
      return;
    }
    setSelectedTeam(team);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      setLoading(true);
      console.log("Deleting team:", selectedTeam.id);

      const { data: teamMember, error: roleCheckError } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", selectedTeam.id)
        .eq("user_id", user.id)
        .single();

      if (roleCheckError) {
        console.error("Error checking role:", roleCheckError);
        setError("Failed to verify team ownership: " + roleCheckError.message);
        return;
      }

      if (!teamMember || teamMember.role !== "owner") {
        setError("Only team owners can delete teams.");
        return;
      }

      const { error: surveysError } = await supabase
        .from("team_surveys")
        .delete()
        .eq("team_id", selectedTeam.id);

      if (surveysError) {
        console.error("Error deleting team surveys:", surveysError);
        throw surveysError;
      }

      const { error: membersError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", selectedTeam.id);

      if (membersError) {
        console.error("Error deleting team members:", membersError);
        throw membersError;
      }

      const { error: invitationsError } = await supabase
        .from("team_invitations")
        .delete()
        .eq("team_id", selectedTeam.id);

      if (invitationsError) {
        console.error("Error deleting team invitations:", invitationsError);
        throw invitationsError;
      }

      const { error: teamError } = await supabase
        .from("teams")
        .delete()
        .eq("id", selectedTeam.id);

      if (teamError) {
        console.error("Error deleting team:", teamError);
        throw teamError;
      }

      console.log("Team deleted successfully");

      // Update local state
      setTeams(teams.filter((team) => team.id !== selectedTeam.id));
      setShowDeleteConfirmModal(false);
      setSelectedTeam(null);
      setError(null);
      alert("Team deleted successfully");
    } catch (error) {
      console.error("Error in handleDeleteTeam:", error);
      setError("Failed to delete team: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const fetchTeamSurveys = async (teamId) => {
    try {
      const { data: surveys, error } = await supabase
        .from('team_surveys')
        .select(`
          survey_id,
          frequency,
          surveys (
            id,
            title,
            description,
            status
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      const formattedSurveys = surveys
        .filter(s => s.surveys)
        .map(s => ({
          ...s.surveys,
          frequency: s.frequency || 'never'
        }));

      // Initialize survey frequencies
      const frequencies = {};
      formattedSurveys.forEach(survey => {
        frequencies[survey.id] = survey.frequency;
      });
      
      setSurveyFrequencies(frequencies);
      setTeamSurveys(prev => ({
        ...prev,
        [teamId]: formattedSurveys
      }));
    } catch (error) {
      console.error('Error fetching team surveys:', error);
    }
  };

  const fetchAvailableSurveys = async (teamId) => {
    try {
      // First get all surveys created by the user
      const { data: userSurveys, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('creator_id', user.id);

      if (surveysError) throw surveysError;

      const { data: teamSurveys, error: teamSurveysError } = await supabase
        .from('team_surveys')
        .select('survey_id')
        .eq('team_id', teamId);

      if (teamSurveysError) throw teamSurveysError;

      const teamSurveyIds = teamSurveys.map(ts => ts.survey_id);
      const availableSurveys = userSurveys.filter(
        survey => !teamSurveyIds.includes(survey.id)
      );

      setAvailableSurveys(prev => ({
        ...prev,
        [teamId]: availableSurveys
      }));
    } catch (error) {
      console.error('Error fetching available surveys:', error);
    }
  };

  const toggleSurveysDropdown = async (teamId) => {
    await fetchTeamSurveys(teamId);
    await fetchAvailableSurveys(teamId);
    setSelectedTeamForSurveys(teamId);
    setShowSurveysModal(true);
  };

  const addSurveyToTeam = async (teamId, surveyId) => {
    try {
      console.log('Adding survey to team:', { teamId, surveyId, userId: user.id });
      
      const { data: teamExists, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', teamId)
        .single();

      if (teamError || !teamExists) {
        console.error('Team verification failed:', teamError);
        setError('Failed to verify team');
        return;
      }

      const { data: surveyExists, error: surveyError } = await supabase
        .from('surveys')
        .select('id')
        .eq('id', surveyId)
        .single();

      if (surveyError || !surveyExists) {
        console.error('Survey verification failed:', surveyError);
        setError('Failed to verify survey');
        return;
      }

      const { data: existing, error: existingError } = await supabase
        .from('team_surveys')
        .select('*')
        .eq('team_id', teamId)
        .eq('survey_id', surveyId)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing team survey:', existingError);
        setError('Error checking if survey is already in team');
        return;
      }

      if (existing) {
        console.log('Survey already in team');
        setError('This survey is already associated with the team');
        return;
      }

      const { error: insertError } = await supabase
        .from('team_surveys')
        .insert({
          team_id: teamId,
          survey_id: surveyId,
          frequency: 'never'
        });

      if (insertError) {
        console.error('Error adding survey to team:', insertError);
        setError('Failed to add survey to team');
        return;
      }

      console.log('Survey added to team successfully');
      setError(null);

      // Refresh the team surveys
      await fetchTeamSurveys(teamId);
    } catch (error) {
      console.error('Error in addSurveyToTeam:', error);
      setError('An error occurred while adding the survey to the team');
    }
  };

  const updateSurveyFrequency = async (teamId, surveyId, frequency) => {
    try {
      setSavingFrequency(prev => ({
        ...prev,
        [surveyId]: true
      }));
      
      const updateData = { frequency };
      
      const { error } = await supabase
        .from('team_surveys')
        .update(updateData)
        .eq('team_id', teamId)
        .eq('survey_id', surveyId);

      if (error) throw error;

      // Update local state
      setSurveyFrequencies(prev => ({
        ...prev,
        [surveyId]: frequency
      }));

      console.log(`Survey ${surveyId} frequency updated to ${frequency}`);
    } catch (error) {
      console.error('Error updating survey frequency:', error);
      setError('Failed to update survey frequency: ' + error.message);
    } finally {
      setSavingFrequency(prev => ({
        ...prev,
        [surveyId]: false
      }));
    }
  };

  const sendSurveyNow = async (teamId, surveyId) => {
    try {
      setSavingFrequency(prev => ({
        ...prev,
        [surveyId]: true
      }));
      

      const result = await sendSurveyToTeam(teamId, surveyId);
      
      if (result.status === 'success') {
        setSuccessMessage(`${result.message}`);
        setError(null);
      } else {
        throw new Error(result.message);
      }
      
      console.log(`Survey ${surveyId} sent to team ${teamId}:`, result);
    } catch (error) {
      console.error('Error sending survey:', error);
      setError('Failed to send survey: ' + error.message);
      setSuccessMessage(null);
    } finally {
      setSavingFrequency(prev => ({
        ...prev,
        [surveyId]: false
      }));
    }
  };

  const removeSurveyFromTeam = async (teamId, surveyId) => {
    try {
      const { error } = await supabase
        .from('team_surveys')
        .delete()
        .eq('team_id', teamId)
        .eq('survey_id', surveyId);

      if (error) throw error;
      await fetchTeamSurveys(teamId);
      await fetchAvailableSurveys(teamId);
    } catch (error) {
      console.error('Error removing survey from team:', error);
    }
  };

  const handleViewMembers = async (team) => {
    setSelectedTeam(team);
    await fetchTeamMembers(team.id);
    setShowMembersModal(true);
  };

  const handleRemoveMember = async (memberId) => {
    openReasonModal('remove', null, memberId, selectedTeam.id);
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select(`
          user_id,
          role,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq("team_id", teamId);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
        throw membersError;
      }

      const formattedMembers = members.map(m => ({
        id: m.user_id,
        email: m.profiles?.email,
        full_name: m.profiles?.full_name,
        role: m.role
      }));

      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error("Error in fetchTeamMembers:", error);
      setError("Failed to fetch team members: " + error.message);
    }
  };

  // SurveysModal component
  const SurveysModal = ({ teamId, onClose }) => {
    const team = teams.find(t => t.id === teamId);
    const surveys = teamSurveys[teamId] || [];
    const available = availableSurveys[teamId] || [];

    const handleFrequencyChange = (surveyId, newFrequency) => {
      updateSurveyFrequency(teamId, surveyId, newFrequency);
    };

    const handleViewSurvey = (surveyId) => {
      window.location.href = `/surveys/${surveyId}`;
      onClose();
    };

    if (!team) {
      return null;
    }

    return (
      <div className="insights-modal-overlay" onClick={onClose}>
        <div className="insights-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{team.name} - Manage Surveys</h2>
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className="modal-content">
            <div className="insights-container-box">
              <div className="response-summary">
                <h3>Team Surveys</h3>
                <p>Total Surveys: {surveys.length}</p>
              </div>

              <div className="raw-responses-container">
                {surveys.length > 0 ? (
                  surveys.map(survey => (
                    <div key={survey.id} className="question-responses-card">
                      <div className="question-header">
                        <h4>{survey.title}</h4>
                        <span className="response-count">{survey.status}</span>
                      </div>
                      <div className="survey-actions">
                        <div 
                          className="survey-item-content"
                          onClick={() => handleViewSurvey(survey.id)}
                          style={{ 
                            cursor: 'pointer', 
                            flex: 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '8px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s',
                            backgroundColor: 'var(--bg-accent)',
                            marginRight: '8px'
                          }}
                        >
                          <span className="survey-item-title">
                            View Survey
                          </span>
                          <FaExternalLinkAlt size={12} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSurveyFromTeam(teamId, survey.id);
                            onClose();
                          }}
                          style={{ 
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger-color)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                      
                      {/* Survey Frequency Selection */}
                      <div className="survey-frequency" style={{ 
                        marginTop: '12px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-light)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaClock size={14} style={{ color: 'var(--text-secondary)' }} />
                          <span>Send Frequency:</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <select
                            value={surveyFrequencies[survey.id] || 'never'}
                            onChange={(e) => handleFrequencyChange(survey.id, e.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-light)',
                              color: 'var(--text-primary)',
                              fontSize: '0.9rem'
                            }}
                          >
                            <option value="never">Never</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                          </select>
                          
                          {savingFrequency[survey.id] && (
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              Saving...
                            </span>
                          )}
                          
                          <button
                            onClick={() => sendSurveyNow(teamId, survey.id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--primary-color)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            Send Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data-message">No surveys assigned to this team yet.</p>
                )}
              </div>

              <div className="available-surveys-section" style={{ marginTop: '24px' }}>
                <h3>Available Surveys</h3>
                <p>Surveys you can add to this team:</p>
                
                <div className="available-surveys-list" style={{ marginTop: '16px' }}>
                  {available.length > 0 ? (
                    available.map(survey => (
                      <div 
                        key={survey.id} 
                        className="available-survey-item"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          backgroundColor: 'var(--bg-light)',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          cursor: 'default'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <span style={{ fontWeight: 'bold', marginBottom: '4px' }}>{survey.title}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {survey.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            onClick={() => handleViewSurvey(survey.id)}
                            style={{ 
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary-color)',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.9rem'
                            }}
                          >
                            View <FaExternalLinkAlt size={12} />
                          </button>
                          <button 
                            className="add-survey-btn"
                            onClick={() => {
                              addSurveyToTeam(teamId, survey.id);
                              onClose();
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'var(--success-color)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <FaPlus size={12} /> Add
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-data-message">No additional surveys available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="teams-container">
      <div className="teams-header">
        <h2>
          <FaUsers className="header-icon" /> Teams
        </h2>
        <div className="header-actions">
          <button className="notification-btn" onClick={toggleNotifications}>
            <FaBell />
            {pendingInvites.length > 0 && (
              <span className="notification-badge">
                {pendingInvites.length}
              </span>
            )}
          </button>
          <button
            className="create-team-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus /> Create Team
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <FaTimes /> {error}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          <FaCheck /> {successMessage}
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && pendingInvites.length > 0 && (
        <div className="notifications-dropdown">
          <h3>Team Invitations</h3>
          <div className="notification-items">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="notification-item">
                <div className="notification-content">
                  <p>
                    <strong>{invite.profiles?.email || "Unknown User"}</strong>{" "}
                    invited you to join{" "}
                    <strong>{invite.teams?.name || "Unknown Team"}</strong>
                  </p>
                  <p className="notification-team-desc">
                    {invite.teams?.description || "No description provided"}
                  </p>
                </div>
                <div className="notification-actions">
                  <button
                    className="notification-accept-btn"
                    onClick={() =>
                      handleAcceptInvite(invite.id, invite.team_id)
                    }
                    title="Accept"
                  >
                    <FaCheck />
                  </button>
                  <button
                    className="notification-decline-btn"
                    onClick={() => handleDeclineInvite(invite.id)}
                    title="Decline"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams List */}
      <div className="teams-list">
        {teams.length === 0 ? (
          <div className="no-teams-message">
            <p>
              You don't have any teams yet. Create a team or wait for
              invitations.
            </p>
          </div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="team-card">
              <div className="team-card-header">
                {team.role === "owner" && (
                  <button
                    className="delete-team-icon-btn"
                    onClick={() => handleDeleteClick(team)}
                    title="Delete Team"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
              <div className="team-info">
                <h3>{team.name || "Unnamed Team"}</h3>
                <p className="team-id-display">ID: {team.id}</p>
                <p>{team.description || "No description available"}</p>
                <p className="team-role">
                  Your role: <span className="role-badge">{team.role}</span>
                </p>
                <div className="team-actions">
                  {(team.role === "owner" || team.role === "admin") && (
                    <>
                      <button
                        className="invite-member-btn"
                        onClick={() => handleInviteClick(team)}
                      >
                        <FaUserPlus /> Invite Members
                      </button>
                      <button
                        className="manage-surveys-btn"
                        onClick={() => toggleSurveysDropdown(team.id)}
                      >
                        <FaClipboardList /> Manage Surveys
                      </button>
                    </>
                  )}
                  <button
                    className="view-members-btn"
                    onClick={() => handleViewMembers(team)}
                  >
                    <FaUserFriends /> View Members
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-team-modal">
            <h3>Create New Team</h3>
            {error && (
              <div className="error-message">
                <FaTimes /> {error}
              </div>
            )}
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label>Team Name</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, name: e.target.value })
                  }
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, description: e.target.value })
                  }
                  placeholder="Enter team description"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-btn">
                  Create Team
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Invite Modal */}
      {showInviteModal && selectedTeam && (
        <div className="modal-overlay">
          <TeamInvite
            teamId={selectedTeam.id}
            teamName={selectedTeam.name}
            onClose={() => {
              setShowInviteModal(false);
              setSelectedTeam(null);
            }}
          />
        </div>
      )}

      {/* Delete Team Confirmation Modal */}
      {showDeleteConfirmModal && selectedTeam && (
        <div className="modal-overlay">
          <div className="delete-modal-content">
            <h3>Delete Team</h3>
            <p className="delete-confirmation-message">
              Are you sure you want to delete the team "{selectedTeam.name || "Unnamed Team"}"? 
              This action cannot be undone.
            </p>
            <p className="delete-warning">
              This will permanently delete:
              <ul>
                <li>All team members and their associations</li>
                <li>All pending team invitations</li>
                <li>All team surveys and their data</li>
                <li>All team settings and configurations</li>
              </ul>
            </p>
            <div className="modal-actions">
              <button
                className="delete-confirm-btn"
                onClick={handleDeleteTeam}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, Delete Team"}
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setSelectedTeam(null);
                  setError(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedTeam && (
        <div className="modal-overlay">
          <div className="members-modal">
            <h3>Team Members</h3>
            {error && (
              <div className="error-message">
                <FaTimes /> {error}
              </div>
            )}
            <div className="members-list">
              {teamMembers.map((member) => (
                <div key={member.id} className="member-item">
                  <p>
                    <strong>{member.email}</strong>
                  </p>
                  <p>Role: {member.role}</p>
                  <div className="member-actions">
                    <button
                      className="remove-member-btn"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove Member
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="close-btn"
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedTeam(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render the SurveysModal when showSurveysModal is true */}
      {showSurveysModal && selectedTeamForSurveys && (
        <SurveysModal 
          teamId={selectedTeamForSurveys} 
          onClose={() => {
            setShowSurveysModal(false);
            setSelectedTeamForSurveys(null);
          }}
        />
      )}

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="modal-overlay">
          <div className="reason-modal">
            <h3>{modalConfig.type === 'join' ? 'Why are you joining this team?' : 'Why are you removing this member?'}</h3>
            <textarea value={modalReason} onChange={e => setModalReason(e.target.value)} placeholder="Enter reason..." />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowReasonModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={processReasonAction} disabled={!modalReason.trim()}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
