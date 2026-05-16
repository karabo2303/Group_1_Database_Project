// routes/users.js
const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT UserID, FullName, EmailAddress, Role, Eligibility, VotedFlag, CreatedDate
            FROM System_User
            ORDER BY UserID
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT UserID, FullName, EmailAddress, Role, Eligibility, VotedFlag, ProfileInfo, CreatedDate
            FROM System_User
            WHERE UserID = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET all voters
router.get('/role/voters', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT UserID, FullName, EmailAddress, Eligibility, VotedFlag
            FROM System_User
            WHERE Role = 'Voter'
            ORDER BY FullName
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET all candidates
router.get('/role/candidates', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT u.UserID, u.FullName, u.EmailAddress, u.ProfileInfo
            FROM System_User u
            JOIN CandidateNomination cn ON u.UserID = cn.CandidateUserID
            WHERE u.Role = 'Candidate' AND cn.ApprovalStatus = 'Approved'
            ORDER BY u.FullName
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET election officials
router.get('/role/officials', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT UserID, FullName, EmailAddress, Role
            FROM System_User
            WHERE Role IN ('ElectionOfficial', 'Administrator', 'OversightOfficer')
            ORDER BY Role, FullName
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;