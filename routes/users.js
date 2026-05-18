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

// PUT update user profile
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ProfileInfo, ProfilePicture } = req.body;
        
        await pool.query(
            'UPDATE System_User SET ProfileInfo = ?, ProfilePicture = ? WHERE UserID = ?',
            [ProfileInfo, ProfilePicture, id]
        );
        
        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create new election
router.post('/', async (req, res) => {
    try {
        const { ElectionName, StartDateTime, EndDateTime, Status } = req.body;
        const [maxId] = await pool.query('SELECT IFNULL(MAX(ElectionID), 0) + 1 AS NewID FROM Election');
        const newId = maxId[0].NewID;
        await pool.query('INSERT INTO Election (ElectionID, ElectionName, StartDateTime, EndDateTime, Status) VALUES (?, ?, ?, ?, ?)', [newId, ElectionName, StartDateTime, EndDateTime, Status || 'Upcoming']);
        res.json({ success: true, message: 'Election created', electionId: newId });
    } catch (error) {
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

// PUT update user eligibility and role (for admin)
router.put('/admin/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { Eligibility, Role } = req.body;
        
        const updates = [];
        const values = [];
        
        if (Eligibility) {
            updates.push('Eligibility = ?');
            values.push(Eligibility);
        }
        if (Role) {
            updates.push('Role = ?');
            values.push(Role);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No updates provided' });
        }
        
        values.push(id);
        
        await pool.query(
            `UPDATE System_User SET ${updates.join(', ')} WHERE UserID = ?`,
            values
        );
        
        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;