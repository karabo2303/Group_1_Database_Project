import React from "react";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const navigate = useNavigate();

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
  );

  // SECURITY CHECK
  if (
    !currentUser ||
    currentUser.role !== "Administrator"
  ) {
    navigate("/");
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>Admin Panel</h2>

        <button style={styles.menuButton}>
          Create Election
        </button>

        <button style={styles.menuButton}>
          Manage Users
        </button>

        <button style={styles.menuButton}>
          View Results
        </button>

        <button style={styles.menuButton}>
          Audit Logs
        </button>

        <button
          style={styles.logoutButton}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div style={styles.content}>
        <h1>
          Welcome, {currentUser?.fullName}
        </h1>

        <p>
          You are logged in as an Administrator.
        </p>

        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <h3>Total Users</h3>
            <p>120</p>
          </div>

          <div style={styles.card}>
            <h3>Active Elections</h3>
            <p>3</p>
          </div>

          <div style={styles.card}>
            <h3>Total Votes</h3>
            <p>540</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
  },

  sidebar: {
    width: "250px",
    backgroundColor: "#1f2937",
    color: "white",
    padding: "20px",
  },

  content: {
    flex: 1,
    padding: "30px",
    backgroundColor: "#f3f4f6",
  },

  menuButton: {
    width: "100%",
    padding: "12px",
    marginTop: "15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  logoutButton: {
    width: "100%",
    padding: "12px",
    marginTop: "40px",
    backgroundColor: "red",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  cardContainer: {
    display: "flex",
    gap: "20px",
    marginTop: "30px",
  },

  card: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "200px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
};

export default AdminPage;
