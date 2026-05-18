import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CandidatePage = () => {
  const [myNominations, setMyNominations] = useState([]);
  const [hasApprovedInCurrentYear, setHasApprovedInCurrentYear] = useState(false);
  const [approvedNominationDetails, setApprovedNominationDetails] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Candidate') {
      navigate('/');
    } else {
      fetchMyNominations();
      checkApprovedStatusForCurrentYear();
    }
  }, []);

  const checkApprovedStatusForCurrentYear = async () => {
    try {
      const response = await fetch(`${API_URL}/nominations/check-approved-same-year/${currentUser.userId}/${currentYear}`);
      const data = await response.json();
      if (data.success) {
        setHasApprovedInCurrentYear(data.hasApprovedInSameYear);
        if (data.hasApprovedInSameYear && data.approvedNomination) {
          setApprovedNominationDetails(data.approvedNomination);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyNominations = async () => {
    try {
      const response = await fetch(`${API_URL}/nominations?candidateId=${currentUser.userId}`);
      const data = await response.json();
      if (data.success) {
        // Remove duplicates
        const uniqueNominations = [];
        const seen = new Set();
        
        for (const nom of data.data) {
          const key = `${nom.ElectionID}-${nom.PositionID}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueNominations.push(nom);
          }
        }
        
        setMyNominations(uniqueNominations);
      } else {
        setError('Failed to load nominations');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return { color: 'green', backgroundColor: '#e8f5e9', borderColor: '#4CAF50' };
      case 'Pending': return { color: 'orange', backgroundColor: '#fff3e0', borderColor: '#FF9800' };
      case 'Rejected': return { color: 'red', backgroundColor: '#ffebee', borderColor: '#f44336' };
      default: return { color: 'gray', backgroundColor: '#f5f5f5', borderColor: '#999' };
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading your nominations...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Candidate Dashboard</h1>
          <p>Welcome, <strong>{currentUser.fullName}</strong>!</p>
        </div>
        <div>
          <button 
            onClick={() => navigate('/apply-position')} 
            disabled={hasApprovedInCurrentYear}
            style={{ 
              padding: '10px 20px', 
              marginRight: '10px', 
              backgroundColor: hasApprovedInCurrentYear ? '#ccc' : '#2196F3', 
              color: hasApprovedInCurrentYear ? '#666' : 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: hasApprovedInCurrentYear ? 'not-allowed' : 'pointer',
              opacity: hasApprovedInCurrentYear ? 0.6 : 1
            }}
            title={hasApprovedInCurrentYear ? `You already have an approved nomination for ${currentYear}. You cannot apply for additional positions in the same year.` : ""}
          >
            📝 Apply for Position
          </button>
          <button 
            onClick={() => navigate('/candidate/profile')} 
            disabled={hasApprovedInCurrentYear}
            style={{ 
              padding: '10px 20px', 
              marginRight: '10px', 
              backgroundColor: hasApprovedInCurrentYear ? '#ccc' : '#4CAF50', 
              color: hasApprovedInCurrentYear ? '#666' : 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: hasApprovedInCurrentYear ? 'not-allowed' : 'pointer',
              opacity: hasApprovedInCurrentYear ? 0.6 : 1
            }}
            title={hasApprovedInCurrentYear ? `Your profile for ${currentYear} has been finalized. You cannot edit after approval.` : ""}
          >
            ✏️ Edit Profile
          </button>
          <button 
            onClick={handleLogout} 
            style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Business Rule Warning - Year-based */}
      {hasApprovedInCurrentYear && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          borderRadius: '5px',
          border: '1px solid #ffc107'
        }}>
          <strong>⚠️ ELECTION RULE:</strong> A candidate can only have <strong>ONE approved nomination per election year</strong>.
          {approvedNominationDetails && (
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              <p><strong>Your approved nomination for {currentYear}:</strong></p>
              <p>📌 Position: {approvedNominationDetails.PositionName}</p>
              <p>🗳️ Election: {approvedNominationDetails.ElectionName}</p>
              <p>✅ Status: {approvedNominationDetails.ApprovalStatus}</p>
            </div>
          )}
          <p style={{ marginTop: '10px' }}>
            Your profile for {currentYear} has been finalized. You cannot:
          </p>
          <ul style={{ margin: '5px 0 0 20px' }}>
            <li>Apply for additional positions in {currentYear}</li>
            <li>Edit your profile for {currentYear}</li>
          </ul>
          <p style={{ marginTop: '10px', fontSize: '12px' }}>
            Note: You can apply for positions in future election years ({currentYear + 1}, {currentYear + 2}, etc.).
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && <div style={{ padding: '10px', backgroundColor: '#ffebee', color: 'red', borderRadius: '5px', marginBottom: '20px' }}>{error}</div>}

      {/* Nominations Section */}
      <h2>My Nominations</h2>
      {myNominations.length === 0 ? (
        <p>You have not been nominated for any positions yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {myNominations.map(nom => {
            const statusStyle = getStatusColor(nom.ApprovalStatus);
            const nominationYear = nom.ElectionYear || new Date().getFullYear();
            const isCurrentYearNomination = nominationYear === currentYear;
            
            return (
              <div key={`${nom.NominationID}`} style={{ 
                border: `1px solid ${statusStyle.borderColor}`,
                borderRadius: '8px', 
                padding: '15px', 
                backgroundColor: statusStyle.backgroundColor
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{nom.PositionName}</h3>
                    <p style={{ margin: '0', color: '#555' }}>
                      <strong>Election:</strong> {nom.ElectionName} ({nom.ElectionStatus || 'Unknown'}) - {nominationYear}
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                      <strong>Applied on:</strong> {new Date(nom.NominationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span style={{ 
                      padding: '5px 12px', 
                      borderRadius: '20px', 
                      backgroundColor: statusStyle.color === 'green' ? '#4CAF50' : statusStyle.color === 'orange' ? '#FF9800' : statusStyle.color === 'red' ? '#f44336' : '#999',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {nom.ApprovalStatus}
                    </span>
                  </div>
                </div>
                {nom.ApprovalStatus === 'Pending' && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#FF9800' }}>
                    ⏳ Your nomination is awaiting admin approval.
                  </p>
                )}
                {nom.ApprovalStatus === 'Rejected' && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#f44336' }}>
                    ❌ Your nomination was not approved.
                  </p>
                )}
                {nom.ApprovalStatus === 'Approved' && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#4CAF50' }}>
                    ✅ Your nomination has been approved! You appear on the ballot.
                    {isCurrentYearNomination && hasApprovedInCurrentYear && (
                      <span> <strong>Your profile for {currentYear} has been finalized.</strong></span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidatePage;