import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [pendingNominations, setPendingNominations] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Administrator') {
      navigate('/');
    } else {
      fetchUsers();
      fetchPendingNominations();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingNominations = async () => {
    try {
      const response = await fetch(`${API_URL}/nominations/pending`);
      const data = await response.json();
      if (data.success) setPendingNominations(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateUserStatus = async (userId, newEligibility) => {
    try {
      const response = await fetch(`${API_URL}/users/admin/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Eligibility: newEligibility })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`User ${userId} ${newEligibility === 'Approved' ? 'approved' : 'rejected'} successfully!`);
        fetchUsers();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Update failed: ' + data.error);
      }
    } catch (err) {
      setMessage('Error updating user');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`${API_URL}/users/admin/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Role: newRole })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`User ${userId} role changed to ${newRole}`);
        fetchUsers();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Update failed: ' + data.error);
      }
    } catch (err) {
      setMessage('Error updating user');
    }
  };

  const updateNominationStatus = async (nominationId, status) => {
    try {
      const response = await fetch(`${API_URL}/nominations/${nominationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approvedBy: currentUser?.fullName })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`Nomination ${status.toLowerCase()} successfully!`);
        fetchPendingNominations();
        fetchUsers();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Update failed: ' + data.error);
      }
    } catch (err) {
      setMessage('Error updating nomination');
    }
  };

  const getEligibilityColor = (eligibility) => {
    switch(eligibility) {
      case 'Approved': return '#4CAF50';
      case 'Pending': return '#FF9800';
      case 'Rejected': return '#f44336';
      default: return '#999';
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admin Management</h1>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
      </div>
      
      {message && (
        <div style={{ padding: '10px', marginBottom: '20px', backgroundColor: '#e8f5e9', color: '#155724', borderRadius: '5px' }}>
          {message}
        </div>
      )}
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: activeTab === 'users' ? '#1f2937' : '#f0f0f0',
            color: activeTab === 'users' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          👥 Manage Users ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('nominations')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: activeTab === 'nominations' ? '#1f2937' : '#f0f0f0',
            color: activeTab === 'nominations' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          📝 Pending Nominations ({pendingNominations.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h2>Manage Users</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Full Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Role</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Eligibility</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.UserID} style={{ backgroundColor: user.Eligibility === 'Rejected' ? '#ffebee' : 'white' }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.UserID}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.FullName}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.EmailAddress}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <select 
                      value={user.Role} 
                      onChange={(e) => updateUserRole(user.UserID, e.target.value)}
                      style={{ padding: '5px', borderRadius: '4px' }}
                    >
                      <option value="Voter">Voter</option>
                      <option value="Candidate">Candidate</option>
                      <option value="Administrator">Administrator</option>
                      <option value="ElectionOfficial">ElectionOfficial</option>
                      <option value="OversightOfficer">OversightOfficer</option>
                    </select>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', color: getEligibilityColor(user.Eligibility), fontWeight: 'bold' }}>
                    {user.Eligibility}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {user.Eligibility === 'Pending' && (
                      <>
                        <button 
                          onClick={() => updateUserStatus(user.UserID, 'Approved')}
                          style={{ padding: '5px 10px', marginRight: '5px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => updateUserStatus(user.UserID, 'Rejected')}
                          style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {user.Eligibility === 'Approved' && (
                      <button 
                        onClick={() => updateUserStatus(user.UserID, 'Rejected')}
                        style={{ padding: '5px 10px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Suspend
                      </button>
                    )}
                    {user.Eligibility === 'Rejected' && (
                      <button 
                        onClick={() => updateUserStatus(user.UserID, 'Approved')}
                        style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Reinstate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Nominations Tab - Pending Approvals */}
      {activeTab === 'nominations' && (
        <div>
          <h2>Pending Nominations</h2>
          {pendingNominations.length === 0 ? (
            <p>No pending nominations to review.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {pendingNominations.map(nom => (
                <div key={nom.NominationID} style={{ 
                  border: '1px solid #FF9800', 
                  borderRadius: '8px', 
                  padding: '15px', 
                  backgroundColor: '#fff3e0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0' }}>{nom.PositionName}</h3>
                      <p style={{ margin: '0 0 5px 0' }}><strong>Candidate:</strong> {nom.CandidateName}</p>
                      <p style={{ margin: '0 0 5px 0' }}><strong>Email:</strong> {nom.EmailAddress}</p>
                      <p style={{ margin: '0 0 5px 0' }}><strong>Election:</strong> {nom.ElectionName}</p>
                      <p style={{ margin: '0' }}><strong>Applied on:</strong> {new Date(nom.NominationDate).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => updateNominationStatus(nom.NominationID, 'Approved')}
                        style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        onClick={() => updateNominationStatus(nom.NominationID, 'Rejected')}
                        style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageUsersPage;