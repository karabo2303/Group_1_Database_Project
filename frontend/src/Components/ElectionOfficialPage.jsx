import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ElectionOfficialPage = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ElectionOfficial') {
      navigate('/');
    } else {
      fetchElections();
    }
  }, []);

  const fetchElections = async () => {
    try {
      const response = await fetch(`${API_URL}/elections`);
      const data = await response.json();
      if (data.success) {
        setElections(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateElectionStatus = async (electionId, status) => {
    try {
      const response = await fetch(`${API_URL}/elections/${electionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`Election status updated to ${status}`);
        fetchElections();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('Error updating status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return '#4CAF50';
      case 'Upcoming': return '#FF9800';
      case 'Closed': return '#f44336';
      default: return '#999';
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#1f2937' }}>Election Official Dashboard</h1>
          <p>Welcome, <strong>{currentUser.fullName}</strong>!</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {message && (
        <div style={{ padding: '10px', marginBottom: '20px', backgroundColor: '#e8f5e9', color: '#155724', borderRadius: '5px' }}>
          {message}
        </div>
      )}

      <h2>Manage Elections</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {elections.map(election => (
          <div key={election.ElectionID} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h3>{election.ElectionName}</h3>
                <p>Start: {new Date(election.StartDateTime).toLocaleString()}</p>
                <p>End: {new Date(election.EndDateTime).toLocaleString()}</p>
                <p>Status: <span style={{ color: getStatusColor(election.Status), fontWeight: 'bold' }}>{election.Status}</span></p>
              </div>
              <div>
                <select 
                  value={election.Status}
                  onChange={(e) => updateElectionStatus(election.ElectionID, e.target.value)}
                  style={{ padding: '8px', borderRadius: '5px', marginRight: '10px' }}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ElectionOfficialPage;