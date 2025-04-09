import React, { useState, useEffect } from "react";
import { FaSearch, FaTimes, FaUserPlus } from "react-icons/fa";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "./TeamInvite.css";

const TeamInvite = ({ teamId, teamName, onClose }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searching, setSearching] = useState(false);

  // Search for users as you type
  useEffect(() => {
    const searchUsers = async (query) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        console.log("Searching for users with query:", query);
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email")
          .ilike("email", `%${query}%`)
          .limit(10);

        if (error) {
          console.error("Error searching for users:", error);
          throw error;
        }

        console.log("Search results:", data);

        // Filter out the current user and already selected users
        const filteredResults = data.filter(
          (result) =>
            result.id !== user.id &&
            !selectedUsers.some((selected) => selected.id === result.id)
        );

        console.log(
          "Filtered results (excluding current user and selected):",
          filteredResults
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Error in searchUsers:", error);
        setError(error.message);
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user.id, selectedUsers]);

  const handleInviteUsers = async () => {
    if (!selectedUsers.length) {
      setError("Please select at least one user to invite.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log("Starting invitation process for users:", selectedUsers);
      console.log("Team ID:", teamId);
      console.log("Current user (inviter):", user.id);

      let successCount = 0;
      let failCount = 0;

      // For each selected user, check if they have an existing invitation
      for (const invitedUser of selectedUsers) {
        console.log("Processing invitation for user:", invitedUser);
        console.log("Invited user ID:", invitedUser.id);
        console.log("Invited user email:", invitedUser.email);

        try {
          // Check for existing invitation
          const { data: existingInvite, error: checkError } = await supabase
            .from("team_invitations")
            .select("id, status")
            .eq("team_id", teamId)
            .eq("invited_user", invitedUser.id)
            .single();

          console.log("Existing invite check:", { existingInvite, checkError });

          if (checkError && checkError.code !== "PGRST116") {
            // PGRST116 is "no rows returned"
            console.error(
              "Error checking for existing invitation:",
              checkError
            );
            failCount++;
            continue;
          }

          if (existingInvite) {
            console.log("Updating existing invitation:", existingInvite.id);
            // If invitation exists, update it to pending
            const { data: updated, error: updateError } = await supabase
              .from("team_invitations")
              .update({
                status: "pending",
                invited_by: user.id,
                created_at: new Date().toISOString(),
              })
              .eq("id", existingInvite.id)
              .select();

            console.log("Update result:", { updated, updateError });
            if (updateError) {
              console.error("Error updating invitation:", updateError);
              failCount++;
              continue;
            }
            successCount++;
          } else {
            console.log("Creating new invitation for user:", invitedUser.id);
            console.log("Invitation data:", {
              team_id: teamId,
              invited_by: user.id,
              invited_user: invitedUser.id,
              status: "pending",
            });

            // If no invitation exists, create a new one
            const { data: inserted, error: insertError } = await supabase
              .from("team_invitations")
              .insert([
                {
                  team_id: teamId,
                  invited_by: user.id,
                  invited_user: invitedUser.id,
                  status: "pending",
                  created_at: new Date().toISOString(),
                },
              ])
              .select();

            console.log("Insert result:", { inserted, insertError });
            if (insertError) {
              console.error("Error creating invitation:", insertError);
              failCount++;
              continue;
            }
            successCount++;
          }
        } catch (userError) {
          console.error(
            `Error processing user ${invitedUser.email}:`,
            userError
          );
          failCount++;
        }
      }

      console.log(
        "Invitation process completed. Success:",
        successCount,
        "Failed:",
        failCount
      );

      if (successCount > 0 && failCount === 0) {
        setSuccessMessage(`Successfully sent ${successCount} invitations.`);
        setTimeout(() => {
          setSelectedUsers([]);
          onClose();
        }, 2000);
      } else if (successCount > 0 && failCount > 0) {
        setSuccessMessage(
          `Sent ${successCount} invitations, but ${failCount} failed.`
        );
      } else {
        setError("Failed to send invitations. Please try again.");
      }
    } catch (err) {
      console.error("Error sending invitations:", err);
      setError("Failed to send invitations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  return (
    <div className="team-invite-container">
      <div className="invite-header">
        <h3>Invite to {teamName}</h3>
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="search-results">
        {loading ? (
          <div className="loading">Searching...</div>
        ) : searchResults.length > 0 ? (
          searchResults.map((user) => (
            <div
              key={user.id}
              className={`user-result ${
                selectedUsers.find((u) => u.id === user.id) ? "selected" : ""
              }`}
              onClick={() => toggleUserSelection(user)}
            >
              <div className="user-info">
                <div className="user-name">
                  {user.full_name || "Unnamed User"}
                </div>
                <div className="user-email">{user.email}</div>
              </div>
              <FaUserPlus className="add-user-icon" />
            </div>
          ))
        ) : (
          searchQuery && <div className="no-results">No users found</div>
        )}
      </div>

      {selectedUsers.length > 0 && (
        <div className="selected-users">
          <h4>Selected Users ({selectedUsers.length})</h4>
          <div className="selected-users-list">
            {selectedUsers.map((user) => (
              <div key={user.id} className="selected-user-chip">
                <span>{user.email}</span>
                <button onClick={() => toggleUserSelection(user)}>
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="invite-actions">
        <button className="cancel-btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="invite-btn"
          onClick={handleInviteUsers}
          disabled={!selectedUsers.length || loading}
        >
          {loading
            ? "Sending..."
            : `Invite ${selectedUsers.length} user${
                selectedUsers.length !== 1 ? "s" : ""
              }`}
        </button>
      </div>
    </div>
  );
};

export default TeamInvite;
