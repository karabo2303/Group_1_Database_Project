const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [rows] = await pool.query(
            'SELECT UserID, FullName, EmailAddress, Role FROM System_User WHERE EmailAddress = ? AND HashedPassword = ?',
            [email, password]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }
        
        const user = rows[0];
        res.json({ 
            success: true, 
            user: {
                userId: user.UserID,
                fullName: user.FullName,
                email: user.EmailAddress,
                role: user.Role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/users/signup
router.post('/signup', async (req, res) => {
    try {
        const { FullName, EmailAddress, Password, Role } = req.body;
        
        // Check if user exists
        const [existing] = await pool.query(
            'SELECT COUNT(*) AS count FROM System_User WHERE EmailAddress = ?',
            [EmailAddress]
        );
        
        if (existing[0].count > 0) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }
        
        // Get next UserID
        const [maxId] = await pool.query('SELECT IFNULL(MAX(UserID), 0) + 1 AS NewID FROM System_User');
        const newUserId = maxId[0].NewID;
        
        // Insert new user
        await pool.query(
            'INSERT INTO System_User (UserID, FullName, EmailAddress, HashedPassword, Role, Eligibility, VotedFlag, CreatedDate) VALUES (?, ?, ?, ?, ?, "Approved", "N", NOW())',
            [newUserId, FullName, EmailAddress, Password, Role || 'Voter']
        );
        
        res.status(201).json({ success: true, message: 'User created successfully', userId: newUserId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;