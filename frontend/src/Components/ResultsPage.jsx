import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ResultsPage = () => {
  const { electionId } = useParams();
  const [results, setResults] = useState([]);
  const [electionName, setElectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchResults();
  }, [electionId]);

  const fetchResults = async () => {
    try {
      console.log(`Fetching results for election ${electionId}`);
      const response = await fetch(`${API_URL}/results/election/${electionId}`);
      const data = await response.json();
      console.log('Results API response:', data);
      
      if (data.success && data.data && data.data.length > 0) {
        setResults(data.data);
        setElectionName(data.data[0].ElectionName);
      } else if (data.success && data.data && data.data.length === 0) {
        setError('No results available for this election yet.');
      } else {
        setError('Failed to load results');
      }
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading results...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{electionName || `Election ${electionId} Results`}</h1>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
      </div>
      
      {results.length === 0 ? (
        <p>No results available for this election yet.</p>
      ) : (
        results.map((result, index) => (
          <div key={index} style={{ 
            border: '1px solid #ccc', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: result.IsWinner === 'Y' ? '#e8f5e9' : '#fff'
          }}>
            <h3>{result.PositionName}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                backgroundColor: result.IsWinner === 'Y' ? '#4CAF50' : '#999', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontSize: '20px', 
                fontWeight: 'bold' 
              }}>
                {result.CandidateName ? result.CandidateName.charAt(0) : '?'}
              </div>
              <div style={{ flex: 1 }}>
                <p><strong>{result.CandidateName}</strong></p>
                <p>{result.TotalVotes} votes ({result.PercentageWon}%)</p>
                {result.IsWinner === 'Y' && <p style={{ color: 'green', fontWeight: 'bold' }}>✓ WINNER</p>}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ResultsPage;