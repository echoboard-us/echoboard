import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaPlus,
  FaTrash,
  FaUserPlus,
  FaBell,
  FaCheck,
  FaTimes,
  FaClipboardList,
  FaChevronDown,
  FaExternalLinkAlt,
  FaUserFriends,
} from "react-icons/fa";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import TeamInvite from "./TeamInvite";
import { useNavigate } from "react-router-dom";
import "./Teams.css";

const Teams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSurveysDropdown, setShowSurveysDropdown] = useState({});
  const [teamSurveys, setTeamSurveys] = useState({});
  const [availableSurveys, setAvailableSurveys] = useState({});
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  // Fetch teams and pending invitations
  useEffect(() => {
    if (user) {
      fetchTeams();
      fetchPendingInvites();
    }
  }, [user]);

  const fetchTeams = async () => {
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

      // Map the data to the expected format
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
  };

  const fetchPendingInvites = async () => {
    try {
      console.log(
        "Fetching invites for user:",
        user.id,
        "User email:",
        user.email
      );

      // First, let's check if the user exists in profiles
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("User profile check:", { userProfile, profileError });

      // Get pending invitations with proper join syntax
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
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;

    try {
      // First create the team
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

  const handleDebugAccept = async (inviteId, teamId) => {
    console.log("DEBUG ACCEPT - Starting debug accept process");
    console.log("Invite ID:", inviteId);
    console.log("Team ID:", teamId);
    console.log("User ID:", user.id);

    try {
      // 1. First check if the team exists directly
      console.log("DEBUG ACCEPT - Step 1: Checking if team exists");
      const { data: teamData, error: teamFetchError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();

      console.log("Team fetch result:", teamData || "No team found");
      console.log("Team fetch error:", teamFetchError);

      if (teamFetchError || !teamData) {
        console.error("Team doesn't exist in the database");
        setError(
          `Team with ID ${teamId} doesn't exist. Invitation is invalid.`
        );
        return;
      }

      // 2. Update invitation status
      console.log("DEBUG ACCEPT - Step 2: Updating invitation status");
      const { data: inviteData, error: inviteError } = await supabase
        .from("team_invitations")
        .update({ status: "accepted" })
        .eq("id", inviteId)
        .select();

      console.log("Invitation update result:", inviteData);
      console.log("Invitation update error:", inviteError);

      if (inviteError) {
        console.error("Error updating invitation status");
        setError(`Failed to update invitation: ${inviteError.message}`);
        return;
      }

      // 3. Add user as team member
      console.log("DEBUG ACCEPT - Step 3: Adding user as team member");
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .insert([
          {
            team_id: teamId,
            user_id: user.id,
            role: "member",
          },
        ])
        .select();

      console.log("Member insert result:", memberData);
      console.log("Member insert error:", memberError);

      if (memberError) {
        console.error("Error adding user as team member");
        setError(`Failed to add you as team member: ${memberError.message}`);
        return;
      }

      // 4. Success!
      console.log("DEBUG ACCEPT - Success! All steps completed");
      setError(null);
      alert(`Successfully joined team "${teamData.name}"`);

      // 5. Refresh data
      fetchPendingInvites();
      fetchTeams();
      setShowNotifications(false);
    } catch (error) {
      console.error("DEBUG ACCEPT - Uncaught error:", error);
      setError(`Debug accept failed: ${error.message}`);
    }
  };

  const handleAcceptInvite = async (inviteId, teamId) => {
    console.log(
      "Accepting invite with - inviteId:",
      inviteId,
      "teamId:",
      teamId,
      "userId:",
      user.id
    );
    try {
      // First verify the invitation exists and is pending
      const { data: inviteCheck, error: inviteCheckError } = await supabase
        .from("team_invitations")
        .select(`
          id,
          team_id,
          status,
          invited_user,
          teams!inner (
            id,
            name,
            description
          )
        `)
        .eq("id", inviteId)
        .eq("invited_user", user.id)
        .single();

      console.log("DEBUG - Full invitation check:", {
        inviteId,
        teamId,
        userId: user.id,
        inviteCheck,
        inviteCheckError
      });

      if (inviteCheckError) {
        console.error("Error checking invitation:", inviteCheckError);
        if (inviteCheckError.code === 'PGRST116') {
          setError("Invitation not found. It may have been deleted or already processed.");
        } else {
          setError("Failed to verify invitation: " + inviteCheckError.message);
        }
        return;
      }

      if (inviteCheck.status !== 'pending') {
        setError("This invitation has already been " + inviteCheck.status);
        return;
      }

      // Check if user is already a member of the team
      const { data: existingMember, error: memberCheckError } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", inviteCheck.team_id)
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("DEBUG - Member check:", {
        existingMember,
        memberCheckError,
        teamId: inviteCheck.team_id,
        userId: user.id
      });

      if (memberCheckError) {
        console.error("Error checking existing membership:", memberCheckError);
        setError("Failed to check team membership: " + memberCheckError.message);
        return;
      }

      if (existingMember) {
        setError("You are already a member of this team.");
        return;
      }

      // Add user as team member first
      console.log("Adding user as team member to team:", inviteCheck.teams.name);
      const { error: memberError } = await supabase
        .from("team_members")
        .insert([
          {
            team_id: inviteCheck.team_id,
            user_id: user.id,
            role: "member",
          },
        ]);

      if (memberError) {
        console.error("Error adding team member:", memberError);
        setError("Failed to add you as team member: " + memberError.message);
        return;
      }

      // Then update invitation status
      console.log("Updating invitation status to accepted");
      const { error: inviteError } = await supabase
        .from("team_invitations")
        .update({ status: "accepted" })
        .eq("id", inviteId);

      if (inviteError) {
        console.error("Error updating invitation:", inviteError);
        // Try to remove the team member since invitation update failed
        await supabase
          .from("team_members")
          .delete()
          .eq("team_id", inviteCheck.team_id)
          .eq("user_id", user.id);
        setError("Failed to update invitation: " + inviteError.message);
        return;
      }

      // Success! Refresh the lists and show success message
      console.log("Successfully accepted invitation, refreshing data");
      await Promise.all([fetchTeams(), fetchPendingInvites()]);
      setShowNotifications(false);
      setError(null);
      alert(`Successfully joined team "${inviteCheck.teams.name}"`);

    } catch (error) {
      console.error("Error accepting invite:", error);
      setError("Failed to accept invitation: " + error.message);
    }
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

      // First verify user is the owner
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

      // Delete team surveys first
      const { error: surveysError } = await supabase
        .from("team_surveys")
        .delete()
        .eq("team_id", selectedTeam.id);

      if (surveysError) {
        console.error("Error deleting team surveys:", surveysError);
        throw surveysError;
      }

      // Delete team members
      const { error: membersError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", selectedTeam.id);

      if (membersError) {
        console.error("Error deleting team members:", membersError);
        throw membersError;
      }

      // Delete any pending invitations
      const { error: invitationsError } = await supabase
        .from("team_invitations")
        .delete()
        .eq("team_id", selectedTeam.id);

      if (invitationsError) {
        console.error("Error deleting team invitations:", invitationsError);
        throw invitationsError;
      }

      // Finally delete the team
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

  // Add a function to check if a team exists directly
  const checkTeamExists = async (teamId) => {
    try {
      console.log("Checking if team exists:", teamId);
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();

      console.log("Team check result:", data);
      console.log("Team check error:", error);

      if (error) {
        setError(`Error checking team: ${error.message}`);
        return;
      }

      if (data) {
        setError(null);
        alert(`Team exists: ${JSON.stringify(data, null, 2)}`);
      } else {
        setError(`Team with ID ${teamId} not found`);
      }
    } catch (error) {
      console.error("Error checking team:", error);
      setError(`Error checking team: ${error.message}`);
    }
  };

  // Add cleanup function to handle invalid invitations
  const cleanupInvalidInvitations = async () => {
    try {
      setLoading(true);
      console.log("Cleaning up invalid invitations...");

      // Get all invitations for this user
      const { data: userInvites, error: invitesError } = await supabase
        .from("team_invitations")
        .select("id, team_id")
        .eq("invited_user", user.id)
        .eq("status", "pending");

      if (invitesError) {
        console.error("Error fetching invitations for cleanup:", invitesError);
        setError("Error fetching invitations: " + invitesError.message);
        return;
      }

      console.log("Found invitations to check:", userInvites);

      let invalidCount = 0;

      // Check each invitation to see if the team exists
      for (const invite of userInvites) {
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("id")
          .eq("id", invite.team_id)
          .maybeSingle();

        // If team doesn't exist, mark the invitation as declined
        if (!teamData || teamError) {
          console.log(
            `Team ${invite.team_id} doesn't exist, declining invitation ${invite.id}`
          );

          const { error: updateError } = await supabase
            .from("team_invitations")
            .update({ status: "declined" })
            .eq("id", invite.id);

          if (updateError) {
            console.error("Error declining invalid invitation:", updateError);
          } else {
            invalidCount++;
          }
        }
      }

      // Refresh invitations list
      fetchPendingInvites();

      if (invalidCount > 0) {
        setError(`Cleaned up ${invalidCount} invalid invitation(s)`);
      } else {
        setError("No invalid invitations found");
      }
    } catch (error) {
      console.error("Error in cleanupInvalidInvitations:", error);
      setError("Error cleaning up invitations: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add new function to fetch surveys for a team
  const fetchTeamSurveys = async (teamId) => {
    try {
      const { data: surveys, error } = await supabase
        .from('team_surveys')
        .select(`
          survey_id,
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
        .map(s => s.surveys);

      setTeamSurveys(prev => ({
        ...prev,
        [teamId]: formattedSurveys
      }));
    } catch (error) {
      console.error('Error fetching team surveys:', error);
    }
  };

  // Add new function to fetch available surveys
  const fetchAvailableSurveys = async (teamId) => {
    try {
      // First get all surveys created by the user
      const { data: userSurveys, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('creator_id', user.id);

      if (surveysError) throw surveysError;

      // Then get surveys already added to the team
      const { data: teamSurveys, error: teamSurveysError } = await supabase
        .from('team_surveys')
        .select('survey_id')
        .eq('team_id', teamId);

      if (teamSurveysError) throw teamSurveysError;

      // Filter out surveys that are already added to the team
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

  // Add new function to toggle surveys dropdown
  const toggleSurveysDropdown = async (teamId) => {
    if (!showSurveysDropdown[teamId]) {
      await fetchTeamSurveys(teamId);
      await fetchAvailableSurveys(teamId);
    }
    setShowSurveysDropdown(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Add new function to add survey to team
  const addSurveyToTeam = async (teamId, surveyId) => {
    try {
      console.log('Adding survey to team:', { teamId, surveyId, userId: user.id });
      
      // First verify the team exists
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

      // Then verify the survey exists
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

      // Check if the survey is already in the team
      const { data: existing, error: existingError } = await supabase
        .from('team_surveys')
        .select('id')
        .eq('team_id', teamId)
        .eq('survey_id', surveyId)
        .single();

      if (existing) {
        console.log('Survey already exists in team');
        setError('This survey is already added to the team');
        return;
      }

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing survey:', existingError);
        setError('Failed to check if survey exists in team');
        return;
      }

      // Finally, add the survey to the team
      const { error: insertError } = await supabase
        .from('team_surveys')
        .insert({
          team_id: teamId,
          survey_id: surveyId,
          created_by: user.id
        });

      if (insertError) {
        console.error('Error adding survey to team:', insertError);
        setError(insertError.message);
        return;
      }

      console.log('Successfully added survey to team');
      
      // Clear any existing error
      setError(null);

      // Refresh the surveys lists
      await fetchTeamSurveys(teamId);
      await fetchAvailableSurveys(teamId);
    } catch (error) {
      console.error('Error in addSurveyToTeam:', error);
      setError('Failed to add survey to team: ' + error.message);
    }
  };

  // Add new function to remove survey from team
  const removeSurveyFromTeam = async (teamId, surveyId) => {
    try {
      const { error } = await supabase
        .from('team_surveys')
        .delete()
        .eq('team_id', teamId)
        .eq('survey_id', surveyId);

      if (error) throw error;

      // Refresh the surveys lists
      await fetchTeamSurveys(teamId);
      await fetchAvailableSurveys(teamId);
    } catch (error) {
      console.error('Error removing survey from team:', error);
    }
  };

  // Add function to handle survey click
  const handleSurveyClick = (surveyId, e) => {
    // Stop propagation to prevent the dropdown from closing
    e.stopPropagation();
    // Navigate to the survey view/edit page
    navigate(`/surveys/${surveyId}`);
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

      // Format the members data
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

  const handleViewMembers = async (team) => {
    setSelectedTeam(team);
    await fetchTeamMembers(team.id);
    setShowMembersModal(true);
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedTeam) return;
    
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", selectedTeam.id)
        .eq("user_id", memberId);

      if (error) throw error;

      // Refresh the members list
      await fetchTeamMembers(selectedTeam.id);
    } catch (error) {
      console.error("Error removing team member:", error);
      setError("Failed to remove team member: " + error.message);
    }
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

      {error && <div className="error-message">{error}</div>}

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
                      <div style={{ position: 'relative' }}>
                        <button
                          className="manage-surveys-btn"
                          onClick={() => toggleSurveysDropdown(team.id)}
                        >
                          <FaClipboardList /> Manage Surveys <FaChevronDown />
                        </button>
                        {showSurveysDropdown[team.id] && (
                          <div className="surveys-dropdown">
                            <div className="surveys-dropdown-header">
                              Team Surveys
                            </div>
                            <div className="surveys-list">
                              {teamSurveys[team.id]?.map(survey => (
                                <div key={survey.id} className="survey-item">
                                  <div 
                                    className="survey-item-content"
                                    onClick={(e) => handleSurveyClick(survey.id, e)}
                                    style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                                  >
                                    <span className="survey-item-title">
                                      {survey.title}
                                    </span>
                                    <FaExternalLinkAlt size={12} style={{ color: 'var(--text-secondary)' }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span className={`survey-item-status ${survey.status}`}>
                                      {survey.status}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeSurveyFromTeam(team.id, survey.id);
                                      }}
                                      style={{ 
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--danger-color)',
                                        cursor: 'pointer',
                                        padding: '4px'
                                      }}
                                    >
                                      <FaTrash size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <div className="surveys-dropdown-header">
                                Available Surveys
                              </div>
                              {availableSurveys[team.id]?.map(survey => (
                                <div key={survey.id} className="survey-item">
                                  <div 
                                    className="survey-item-content"
                                    onClick={(e) => handleSurveyClick(survey.id, e)}
                                    style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                                  >
                                    <span className="survey-item-title">
                                      {survey.title}
                                    </span>
                                    <FaExternalLinkAlt size={12} style={{ color: 'var(--text-secondary)' }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span className={`survey-item-status ${survey.status}`}>
                                      {survey.status}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addSurveyToTeam(team.id, survey.id);
                                      }}
                                      style={{ 
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--success-color)',
                                        cursor: 'pointer',
                                        padding: '4px'
                                      }}
                                    >
                                      <FaPlus size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {(!teamSurveys[team.id] || teamSurveys[team.id].length === 0) &&
                               (!availableSurveys[team.id] || availableSurveys[team.id].length === 0) && (
                                <div className="no-surveys-message">
                                  No surveys available
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
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
            {error && <div className="error-message">{error}</div>}
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
            {error && <div className="error-message">{error}</div>}
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
    </div>
  );
};

export default Teams;
