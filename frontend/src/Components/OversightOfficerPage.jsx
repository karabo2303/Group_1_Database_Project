import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OversightOfficerPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState('');
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'OversightOfficer') {
      navigate('/');
    } else {
      fetchAuditLogs();
      fetchElections();
    }
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/audit-logs`);
      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchElections = async () => {
    try {
      const response = await fetch(`${API_URL}/elections`);
      const data = await response.json();
      if (data.success) {
        setElections(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const certifyElection = async (electionId) => {
    try {
      const response = await fetch(`${API_URL}/elections/${electionId}/certify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certifiedBy: currentUser.fullName })
      });
      const data = await response.json();
      if (data.success) {
        alert('Election certified successfully!');
      }
    } catch (err) {
      alert('Error certifying election');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#1f2937' }}>Oversight Officer Dashboard</h1>
          <p>Welcome, <strong>{currentUser.fullName}</strong>!</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* Elections Section */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2>Elections to Certify</h2>
          {elections.filter(e => e.Status === 'Closed').length === 0 ? (
            <p>No closed elections awaiting certification.</p>
          ) : (
            elections.filter(e => e.Status === 'Closed').map(election => (
              <div key={election.ElectionID} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                <h3>{election.ElectionName}</h3>
                <p>Ended: {new Date(election.EndDateTime).toLocaleDateString()}</p>
                <button onClick={() => certifyElection(election.ElectionID)} style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  Certify Election Results
                </button>
              </div>
            ))
          )}
        </div>

        {/* Audit Logs Section */}
        <div style={{ flex: 2, minWidth: '500px' }}>
          <h2>Audit Logs</h2>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2', position: 'sticky', top: 0 }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>User</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Action</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Target</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 50).map(log => (
                  <tr key={log.AuditID}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.UserName || 'System'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.ActionType}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.TargetEntity}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(log.ActionTimestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OversightOfficerPage;