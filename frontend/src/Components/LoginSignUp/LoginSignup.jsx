import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // LOGIN REQUEST
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Store user data in localStorage
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          
          // Redirect based on role - UPDATED with all roles
          if (data.user.role === 'Administrator') {
            navigate('/admin');
          } else if (data.user.role === 'Voter') {
            navigate('/voter');
          } else if (data.user.role === 'Candidate') {
            navigate('/candidate');
          } else if (data.user.role === 'ElectionOfficial') {
            navigate('/official');
          } else if (data.user.role === 'OversightOfficer') {
            navigate('/oversight');
          } else {
            navigate('/');
          }
        } else {
          setError(data.error || 'Login failed. Please check your credentials.');
        }
      } else {
        // SIGNUP REQUEST
        const response = await fetch(`${API_URL}/users/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            FullName: fullName, 
            EmailAddress: email, 
            Password: password,
            Role: 'Voter'  // Default role for signup
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // After successful signup, switch to login mode
          alert('Signup successful! Please login.');
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setFullName('');
        } else {
          setError(data.error || 'Signup failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        {isLogin ? 'Login' : 'Sign Up'}
      </h2>
      
      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#ffeeee', 
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        )}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        
        <button
          type="submit"
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: loading ? '#ccc' : '#1f2937', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '10px',
            fontSize: '16px'
          }}
        >
          {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#1f2937', 
            cursor: 'pointer', 
            textDecoration: 'underline',
            fontSize: '14px'
          }}
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </div>
  );
};

export default LoginSignup;