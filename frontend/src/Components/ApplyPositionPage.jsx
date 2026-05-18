import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ApplyPositionPage = () => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [selectedYear, setSelectedYear] = useState(null);
  const [positions, setPositions] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasApprovedInSameYear, setHasApprovedInSameYear] = useState(false);
  const [approvedNominationInfo, setApprovedNominationInfo] = useState(null);
  const navigate = useNavigate();
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Candidate') {
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
        // Show only upcoming and active elections
        const availableElections = data.data.filter(e => e.Status !== 'Closed');
        setElections(availableElections);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkExistingApprovalsForYear = async (year) => {
    try {
      const response = await fetch(`${API_URL}/nominations/check-approved-same-year/${currentUser.userId}/${year}`);
      const data = await response.json();
      if (data.success && data.hasApprovedInSameYear) {
        setHasApprovedInSameYear(true);
        setApprovedNominationInfo(data.approvedNomination);
      } else {
        setHasApprovedInSameYear(false);
        setApprovedNominationInfo(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPositions = async (electionId) => {
    try {
      const response = await fetch(`${API_URL}/elections/${electionId}`);
      const data = await response.json();
      if (data.success) {
        setPositions(data.data.positions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleElectionChange = async (e) => {
    const electionId = e.target.value;
    setSelectedElection(electionId);
    setSelectedPosition('');
    
    if (electionId) {
      // Get election year
      const election = elections.find(el => el.ElectionID.toString() === electionId);
      if (election) {
        const year = new Date(election.StartDateTime).getFullYear();
        setSelectedYear(year);
        await checkExistingApprovalsForYear(year);
      }
      await fetchPositions(electionId);
    } else {
      setPositions([]);
      setHasApprovedInSameYear(false);
      setSelectedYear(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Get next NominationID
      const maxIdResponse = await fetch(`${API_URL}/nominations/max-id`);
      const maxIdData = await maxIdResponse.json();
      const newNominationId = (maxIdData.maxId || 0) + 1;

      const response = await fetch(`${API_URL}/nominations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          NominationID: newNominationId,
          ElectionID: selectedElection,
          CandidateUserID: currentUser.userId,
          PositionID: selectedPosition,
          ApprovalStatus: 'Pending',
          NominationDate: new Date().toISOString().split('T')[0]
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('✓ Application submitted successfully! Awaiting admin approval.');
        setTimeout(() => navigate('/candidate'), 2000);
      } else {
        setMessage('✗ ' + data.error);
      }
    } catch (err) {
      setMessage('✗ Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  if (hasApprovedInSameYear) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h1>Cannot Apply</h1>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ⚠️ <strong>You already have an approved nomination for {selectedYear}.</strong>
          {approvedNominationInfo && (
            <div style={{ marginTop: '10px' }}>
              <p><strong>Position:</strong> {approvedNominationInfo.PositionName}</p>
              <p><strong>Election:</strong> {approvedNominationInfo.ElectionName}</p>
              <p><strong>Status:</strong> {approvedNominationInfo.ApprovalStatus}</p>
            </div>
          )}
          <p style={{ marginTop: '15px' }}>
            According to election rules, a candidate can only have ONE approved nomination per election year.
          </p>
          <p>You cannot apply for another position in {selectedYear}.</p>
        </div>
        <button onClick={() => navigate('/candidate')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Apply for Position</h1>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Select Election:</label>
          <select 
            value={selectedElection} 
            onChange={handleElectionChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">-- Select Election --</option>
            {elections.map(e => (
              <option key={e.ElectionID} value={e.ElectionID}>
                {e.ElectionName} ({e.Status}) - {new Date(e.StartDateTime).getFullYear()}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Select Position:</label>
          <select 
            value={selectedPosition} 
            onChange={(e) => setSelectedPosition(e.target.value)}
            required
            disabled={!selectedElection}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">-- Select Position --</option>
            {positions.map(p => (
              <option key={p.PositionID} value={p.PositionID}>
                {p.PositionName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Manifesto / Why should voters choose you?:</label>
          <textarea
            value={manifesto}
            onChange={(e) => setManifesto(e.target.value)}
            rows="5"
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Tell voters about yourself, your goals, and why they should vote for you..."
          />
        </div>

        {message && <p style={{ color: message.includes('✓') ? 'green' : 'red' }}>{message}</p>}

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: loading ? '#ccc' : '#2196F3', 
            color: loading ? '#666' : 'white',
            border: 'none', 
            borderRadius: '5px', 
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default ApplyPositionPage;