// routes/users.js
const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/users/login
// Body: { email, password }
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const [rows] = await pool.query(`
            SELECT UserID, FullName, EmailAddress, Role, Eligibility, HashedPassword
            FROM System_User
            WHERE EmailAddress = ?
        `, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const user = rows[0];

        // Simple password check (plain text for now — replace with bcrypt if hashing is added)
        if (user.HashedPassword !== password) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        if (user.Eligibility === 'Rejected') {
            return res.status(403).json({ success: false, error: 'Your account has been rejected. Contact an administrator.' });
        }

        // Return user info and role so frontend can redirect correctly
        res.json({
            success: true,
            role: user.Role,
            user: {
                userID:   user.UserID,
                fullName: user.FullName,
                email:    user.EmailAddress,
                role:     user.Role,
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/users/register
// Body: { fullName, email, password, birthDate }
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, birthDate } = req.body;

        if (!fullName || !email || !password || !birthDate) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        // Check if email already exists
        const [existing] = await pool.query(`
            SELECT UserID FROM System_User WHERE EmailAddress = ?
        `, [email]);

        if (existing.length > 0) {
            return res.status(409).json({ success: false, error: 'An account with this email already exists' });
        }

        // Get next UserID
        const [maxRow] = await pool.query(`SELECT ISNULL(MAX(UserID), 0) + 1 AS nextID FROM System_User`);
        const nextID = maxRow[0].nextID;

        // Insert new user with Role = Voter and Eligibility = Pending
        await pool.query(`
            INSERT INTO System_User (UserID, FullName, HashedPassword, EmailAddress, Role, Eligibility, CreatedDate)
            VALUES (?, ?, ?, ?, 'Voter', 'Pending', GETDATE())
        `, [nextID, fullName, password, email]);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please wait for admin approval before logging in.'
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/users  — all users
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET /api/users/role/voters
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET /api/users/role/candidates
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET /api/users/role/officials
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET /api/users/:id
// ─────────────────────────────────────────────
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

module.exports = router;
