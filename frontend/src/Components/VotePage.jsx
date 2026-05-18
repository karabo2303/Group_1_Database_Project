import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const VotePage = () => {
  const { electionId } = useParams();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchElectionDetails();
  }, []);

  const fetchElectionDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/elections/${electionId}`);
      const data = await response.json();
      if (data.success) {
        setPositions(data.data.positions || []);
      } else {
        setMessage('Failed to load election details');
      }
    } catch (err) {
      setMessage('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (positionId, candidateId) => {
    setVoting(true);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const voterToken = `VOTER_${currentUser.userId}_${Date.now()}`;

    try {
      const response = await fetch(`${API_URL}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          VoterToken: voterToken,
          ElectionID: parseInt(electionId),
          BallotItemID: positionId,
          CandidateUserID: candidateId
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('✓ Vote cast successfully!');
        setTimeout(() => navigate(`/results/${electionId}`), 1500);
      } else {
        setMessage('✗ ' + data.error);
      }
    } catch (err) {
      setMessage('✗ Error casting vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading election details...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Cast Your Vote</h1>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: message.includes('✓') ? '#d4edda' : '#f8d7da', 
          color: message.includes('✓') ? '#155724' : '#721c24', 
          borderRadius: '5px' 
        }}>
          {message}
        </div>
      )}
      
      {positions.length === 0 && !message && <p>No positions available for this election.</p>}
      
      {positions.map(position => (
        <div key={position.PositionID} style={{ 
          border: '1px solid #ccc', 
          borderRadius: '8px', 
          padding: '20px', 
          marginBottom: '20px',
          backgroundColor: '#fff'
        }}>
          <h2>{position.PositionName}</h2>
          <p>{position.Description || 'No description available'}</p>
          
          {position.Candidates && position.Candidates.length > 0 ? (
            position.Candidates.map(candidate => (
              <div key={candidate.UserID} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: '#f9f9f9',
                display: 'flex',
                gap: '15px',
                alignItems: 'center'
              }}>
                {candidate.ProfilePicture ? (
                  <img 
                    src={candidate.ProfilePicture} 
                    alt={candidate.CandidateName} 
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    backgroundColor: '#1f2937', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    fontSize: '24px' 
                  }}>
                    {candidate.CandidateName ? candidate.CandidateName.charAt(0) : '?'}
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>{candidate.CandidateName}</h3>
                  <p style={{ margin: '0 0 5px 0', color: '#555' }}>
                    {candidate.ProfileInfo || 'No manifesto provided yet.'}
                  </p>
                  <button
                    onClick={() => handleVote(position.PositionID, candidate.UserID)}
                    disabled={voting}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#1f2937', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '5px', 
                      cursor: voting ? 'not-allowed' : 'pointer',
                      marginTop: '10px'
                    }}
                  >
                    Vote for {candidate.CandidateName}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No candidates available for this position.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default VotePage;