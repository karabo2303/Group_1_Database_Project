const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// GET all audit logs
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                sa.AuditID, 
                sa.UserID, 
                sa.ActionType, 
                sa.TargetEntity, 
                sa.TargetID, 
                sa.Timestamp,
                sa.IPAddress, 
                sa.Description,
                u.FullName AS UserName
            FROM SystemAuditLog sa
            LEFT JOIN System_User u ON sa.UserID = u.UserID
            ORDER BY sa.Timestamp DESC
            LIMIT 100
        `);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Audit logs error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;