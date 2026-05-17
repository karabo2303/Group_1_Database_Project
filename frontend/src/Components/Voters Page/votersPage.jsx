import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockElections } from '../../data/mockData';

const VoterDashboard = () => {
  const { voter, logout, hasVotedInElection } = useAuth();
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setElections(mockElections);
      setLoading(false);
    }, 500);
  }, []);

  const filteredElections = filter === 'All' 
    ? elections 
    : elections.filter(e => e.status === filter);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return '#2e7d32';
      case 'Upcoming': return '#f9a825';
      case 'Closed': return '#757575';
      default: return '#757575';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const isElectionActive = (election) => {
    const now = new Date();
    const start = new Date(election.startDateTime);
    const end = new Date(election.endDateTime);
    return now >= start && now <= end && election.status === 'Active';
  };

  if (loading) {
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px'}}>
        <div style={{width: '50px', height: '50px', border: '5px solid #e0e0e0', borderTop: '5px solid #2e7d32', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
        <p>Loading elections...</p>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"}}>
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100}}>
        <div><h1 style={{margin: 0, fontSize: '24px', color: '#2e7d32'}}>🗳️ NWU Online Voting System</h1></div>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <span>👤 {voter?.fullName} <span style={{padding: '4px 10px', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold', background: voter?.eligibility === 'Approved' ? '#2e7d32' : '#c62828'}}>{voter?.eligibility}</span></span>
          <button onClick={() => navigate('/profile')} style={{padding: '8px 16px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'}}>Profile</button>
          <button onClick={logout} style={{padding: '8px 20px', background: '#c62828', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'}}>Logout</button>
        </div>
      </header>

      <div style={{padding: '30px 40px', background: '#e8f5e9', borderBottom: '3px solid #2e7d32'}}>
        <h2>Welcome, {voter?.fullName}! 👋</h2>
        <p>Your voting status: <strong style={{color: voter?.votedFlag === 'Y' ? '#2e7d32' : '#f9a825'}}>{voter?.votedFlag === 'Y' ? '✅ You have voted' : '⏳ You have not voted yet'}</strong></p>
      </div>

      <div style={{display: 'flex', gap: '10px', padding: '20px 40px', background: '#fff', borderBottom: '1px solid #e0e0e0'}}>
        {['All', 'Active', 'Upcoming', 'Closed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{padding: '8px 20px', border: '2px solid #2e7d32', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: filter === f ? '#2e7d32' : '#fff', color: filter === f ? '#fff' : '#333'}}>{f}</button>
        ))}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '25px', padding: '30px 40px'}}>
        {filteredElections.length === 0 ? (
          <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#999', fontSize: '18px'}}>No elections found.</div>
        ) : (
          filteredElections.map((election) => {
            const voted = hasVotedInElection(election.electionID);
            const active = isElectionActive(election);
            return (
              <div key={election.electionID} style={{background: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <span style={{padding: '5px 12px', borderRadius: '15px', color: '#fff', fontSize: '12px', fontWeight: 'bold', background: getStatusColor(election.status)}}>{election.status}</span>
                  {voted && <span style={{padding: '4px 10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'}}>✅ Voted</span>}
                </div>
                <h3 style={{margin: '0 0 15px 0', fontSize: '20px', color: '#1b5e20'}}>{election.electionName}</h3>
                <p style={{color: '#666', fontSize: '14px', marginBottom: '10px'}}>📅 {formatDate(election.startDateTime)} — {formatDate(election.endDateTime)}</p>
                <p style={{color: '#888', fontSize: '13px', marginBottom: '10px', fontStyle: 'italic'}}>📋 {election.rules}</p>
                <p style={{color: '#555', fontSize: '14px', marginBottom: '5px'}}>🏛️ {election.positions.length} position(s)</p>
                <p style={{color: '#555', fontSize: '14px', marginBottom: '15px'}}>👥 {election.positions.reduce((sum, p) => sum + p.ballotItems.length, 0)} candidates</p>
                
                {election.status === 'Active' && !voted && active && (
                  <button onClick={() => navigate(`/vote/${election.electionID}`)} style={{width: '100%', padding: '14px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto'}}>🗳️ Cast Your Vote</button>
                )}
                {election.status === 'Active' && voted && (
                  <div style={{padding: '14px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', textAlign: 'center', fontWeight: '500', marginTop: 'auto'}}>✅ You have already voted</div>
                )}
                {election.status === 'Active' && !active && (
                  <div style={{padding: '14px', background: '#fff3e0', color: '#e65100', borderRadius: '8px', textAlign: 'center', fontWeight: '500', marginTop: 'auto'}}>⏰ Election period not active</div>
                )}
                {election.status === 'Closed' && (
                  <button onClick={() => navigate(`/results/${election.electionID}`)} style={{width: '100%', padding: '14px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto'}}>📊 View Results</button>
                )}
                {election.status === 'Upcoming' && (
                  <div style={{padding: '14px', background: '#fff8e1', color: '#f9a825', borderRadius: '8px', textAlign: 'center', fontWeight: '500', marginTop: 'auto'}}>⏳ Voting opens {formatDate(election.startDateTime)}</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VoterDashboard;
