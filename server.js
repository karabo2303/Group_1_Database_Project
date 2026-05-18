const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const electionRoutes = require('./routes/elections');
const userRoutes = require('./routes/users');
const voteRoutes = require('./routes/votes');
const resultRoutes = require('./routes/results');
const nominationRoutes = require('./routes/nominations');
const statsRoutes = require('./routes/stats');
const uploadRoutes = require('./routes/upload');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = 3000;

// CORS - Allow all origins
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('frontend/public/uploads'));

// Health check
app.get('/api/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({ status: 'OK', database: dbConnected ? 'connected' : 'disconnected' });
});

// ============================================================
// ALL API ROUTES GO HERE (BEFORE 404 HANDLER)
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/nominations', nominationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/uploads', express.static('frontend/public/uploads'));

// 404 handler (must be AFTER all routes)
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Stats: http://localhost:${PORT}/api/stats/admin-stats`);
});