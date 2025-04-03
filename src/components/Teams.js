import React, { useState } from "react";
import { 
  FaUsers, FaPlus, FaTrash, FaUserPlus, FaTimes, FaChevronDown, 
  FaProjectDiagram, FaCalendar, FaCalendarCheck
} from "react-icons/fa";
import "./Teams.css";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "member",
  });
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (newTeam.name.trim()) {
      setTeams([...teams, { 
        ...newTeam, 
        id: Date.now(), 
        members: [],
        projects: []
      }]);
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

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (newProject.name.trim() && newProject.startDate && newProject.endDate) {
      const updatedTeams = teams.map((team) => {
        if (team.id === selectedTeam.id) {
          return {
            ...team,
            projects: [
              ...team.projects,
              { 
                ...newProject, 
                id: Date.now(),
                status: "active"
              }
            ],
          };
        }
        return team;
      });
      
      // Update the main teams state
      setTeams(updatedTeams);
      
      // Update the selectedTeam state to reflect the changes
      setSelectedTeam({
        ...selectedTeam,
        projects: [
          ...selectedTeam.projects,
          { 
            ...newProject, 
            id: Date.now(),
            status: "active"
          }
        ]
      });
      
      // Reset the form
      setNewProject({ name: "", description: "", startDate: "", endDate: "" });
      
      // Close the create project modal
      setShowCreateProjectModal(false);
      
      // Open the projects list modal
      setShowProjectsModal(true);
    }
  };

  const handleDeleteProject = (teamId, projectId) => {
    const updatedTeams = teams.map((team) => {
      if (team.id === teamId) {
        return {
          ...team,
          projects: team.projects.filter((project) => project.id !== projectId),
        };
      }
      return team;
    });
    
    // Update the main teams state
    setTeams(updatedTeams);
    
    // Update the selectedTeam state to reflect the changes
    setSelectedTeam({
      ...selectedTeam,
      projects: selectedTeam.projects.filter(p => p.id !== projectId)
    });
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

              {/* Members Section */}
              <div className="team-members">
                <div className="members-header">
                  <h4>Members ({team.members.length})</h4>
                  <div className="members-actions">
                    <button
                      className="view-members-btn"
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowMembersModal(true);
                      }}
                    >
                      View Members
                    </button>
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
                </div>
              </div>

              {/* Projects Section */}
              <div className="team-projects">
                <div className="projects-header">
                  <h4>Projects ({team.projects.length})</h4>
                  <div className="projects-actions">
                    <button
                      className="view-projects-btn"
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowProjectsModal(true);
                        setShowCreateProjectModal(false);
                      }}
                    >
                      View Projects
                    </button>
                    <button
                      className="add-project-btn"
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowCreateProjectModal(true);
                        setShowProjectsModal(false);
                      }}
                    >
                      <FaProjectDiagram />
                    </button>
                  </div>
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
      {showAddMemberModal && selectedTeam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Team Member</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowAddMemberModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
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
                  <div className="custom-select">
                    <select
                      value={newMember.role}
                      onChange={(e) =>
                        setNewMember({ ...newMember, role: e.target.value })
                      }
                      required
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                    <FaChevronDown className="select-arrow" />
                  </div>
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
        </div>
      )}

      {/* Team Members Modal */}
      {showMembersModal && selectedTeam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedTeam.name} Members</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowMembersModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="members-list">
                {selectedTeam.members.map((member) => (
                  <div key={member.id} className="member-item">
                    <div className="member-info">
                      <span className="member-name">{member.name}</span>
                      <span className="member-email">{member.email}</span>
                      <span className="member-role">{member.role}</span>
                    </div>
                    <button
                      className="remove-member-btn"
                      onClick={() => {
                        handleRemoveMember(selectedTeam.id, member.id);
                        setSelectedTeam({
                          ...selectedTeam,
                          members: selectedTeam.members.filter(m => m.id !== member.id)
                        });
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="add-member-btn"
                onClick={() => {
                  setShowAddMemberModal(true);
                  setShowMembersModal(false);
                }}
              >
                Add Member
              </button>
              <button
                className="close-modal-btn"
                onClick={() => setShowMembersModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Projects Modal */}
      {showProjectsModal && selectedTeam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedTeam.name} Projects</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowProjectsModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="projects-list">
                {selectedTeam.projects.map((project) => (
                  <div key={project.id} className="project-item">
                    <div className="project-info">
                      <h4 className="project-name">{project.name}</h4>
                      <div className="project-dates">
                        <span className="start-date">
                          <FaCalendar /> Start: {new Date(project.startDate).toLocaleDateString()}
                        </span>
                        <span className="end-date">
                          <FaCalendarCheck /> End: {new Date(project.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      className="delete-project-btn"
                      onClick={() => {
                        handleDeleteProject(selectedTeam.id, project.id);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="add-project-btn"
                onClick={() => {
                  setShowCreateProjectModal(true);
                  setShowProjectsModal(false);
                }}
              >
                Add Project
              </button>
              <button
                className="close-modal-btn"
                onClick={() => setShowProjectsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProjectModal && selectedTeam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowCreateProjectModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateProject}>
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({ ...newProject, description: e.target.value })
                    }
                    placeholder="Enter project description"
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) =>
                      setNewProject({ ...newProject, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) =>
                      setNewProject({ ...newProject, endDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="submit-btn">
                    Create Project
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowCreateProjectModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
