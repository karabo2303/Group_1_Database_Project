// routes/nominations.js
const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// GET all nominations
router.get('/', async (req, res) => {
    try {
        const { status, electionId } = req.query;
        let query = `
            SELECT cn.NominationID, cn.ElectionID, e.ElectionName, 
                   u.FullName AS CandidateName, p.PositionName, 
                   cn.ApprovalStatus, cn.ApprovedBy, cn.NominationDate
            FROM CandidateNomination cn
            JOIN System_User u ON cn.CandidateUserID = u.UserID
            JOIN Election e ON cn.ElectionID = e.ElectionID
            JOIN Positions p ON cn.PositionID = p.PositionID
        `;
        const params = [];
        
        const conditions = [];
        if (status) {
            conditions.push('cn.ApprovalStatus = ?');
            params.push(status);
        }
        if (electionId) {
            conditions.push('cn.ElectionID = ?');
            params.push(electionId);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY cn.NominationDate DESC';
        
        const [rows] = await pool.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET pending nominations
router.get('/pending', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT cn.NominationID, cn.ElectionID, e.ElectionName, 
                   u.FullName AS CandidateName, u.EmailAddress,
                   p.PositionName, cn.NominationDate
            FROM CandidateNomination cn
            JOIN System_User u ON cn.CandidateUserID = u.UserID
            JOIN Election e ON cn.ElectionID = e.ElectionID
            JOIN Positions p ON cn.PositionID = p.PositionID
            WHERE cn.ApprovalStatus = 'Pending'
            ORDER BY cn.NominationDate
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT approve or reject a nomination
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approvedBy } = req.body;
        
        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }
        
        await pool.query(
            'UPDATE CandidateNomination SET ApprovalStatus = ?, ApprovedBy = ? WHERE NominationID = ?',
            [status, approvedBy || null, id]
        );
        
        res.json({ success: true, message: `Nomination ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;