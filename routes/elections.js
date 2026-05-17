// routes/elections.js
const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// GET all elections
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ElectionID, ElectionName, StartDateTime, EndDateTime, Status
            FROM Election
            ORDER BY StartDateTime DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET active elections
router.get('/active', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ElectionID, ElectionName, StartDateTime, EndDateTime, Status
            FROM Election
            WHERE Status = 'Active' AND StartDateTime <= NOW() AND EndDateTime >= NOW()
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET single election by ID with positions and candidates
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [electionRows] = await pool.query(
            'SELECT * FROM Election WHERE ElectionID = ?',
            [id]
        );
        
        if (electionRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Election not found' });
        }
        
        const [positionRows] = await pool.query(`
            SELECT PositionID, PositionName, Description, OrderOnBallot
            FROM Positions
            WHERE ElectionID = ?
            ORDER BY OrderOnBallot
        `, [id]);
        
        for (let position of positionRows) {
            const [candidateRows] = await pool.query(`
                SELECT u.UserID, u.FullName AS CandidateName, u.EmailAddress,
                       cn.ApprovalStatus, cn.NominationID
                FROM CandidateNomination cn
                JOIN System_User u ON cn.CandidateUserID = u.UserID
                WHERE cn.ElectionID = ? AND cn.PositionID = ?
                  AND cn.ApprovalStatus = 'Approved'
            `, [id, position.PositionID]);
            position.Candidates = candidateRows;
        }
        
        res.json({ 
            success: true, 
            data: {
                election: electionRows[0],
                positions: positionRows
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;