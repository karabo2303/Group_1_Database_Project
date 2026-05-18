import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VotersPage = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchAllElections();
  }, []);

  const fetchAllElections = async () => {
    try {
      const response = await fetch(`${API_URL}/elections`);
      const data = await response.json();
      if (data.success) {
        setElections(data.data);
      } else {
        setError('Failed to load elections');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (electionId) => {
    navigate(`/vote/${electionId}`);
  };

  const handleViewResults = (electionId) => {
    navigate(`/results/${electionId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return { color: 'green', fontWeight: 'bold' };
      case 'Closed': return { color: 'red' };
      case 'Upcoming': return { color: 'orange' };
      default: return { color: 'gray' };
    }
  };

  const getVoteButtonStyle = (status) => {
    const isActive = status === 'Active';
    return {
      padding: '10px',
      marginRight: '10px',
      backgroundColor: isActive ? '#1f2937' : '#cccccc',
      color: isActive ? 'white' : '#666666',
      border: 'none',
      borderRadius: '4px',
      cursor: isActive ? 'pointer' : 'not-allowed',
      opacity: isActive ? 1 : 0.6
    };
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading elections...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Elections</h1>
        <button 
          onClick={handleLogout}
          style={{ padding: '8px 16px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
      
      {currentUser?.fullName && <p>Welcome, {currentUser.fullName}!</p>}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
        {elections.length === 0 ? (
          <p>No elections available at this time.</p>
        ) : (
          elections.map(election => (
            <div key={election.ElectionID} style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '20px',
              width: '300px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              backgroundColor: '#fff'
            }}>
              <h2>{election.ElectionName}</h2>
              <p>Status: <span style={getStatusColor(election.Status)}>{election.Status}</span></p>
              <p>Start: {new Date(election.StartDateTime).toLocaleString()}</p>
              <p>End: {new Date(election.EndDateTime).toLocaleString()}</p>
              <div style={{ marginTop: '15px' }}>
                <button
                  onClick={() => handleVote(election.ElectionID)}
                  disabled={election.Status !== 'Active'}
                  style={getVoteButtonStyle(election.Status)}
                >
                  Cast Vote
                </button>
                <button
                  onClick={() => handleViewResults(election.ElectionID)}
                  style={{
                    padding: '10px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  View Results
                </button>
              </div>
              {election.Status !== 'Active' && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  {election.Status === 'Closed' ? 'Voting has ended for this election.' : 'Voting has not started yet.'}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VotersPage;
