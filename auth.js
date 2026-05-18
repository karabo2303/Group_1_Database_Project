const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        // Accept both camelCase (frontend) and snake_case field names
        const fullname = req.body.fullname || req.body.fullName;
        const email = req.body.email;
        const password = req.body.password;
        // Default role to 'Voter' if not provided (frontend sign-up is always a voter)
        const role = req.body.role || 'Voter';
        const birthDate = req.body.birthDate || req.body.birth_date;

        // Validate required fields
        if (!fullname || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'All fields are required: fullname, email, password' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, error: 'Invalid email format' });
        }

        // Validate age (must be 18+) if birthDate provided
        if (birthDate) {
            const dob = new Date(birthDate);
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear() -
                ((today.getMonth() < dob.getMonth() || 
                  (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) ? 1 : 0);
            if (age < 18) {
                return res.status(400).json({ success: false, error: 'You must be 18 years or older to register' });
            }
        }
        
        const [result] = await pool.promise().query(
            'CALL sp_RegisterUser(?, ?, ?, ?, @user_id, @message)',
            [fullname, email, password, role]
        );
        
        const [output] = await pool.promise().query('SELECT @user_id as user_id, @message as message');
        
        if (output[0].user_id && output[0].user_id > 0) {
            res.json({ 
                success: true, 
                userId: output[0].user_id,
                user_id: output[0].user_id, 
                message: output[0].message 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                error: output[0].message || 'Registration failed' 
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        // Accept email or userId
        const email = req.body.email || req.body.userId;
        const { password, ip_address, user_agent } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email/User ID and password are required' 
            });
        }
        
        const [result] = await pool.promise().query(
            'CALL sp_Login(?, ?, ?, ?, @user_id, @role, @account_status, @access_token, @message)',
            [email, password, ip_address || '127.0.0.1', user_agent || 'unknown']
        );
        
        const [output] = await pool.promise().query(
            'SELECT @user_id as user_id, @role as role, @account_status as account_status, @access_token as access_token, @message as message'
        );
        
        if (output[0].user_id && output[0].user_id > 0) {
            const user = {
                userId: output[0].user_id,
                role: output[0].role,
                account_status: output[0].account_status,
                access_token: output[0].access_token,
            };
            res.json({ 
                success: true, 
                user,
                user_id: output[0].user_id,
                role: output[0].role,
                account_status: output[0].account_status,
                access_token: output[0].access_token,
                message: output[0].message
            });
        } else {
            res.status(401).json({ 
                success: false, 
                error: output[0].message || 'Login failed' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
