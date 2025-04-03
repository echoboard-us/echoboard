import React, { useState } from "react";
import { FaUsers, FaPlus, FaTrash, FaUserPlus } from "react-icons/fa";
import "./Teams.css";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "member",
  });

  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (newTeam.name.trim()) {
      setTeams([...teams, { ...newTeam, id: Date.now(), members: [] }]);
      setNewTeam({ name: "", description: "" });
      setShowCreateModal(false);
    }
  };

  const handleDeleteTeam = (teamId) => {
    setTeams(teams.filter((team) => team.id !== teamId));
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (newMember.name.trim() && newMember.email.trim()) {
      const updatedTeams = teams.map((team) => {
        if (team.id === selectedTeam.id) {
          return {
            ...team,
            members: [...team.members, { ...newMember, id: Date.now() }],
          };
        }
        return team;
      });
      setTeams(updatedTeams);
      setNewMember({ name: "", email: "", role: "member" });
      setShowAddMemberModal(false);
    }
  };

  const handleRemoveMember = (teamId, memberId) => {
    const updatedTeams = teams.map((team) => {
      if (team.id === teamId) {
        return {
          ...team,
          members: team.members.filter((member) => member.id !== memberId),
        };
      }
      return team;
    });
    setTeams(updatedTeams);
  };

  return (
    <div className="teams-container">
      <div className="teams-header">
        <h2>
          <FaUsers className="header-icon" /> Teams
        </h2>
        <button
          className="create-team-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <FaPlus /> Create Team
        </button>
      </div>

      {/* Teams List */}
      <div className="teams-list">
        {teams.map((team) => (
          <div key={team.id} className="team-card">
            <div className="team-info">
              <h3>{team.name}</h3>
              <p>{team.description}</p>

              {/* Members List */}
              <div className="team-members">
                <div className="members-header">
                  <h4>Members ({team.members.length})</h4>
                  <button
                    className="add-member-btn"
                    onClick={() => {
                      setSelectedTeam(team);
                      setShowAddMemberModal(true);
                    }}
                  >
                    <FaUserPlus />
                  </button>
                </div>
                <div className="members-list">
                  {team.members.map((member) => (
                    <div key={member.id} className="member-item">
                      <div className="member-info">
                        <span className="member-name">{member.name}</span>
                        <span className="member-email">{member.email}</span>
                        <span className="member-role">{member.role}</span>
                      </div>
                      <button
                        className="remove-member-btn"
                        onClick={() => handleRemoveMember(team.id, member.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              className="delete-team-btn"
              onClick={() => handleDeleteTeam(team.id)}
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Team</h3>
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
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Team Member</h3>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  placeholder="Enter member name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                  placeholder="Enter member email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newMember.role}
                  onChange={(e) =>
                    setNewMember({ ...newMember, role: e.target.value })
                  }
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-btn">
                  Add Member
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddMemberModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
