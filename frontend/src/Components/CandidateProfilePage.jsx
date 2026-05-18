import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CandidateProfilePage = () => {
  const [profileInfo, setProfileInfo] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Candidate') {
      navigate('/');
    } else {
      setProfileInfo(currentUser.profileInfo || '');
      setProfilePicture(currentUser.profilePicture || '');
    }
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await fetch(`${API_URL}/upload/profile-picture/${currentUser.userId}`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setProfilePicture(data.imageUrl);
        setMessage('Profile picture uploaded!');
        // Update localStorage
        currentUser.profilePicture = data.imageUrl;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
    } catch (err) {
      setMessage('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${currentUser.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ProfileInfo: profileInfo, ProfilePicture: profilePicture })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('Profile updated successfully!');
        currentUser.profileInfo = profileInfo;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        setTimeout(() => navigate('/candidate'), 1500);
      } else {
        setMessage('Update failed');
      }
    } catch (err) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Edit Candidate Profile</h1>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>← Back</button>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Profile Picture:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
            {previewImage || profilePicture ? (
              <img 
                src={previewImage || profilePicture} 
                alt="Profile" 
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#f0f0f0' }}
              />
            ) : (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '40px' }}>
                {currentUser.fullName ? currentUser.fullName.charAt(0) : '?'}
              </div>
            )}
            <div>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              {uploading && <p>Uploading...</p>}
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Manifesto / Bio:</label>
          <textarea
            value={profileInfo}
            onChange={(e) => setProfileInfo(e.target.value)}
            rows="5"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Tell voters about yourself and your goals..."
          />
        </div>
        
        {message && <p style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
        
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#1f2937', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default CandidateProfilePage;