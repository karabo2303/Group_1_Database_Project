import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CreateElectionPage = () => {
  const [electionName, setElectionName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/elections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ElectionName: electionName, StartDateTime: startDate, EndDateTime: endDate, Status: 'Upcoming' })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('Election created successfully!');
        setTimeout(() => navigate('/admin'), 1500);
      } else {
        setMessage('Failed to create election');
      }
    } catch (err) {
      setMessage('Error creating election');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Create Election</h1>
      <button onClick={() => navigate(-1)}>← Back</button>
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div><label>Election Name:</label><input type="text" value={electionName} onChange={(e) => setElectionName(e.target.value)} required style={{ width: '100%', padding: '8px', margin: '10px 0' }} /></div>
        <div><label>Start Date:</label><input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ width: '100%', padding: '8px', margin: '10px 0' }} /></div>
        <div><label>End Date:</label><input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ width: '100%', padding: '8px', margin: '10px 0' }} /></div>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#1f2937', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Create Election</button>
      </form>
    </div>
  );
};

export default CreateElectionPage;
