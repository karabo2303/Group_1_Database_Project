const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/db');
const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'frontend/public/uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Upload profile picture
router.post('/profile-picture/:userId', upload.single('profilePicture'), async (req, res) => {
    try {
        const { userId } = req.params;
        const imageUrl = `/uploads/${req.file.filename}`;
        
        await pool.query(
            'UPDATE System_User SET ProfilePicture = ? WHERE UserID = ?',
            [imageUrl, userId]
        );
        
        res.json({ success: true, imageUrl: imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;