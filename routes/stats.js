const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

router.get('/admin-stats', async (req, res) => {
    try {
        // Total users (ALL users, not just voters)
        const [totalUsers] = await pool.query("SELECT COUNT(*) AS count FROM System_User");
        
        // Active elections (where Status = 'Active' AND current date is between start and end)
        const [activeElections] = await pool.query(`
            SELECT COUNT(*) AS count FROM Election 
            WHERE Status = 'Active' AND StartDateTime <= NOW() AND EndDateTime >= NOW()
        `);
        
        // Total votes cast
        const [totalVotes] = await pool.query("SELECT COUNT(*) AS count FROM CastVote");
        
        res.json({
            success: true,
            data: {
                totalUsers: totalUsers[0].count,
                activeElections: activeElections[0].count,
                totalVotes: totalVotes[0].count
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;