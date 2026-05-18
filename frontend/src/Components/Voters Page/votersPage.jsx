import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VotersPage.css';

const API_URL = 'http://localhost:3000/api';

function VotersPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active elections
  const [activeElections, setActiveElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);

  // Voting state
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Vote history
  const [voteHistory, setVoteHistory] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (!storedUser) {
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Redirect admin/election officials to admin page
    if (storedRole === 'Administrator' || storedRole === 'ElectionOfficial') {
      navigate('/admin');
      return;
    }

    fetchVoterData(parsedUser.userId);
  }, [navigate]);

  const fetchVoterData = async (userId) => {
    setLoading(true);
    try {
      // Fetch active elections
      const electionsRes = await fetch(`${API_URL}/elections/active`);
      const electionsData = await electionsRes.json();
      if (electionsData.success) {
        setActiveElections(electionsData.elections);
      }

      // Fetch vote history
      const historyRes = await fetch(`${API_URL}/users/${userId}/votes`);
      const historyData = await historyRes.json();
      if (historyData.success) {
        setVoteHistory(historyData.votes);
      }
    } catch (err) {
      setError('Failed to load voter data');
    } finally {
      setLoading(false);
    }
  };

  const handleElectionSelect = async (election) => {
    setSelectedElection(election);
    setSelectedCandidate(null);
    setError('');
    setSuccess('');

    setLoading(true);
    try {
      // Check if user already voted in this election
      const checkRes = await fetch(`${API_URL}/elections/${election.electionId}/check-vote?userId=${user.userId}`);
      const checkData = await checkRes.json();

      if (checkData.hasVoted) {
        setHasVoted(true);
        setCandidates([]);
      } else {
        setHasVoted(false);
        // Fetch candidates for this election
        const candidatesRes = await fetch(`${API_URL}/elections/${election.electionId}/candidates`);
        const candidatesData = await candidatesRes.json();
        if (candidatesData.success) {
          setCandidates(candidatesData.candidates);
        }
      }
    } catch {
      setError('Failed to load election details');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setError('');
  };

  const handleVoteSubmit = async () => {
    if (!selectedCandidate || !selectedElection) {
      setError('Please select a candidate');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmVote = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electionId: selectedElection.electionId,
          candidateId: selectedCandidate.candidateId,
          userId: user.userId,
          timestamp: new Date().toISOString()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to submit vote');
        return;
      }

      setSuccess('Your vote has been recorded successfully! Thank you for participating.');
      setHasVoted(true);
      setSelectedCandidate(null);

      // Refresh vote history
      fetchVoterData(user.userId);
    } catch {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getElectionStatus = (election) => {
    const now = new Date();
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);

    if (now < start) return { text: 'Upcoming', class: 'status-upcoming' };
    if (now > end) return { text: 'Ended', class: 'status-ended' };
    return { text: 'Active', class: 'status-active' };
  };

  return (
    <div className="voters-page">
      {/* Header */}
      <header className="voters-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>Online Voting System</h1>
            <span className="header-badge">Voter Portal</span>
          </div>
          <div className="user-section">
            <div className="user-profile">
              <div className="avatar">
                {user?.fullName?.charAt(0).toUpperCase() || 'V'}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.fullName}</span>
                <span className="user-role">Registered Voter</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="voters-main">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="voters-layout">
          {/* Left Panel - Elections List */}
          <aside className="elections-panel">
            <h2>Available Elections</h2>
            <div className="elections-list">
              {activeElections.map((election) => {
                const status = getElectionStatus(election);
                const isSelected = selectedElection?.electionId === election.electionId;

                return (
                  <div 
                    key={election.electionId}
                    className={`election-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleElectionSelect(election)}
                  >
                    <div className="election-card-header">
                      <h3>{election.electionName}</h3>
                      <span className={`election-status ${status.class}`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="election-position">{election.position}</p>
                    <div className="election-dates">
                      <span>📅 {formatDate(election.startDate)}</span>
                      <span>→ {formatDate(election.endDate)}</span>
                    </div>
                    {election.description && (
                      <p className="election-description">{election.description}</p>
                    )}
                  </div>
                );
              })}
              {activeElections.length === 0 && (
                <div className="no-elections">
                  <span className="no-data-icon">📭</span>
                  <p>No active elections at this time</p>
                </div>
              )}
            </div>
          </aside>

          {/* Right Panel - Voting Area */}
          <section className="voting-panel">
            {!selectedElection ? (
              <div className="empty-state">
                <div className="empty-icon">🗳️</div>
                <h3>Select an Election</h3>
                <p>Choose an election from the list to view candidates and cast your vote</p>
              </div>
            ) : (
              <div className="voting-container">
                <div className="voting-header">
                  <h2>{selectedElection.electionName}</h2>
                  <p className="voting-position">{selectedElection.position}</p>
                  <div className="voting-timer">
                    <span className="timer-label">Election ends:</span>
                    <span className="timer-value">{formatDate(selectedElection.endDate)}</span>
                  </div>
                </div>

                {hasVoted ? (
                  <div className="voted-state">
                    <div className="voted-icon">✓</div>
                    <h3>You have already voted in this election</h3>
                    <p>Thank you for participating in the democratic process</p>
                    <div className="voted-badge">Vote Recorded</div>
                  </div>
                ) : (
                  <>
                    <h3 className="candidates-title">Select a Candidate</h3>
                    <div className="candidates-grid">
                      {candidates.map((candidate) => (
                        <div 
                          key={candidate.candidateId}
                          className={`candidate-card ${selectedCandidate?.candidateId === candidate.candidateId ? 'selected' : ''}`}
                          onClick={() => handleCandidateSelect(candidate)}
                        >
                          <div className="candidate-avatar">
                            {candidate.candidateName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="candidate-info">
                            <h4>{candidate.candidateName}</h4>
                            {candidate.party && <span className="candidate-party">{candidate.party}</span>}
                            {candidate.manifesto && (
                              <p className="candidate-manifesto">{candidate.manifesto}</p>
                            )}
                          </div>
                          <div className="selection-indicator">
                            {selectedCandidate?.candidateId === candidate.candidateId && (
                              <span className="selected-check">✓</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {candidates.length === 0 && (
                        <div className="no-candidates">
                          <p>No candidates registered for this election yet</p>
                        </div>
                      )}
                    </div>

                    {selectedCandidate && (
                      <div className="vote-action">
                        <div className="selected-info">
                          <span>You have selected:</span>
                          <strong>{selectedCandidate.candidateName}</strong>
                        </div>
                        <button 
                          className="vote-button"
                          onClick={handleVoteSubmit}
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : 'Cast Your Vote'}
                        </button>
                        <p className="vote-warning">
                          ⚠️ Your vote is final and cannot be changed once submitted
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Vote History Section */}
        {voteHistory.length > 0 && (
          <section className="history-section">
            <h2>Your Voting History</h2>
            <div className="history-grid">
              {voteHistory.map((vote, index) => (
                <div key={index} className="history-card">
                  <div className="history-header">
                    <h4>{vote.electionName}</h4>
                    <span className="history-date">{formatDate(vote.timestamp)}</span>
                  </div>
                  <p className="history-position">{vote.position}</p>
                  <div className="history-vote">
                    <span className="vote-label">You voted for:</span>
                    <span className="vote-candidate">{vote.candidateName}</span>
                  </div>
                  <div className="vote-token">
                    <span>Token: {vote.voteToken}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Your Vote</h3>
            </div>
            <div className="modal-body">
              <p className="confirm-text">
                You are about to vote for:
              </p>
              <div className="confirm-candidate">
                <strong>{selectedCandidate?.candidateName}</strong>
                <span>{selectedElection?.position}</span>
              </div>
              <div className="confirm-warning">
                <span className="warning-icon">⚠️</span>
                <p>This action cannot be undone. Your vote is anonymous and will be securely recorded.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-button confirm"
                onClick={confirmVote}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Confirm Vote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VotersPage;
