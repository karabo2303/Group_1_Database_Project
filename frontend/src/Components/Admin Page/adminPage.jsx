import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, activeElections: 0, totalVotes: 0 });
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (!currentUser || currentUser.role !== "Administrator") {
      navigate("/");
    } else {
      fetchStats();
    }
  }, []);

  const fetchStats = async () => {
    try {
      console.log("Fetching stats from:", `${API_URL}/stats/admin-stats`);
      const response = await fetch(`${API_URL}/stats/admin-stats`);
      const data = await response.json();
      console.log("Stats response:", data);
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading dashboard...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>Admin Panel</h2>
        <button style={styles.menuButton} onClick={() => navigate("/create-election")}>Create Election</button>
        <button style={styles.menuButton} onClick={() => navigate("/manage-users")}>Manage Users</button>
        <button style={styles.menuButton} onClick={() => navigate("/results")}>View Results</button>
        <button style={styles.menuButton} onClick={() => navigate("/audit-logs")}>View Audit Logs</button>
        <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
      </div>
      <div style={styles.content}>
        <h1>Welcome, {currentUser?.fullName}</h1>
        <p>You are logged in as an Administrator.</p>
        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <h3>Total Users</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalUsers}</p>
          </div>
          <div style={styles.card}>
            <h3>Active Elections</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.activeElections}</p>
          </div>
          <div style={styles.card}>
            <h3>Total Votes</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalVotes}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", height: "100vh" },
  sidebar: { width: "250px", backgroundColor: "#1f2937", color: "white", padding: "20px" },
  content: { flex: 1, padding: "30px", backgroundColor: "#f3f4f6" },
  menuButton: { width: "100%", padding: "12px", marginTop: "15px", border: "none", borderRadius: "5px", cursor: "pointer" },
  logoutButton: { width: "100%", padding: "12px", marginTop: "40px", backgroundColor: "red", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  cardContainer: { display: "flex", gap: "20px", marginTop: "30px" },
  card: { backgroundColor: "white", padding: "20px", borderRadius: "10px", width: "200px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", textAlign: "center" }
};

export default AdminPage;