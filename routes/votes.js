// routes/votes.js
const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// POST cast a vote
router.post('/', async (req, res) => {
    try {
        const { VoterToken, ElectionID, BallotItemID, CandidateUserID } = req.body;
        
        if (!VoterToken || !ElectionID || !BallotItemID || !CandidateUserID) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }
        
        // Check if already voted
        const [existingVotes] = await pool.query(
            'SELECT COUNT(*) AS count FROM CastVote WHERE VoterToken = ? AND ElectionID = ?',
            [VoterToken, ElectionID]
        );
        
        if (existingVotes[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'You have already voted in this election' 
            });
        }
        
        // Check election status
        const [electionRows] = await pool.query(
            'SELECT Status, StartDateTime, EndDateTime FROM Election WHERE ElectionID = ?',
            [ElectionID]
        );
        
        if (electionRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Election not found' });
        }
        
        const election = electionRows[0];
        const now = new Date();
        
        if (election.Status !== 'Active') {
            return res.status(400).json({ success: false, error: 'This election is not active' });
        }
        
        if (now < new Date(election.StartDateTime) || now > new Date(election.EndDateTime)) {
            return res.status(400).json({ success: false, error: 'Voting is not allowed at this time' });
        }
        
        // Get next VoteID
        const [maxIdRows] = await pool.query('SELECT IFNULL(MAX(VoteID), 0) + 1 AS NewID FROM CastVote');
        const newVoteId = maxIdRows[0].NewID;
        
        // Insert vote
        await pool.query(`
            INSERT INTO CastVote (VoteID, ElectionID, BallotItemID, CandidateUserID, VoterToken, EncryptedVoteData, TimestampCasted)
            VALUES (?, ?, ?, ?, ?, CONCAT('ENCRYPTED_', ?), NOW())
        `, [newVoteId, ElectionID, BallotItemID, CandidateUserID, VoterToken, VoterToken]);
        
        res.status(201).json({ 
            success: true, 
            message: 'Vote cast successfully',
            voteId: newVoteId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET votes for an election
router.get('/election/:electionId', async (req, res) => {
    try {
        const { electionId } = req.params;
        const [rows] = await pool.query(`
            SELECT VoteID, VoterToken, CandidateUserID, TimestampCasted
            FROM CastVote
            WHERE ElectionID = ?
            ORDER BY TimestampCasted
        `, [electionId]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET vote count
router.get('/count/:electionId', async (req, res) => {
    try {
        const { electionId } = req.params;
        const [rows] = await pool.query(`
            SELECT COUNT(*) AS totalVotes, COUNT(DISTINCT VoterToken) AS uniqueVoters
            FROM CastVote
            WHERE ElectionID = ?
        `, [electionId]);
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;