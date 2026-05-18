import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      console.log('Fetching audit logs...');
      const response = await fetch(`${API_URL}/audit-logs`);
      const data = await response.json();
      console.log('Audit logs response:', data);
      
      if (data.success) {
        setLogs(data.data || []);
      } else {
        setError('Failed to load audit logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading audit logs...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Audit Logs</h1>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
      </div>
      
      {logs.length === 0 ? (
        <p>No audit logs available.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>User</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Action</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Target</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Timestamp</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.AuditID}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.AuditID}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.UserName || 'System'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.ActionType}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.TargetEntity}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(log.ActionTimestamp).toLocaleString()}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.IPAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AuditLogsPage;