import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

const API_URL = 'http://localhost:3000/api';

function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Election Management State
  const [elections, setElections] = useState([]);
  const [showElectionForm, setShowElectionForm] = useState(false);
  const [electionForm, setElectionForm] = useState({
    electionName: '',
    position: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  // User Management State
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  // Candidate Management State
  const [candidates, setCandidates] = useState([]);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    fullName: '',
    electionId: '',
    positionId: '',
    manifesto: ''
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  // Results State
  const [results, setResults] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (!storedUser || !storedRole) {
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setRole(storedRole);

    if (storedRole !== 'Administrator' && storedRole !== 'ElectionOfficial') {
      navigate('/voters');
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch elections
      const electionsRes = await fetch(`${API_URL}/elections`);
      const electionsData = await electionsRes.json();
      if (electionsData.success) setElections(electionsData.elections);

      // Fetch users
      const usersRes = await fetch(`${API_URL}/users`);
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.users);
        setPendingUsers(usersData.users.filter(u => u.status === 'Pending'));
      }

      // Fetch candidates
      const candidatesRes = await fetch(`${API_URL}/candidates`);
      const candidatesData = await candidatesRes.json();
      if (candidatesData.success) setCandidates(candidatesData.candidates);

      // Fetch audit logs
      const logsRes = await fetch(`${API_URL}/audit-logs`);
      const logsData = await logsRes.json();
      if (logsData.success) setAuditLogs(logsData.logs);

      // Fetch results
      const resultsRes = await fetch(`${API_URL}/results`);
      const resultsData = await resultsRes.json();
      if (resultsData.success) setResults(resultsData.results);

    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/');
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!electionForm.electionName.trim() || !electionForm.position.trim() || 
        !electionForm.startDate || !electionForm.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(electionForm.startDate) >= new Date(electionForm.endDate)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/elections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(electionForm)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create election');
        return;
      }

      setSuccess('Election created successfully!');
      setShowElectionForm(false);
      setElectionForm({ electionName: '', position: '', startDate: '', endDate: '', description: '' });
      fetchDashboardData();
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('User approved successfully');
        fetchDashboardData();
      } else {
        setError(data.error || 'Failed to approve user');
      }
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user?')) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('User rejected');
        fetchDashboardData();
      } else {
        setError(data.error || 'Failed to reject user');
      }
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteElection = async (electionId) => {
    if (!window.confirm('Are you sure you want to delete this election? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/elections/${electionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('Election deleted successfully');
        fetchDashboardData();
      } else {
        setError(data.error || 'Failed to delete election');
      }
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'status-active';
      case 'Pending': return 'status-pending';
      case 'Completed': return 'status-completed';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-grid">
      <div className="stat-card">
        <div className="stat-icon">🗳️</div>
        <div className="stat-content">
          <h3>{elections.length}</h3>
          <p>Total Elections</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">👥</div>
        <div className="stat-content">
          <h3>{users.length}</h3>
          <p>Registered Users</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">⏳</div>
        <div className="stat-content">
          <h3>{pendingUsers.length}</h3>
          <p>Pending Approvals</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📝</div>
        <div className="stat-content">
          <h3>{candidates.length}</h3>
          <p>Candidates</p>
        </div>
      </div>

      <div className="dashboard-section wide">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {auditLogs.slice(0, 5).map((log, index) => (
            <div key={index} className="activity-item">
              <span className="activity-time">{formatDate(log.timestamp)}</span>
              <span className="activity-action">{log.actionType}</span>
              <span className="activity-user">by {log.userName || 'System'}</span>
            </div>
          ))}
          {auditLogs.length === 0 && <p className="no-data">No recent activity</p>}
        </div>
      </div>
    </div>
  );

  const renderElections = () => (
    <div className="management-section">
      <div className="section-header">
        <h2>Election Management</h2>
        {role === 'Administrator' && (
          <button 
            className="action-button primary"
            onClick={() => setShowElectionForm(!showElectionForm)}
          >
            {showElectionForm ? 'Cancel' : '+ Create Election'}
          </button>
        )}
      </div>

      {showElectionForm && (
        <form onSubmit={handleCreateElection} className="admin-form">
          <h3>Create New Election</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Election Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Student Council 2026"
                value={electionForm.electionName}
                onChange={(e) => setElectionForm({...electionForm, electionName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Position *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., President"
                value={electionForm.position}
                onChange={(e) => setElectionForm({...electionForm, position: e.target.value})}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={electionForm.startDate}
                onChange={(e) => setElectionForm({...electionForm, startDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={electionForm.endDate}
                onChange={(e) => setElectionForm({...electionForm, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input textarea"
              placeholder="Election description and rules..."
              rows="3"
              value={electionForm.description}
              onChange={(e) => setElectionForm({...electionForm, description: e.target.value})}
            />
          </div>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create Election'}
          </button>
        </form>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Election ID</th>
              <th>Name</th>
              <th>Position</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {elections.map((election) => (
              <tr key={election.electionId}>
                <td>{election.electionId}</td>
                <td>{election.electionName}</td>
                <td>{election.position}</td>
                <td>{formatDate(election.startDate)}</td>
                <td>{formatDate(election.endDate)}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(election.status)}`}>
                    {election.status}
                  </span>
                </td>
                <td>
                  {role === 'Administrator' && (
                    <button 
                      className="icon-button delete"
                      onClick={() => handleDeleteElection(election.electionId)}
                      title="Delete Election"
                    >
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {elections.length === 0 && (
              <tr>
                <td colSpan="7" className="no-data">No elections found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="management-section">
      <div className="section-header">
        <h2>User Management</h2>
      </div>

      <h3>Pending Approvals</h3>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role Requested</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user) => (
              <tr key={user.userId}>
                <td>{user.userId}</td>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{formatDate(user.registrationDate)}</td>
                <td>
                  <button 
                    className="icon-button approve"
                    onClick={() => handleApproveUser(user.userId)}
                    title="Approve User"
                  >
                    ✓
                  </button>
                  <button 
                    className="icon-button reject"
                    onClick={() => handleRejectUser(user.userId)}
                    title="Reject User"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {pendingUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="no-data">No pending approvals</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3>All Users</h3>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Eligibility</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId}>
                <td>{user.userId}</td>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.eligibility ? '✓ Eligible' : '✗ Not Eligible'}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" className="no-data">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="management-section">
      <div className="section-header">
        <h2>System Audit Logs</h2>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action Type</th>
              <th>Election ID</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log, index) => (
              <tr key={index}>
                <td>{log.logId || index + 1}</td>
                <td>{formatDate(log.timestamp)}</td>
                <td>{log.userName || 'System'}</td>
                <td>
                  <span className={`action-badge ${log.actionType?.toLowerCase().replace(' ', '-')}`}>
                    {log.actionType}
                  </span>
                </td>
                <td>{log.electionId || 'N/A'}</td>
                <td className="log-details">{log.details || 'No additional details'}</td>
              </tr>
            ))}
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan="6" className="no-data">No audit logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="management-section">
      <div className="section-header">
        <h2>Election Results</h2>
      </div>
      <div className="results-grid">
        {results.map((result, index) => (
          <div key={index} className="result-card">
            <h3>{result.electionName}</h3>
            <p className="result-position">{result.position}</p>
            <div className="result-stats">
              <div className="stat">
                <span className="stat-value">{result.totalVotes}</span>
                <span className="stat-label">Total Votes</span>
              </div>
              <div className="stat">
                <span className="stat-value">{result.voterTurnout}%</span>
                <span className="stat-label">Turnout</span>
              </div>
            </div>
            <div className="candidate-results">
              {result.candidates?.map((candidate, idx) => (
                <div key={idx} className="candidate-result-bar">
                  <div className="candidate-info">
                    <span className="candidate-name">{candidate.name}</span>
                    <span className="candidate-votes">{candidate.voteCount} votes ({candidate.percentage}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{width: `${candidate.percentage}%`}}
                    />
                  </div>
                </div>
              ))}
            </div>
            {result.winner && (
              <div className="winner-badge">
                🏆 Winner: {result.winner}
              </div>
            )}
          </div>
        ))}
        {results.length === 0 && (
          <p className="no-data">No results available yet</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>OVS Admin</h2>
          <span className="role-badge">{role}</span>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'elections' ? 'active' : ''}`}
            onClick={() => setActiveTab('elections')}
          >
            <span className="nav-icon">🗳️</span>
            Elections
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            Users
          </button>
          <button 
            className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <span className="nav-icon">📋</span>
            Audit Logs
          </button>
          <button 
            className={`nav-item ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <span className="nav-icon">📈</span>
            Results
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.fullName}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>
            {activeTab === 'dashboard' && 'Admin Dashboard'}
            {activeTab === 'elections' && 'Election Management'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'audit' && 'System Audit Logs'}
            {activeTab === 'results' && 'Election Results'}
          </h1>
        </header>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="content-body">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'elections' && renderElections()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'audit' && renderAuditLogs()}
          {activeTab === 'results' && renderResults()}
        </div>
      </main>
    </div>
  );
}

export default AdminPage;
