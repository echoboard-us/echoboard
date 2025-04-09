import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaPlus,
  FaTrash,
  FaUserPlus,
  FaBell,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import TeamInvite from "./TeamInvite";
import "./Teams.css";

const Teams = () => {
  const { user } = useAuth();
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

      // Fetch teams where user is a member
      const { data: memberTeams, error: memberError } = await supabase
        .from("team_members")
        .select(
          `
          team_id,
          role,
          teams:team_id (
            id,
            name,
            description
          )
        `
        )
        .eq("user_id", user.id);

      if (memberError) {
        console.error("Error fetching member teams:", memberError);
        throw memberError;
      }

      console.log("Raw teams data:", memberTeams);

      // Filter out entries with null teams and map to the expected format
      const formattedTeams = memberTeams
        .filter((mt) => mt.teams !== null)
        .map((mt) => ({
          id: mt.team_id, // Use team_id directly as fallback
          name: mt.teams?.name || "Unnamed Team",
          description: mt.teams?.description || "",
          role: mt.role || "member",
        }));

      console.log("Formatted teams:", formattedTeams);
      setTeams(formattedTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
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
      // First, get the team info to ensure it exists
      const { data: teamData, error: teamFetchError } = await supabase
        .from("teams")
        .select("id, name, description")
        .eq("id", teamId)
        .single();

      console.log("Team data:", teamData, "Team fetch error:", teamFetchError);

      if (teamFetchError) {
        console.error("Error fetching team:", teamFetchError);
        setError("Failed to find team information: " + teamFetchError.message);
        return;
      }

      if (!teamData) {
        setError("Team not found. The team may have been deleted.");
        return;
      }

      // Update invitation status
      console.log("Updating invitation status to accepted");
      const { data: inviteData, error: inviteError } = await supabase
        .from("team_invitations")
        .update({ status: "accepted" })
        .eq("id", inviteId)
        .select();

      console.log("Invitation update result:", { inviteData, inviteError });

      if (inviteError) throw inviteError;

      // Add user as team member
      console.log("Adding user as team member to team:", teamData.name);
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

      console.log("Team member insert result:", { memberData, memberError });

      if (memberError) throw memberError;

      // Refresh the lists
      console.log("Successfully accepted invitation, refreshing data");
      fetchPendingInvites();
      fetchTeams();
      setShowNotifications(false);
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
    setSelectedTeam(team);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      setLoading(true);
      console.log("Deleting team:", selectedTeam.id);

      // First delete team members
      const { error: membersError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", selectedTeam.id);

      if (membersError) {
        console.error("Error deleting team members:", membersError);
        throw membersError;
      }

      // Then delete any pending invitations
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
                  <p className="notification-team-id">
                    Team ID: {invite.team_id}
                  </p>
                </div>
                <div className="notification-actions">
                  <button
                    className="notification-accept-btn"
                    onClick={() => handleDebugAccept(invite.id, invite.team_id)}
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

      {/* Debug Information - Remove in production */}
      <div className="debug-info">
        <p>User ID: {user?.id}</p>
        <p>User Email: {user?.email}</p>
        <p>Pending Invites Count: {pendingInvites?.length || 0}</p>
        <details>
          <summary>View Team Invitations</summary>
          <div>
            <div style={{ marginBottom: "15px" }}>
              <button
                onClick={cleanupInvalidInvitations}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#FF9800",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Cleanup Invalid Invitations
              </button>
            </div>
            {pendingInvites?.length > 0 ? (
              pendingInvites?.map((invite, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "10px",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "10px",
                  }}
                >
                  <p>Invite ID: {invite.id}</p>
                  <p>Team ID: {invite.team_id}</p>
                  <p>Team Name: {invite.teams?.name || "undefined"}</p>
                  <p>Team Description: {invite.teams?.description || "none"}</p>
                  <p>Invited By: {invite.profiles?.email || "unknown"}</p>
                  <p>Status: {invite.status}</p>
                  <p>Created: {new Date(invite.created_at).toLocaleString()}</p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() =>
                        handleDebugAccept(invite.id, invite.team_id)
                      }
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "green",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Debug Accept
                    </button>
                    <button
                      onClick={() => checkTeamExists(invite.team_id)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "blue",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Check Team
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No pending invitations found</p>
            )}
          </div>
        </details>
        <details>
          <summary>View Raw Invites Data</summary>
          <pre>{JSON.stringify(pendingInvites, null, 2)}</pre>
        </details>
      </div>

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
              <div className="team-info">
                <h3>{team.name || "Unnamed Team"}</h3>
                <p className="team-id-display">ID: {team.id}</p>
                <p>{team.description || "No description available"}</p>
                <p className="team-role">
                  Your role: <span className="role-badge">{team.role}</span>
                </p>
                <div className="team-actions">
                  {(team.role === "owner" || team.role === "admin") && (
                    <button
                      className="invite-member-btn"
                      onClick={() => handleInviteClick(team)}
                    >
                      <FaUserPlus /> Invite Members
                    </button>
                  )}
                  {team.role === "owner" && (
                    <button
                      className="delete-team-btn"
                      onClick={() => handleDeleteClick(team)}
                    >
                      <FaTrash /> Delete Team
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
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
          <div className="modal-content">
            <h3>Delete Team</h3>
            <p className="delete-confirmation-message">
              Are you sure you want to delete the team "
              {selectedTeam.name || "Unnamed Team"}"? This action cannot be
              undone.
            </p>
            <p className="delete-warning">
              This will remove all team members and pending invitations.
            </p>
            <div className="modal-actions">
              <button
                className="delete-confirm-btn"
                onClick={handleDeleteTeam}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Team"}
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setSelectedTeam(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
