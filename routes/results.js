// routes/results.js
const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// GET results for an election
router.get('/election/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.query(`
            SELECT 
                r.ResultID,
                u.FullName AS CandidateName,
                p.PositionName,
                r.TotalVotes,
                r.PercentageWon,
                r.IsWinner,
                e.ElectionName
            FROM Results r
            JOIN System_User u ON r.CandidateUserID = u.UserID
            JOIN BallotItem bi ON r.BallotItemID = bi.BallotItemID
            JOIN Positions p ON bi.PositionID = p.PositionID
            JOIN Election e ON r.ElectionID = e.ElectionID
            WHERE r.ElectionID = ?
            ORDER BY p.OrderOnBallot, r.TotalVotes DESC
        `, [id]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET winners only
router.get('/election/:id/winners', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.query(`
            SELECT 
                u.FullName AS CandidateName,
                p.PositionName,
                r.TotalVotes,
                r.PercentageWon
            FROM Results r
            JOIN System_User u ON r.CandidateUserID = u.UserID
            JOIN BallotItem bi ON r.BallotItemID = bi.BallotItemID
            JOIN Positions p ON bi.PositionID = p.PositionID
            WHERE r.ElectionID = ? AND r.IsWinner = 'Y'
            ORDER BY p.OrderOnBallot
        `, [id]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET election statistics
router.get('/stats/:electionId', async (req, res) => {
    try {
        const { electionId } = req.params;
        
        const [rows] = await pool.query(`
            SELECT 
                e.ElectionID,
                e.ElectionName,
                e.Status,
                COUNT(DISTINCT cv.VoteID) AS TotalVotesCast,
                (SELECT COUNT(*) FROM System_User WHERE Role = 'Voter' AND Eligibility = 'Approved') AS TotalRegisteredVoters,
                ROUND(COUNT(DISTINCT cv.VoteID) / NULLIF((SELECT COUNT(*) FROM System_User WHERE Role = 'Voter' AND Eligibility = 'Approved'), 0) * 100, 2) AS TurnoutPercentage
            FROM Election e
            LEFT JOIN CastVote cv ON e.ElectionID = cv.ElectionID
            WHERE e.ElectionID = ?
            GROUP BY e.ElectionID, e.ElectionName, e.Status
        `, [electionId]);
        
        res.json({ success: true, data: rows[0] || null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET all elections summary
router.get('/summary', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                e.ElectionID,
                e.ElectionName,
                e.Status,
                COUNT(DISTINCT cv.VoteID) AS TotalVotes,
                COUNT(DISTINCT cn.CandidateUserID) AS TotalCandidates
            FROM Election e
            LEFT JOIN CastVote cv ON e.ElectionID = cv.ElectionID
            LEFT JOIN CandidateNomination cn ON e.ElectionID = cn.ElectionID AND cn.ApprovalStatus = 'Approved'
            GROUP BY e.ElectionID, e.ElectionName, e.Status
            ORDER BY e.StartDateTime DESC
        `);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;