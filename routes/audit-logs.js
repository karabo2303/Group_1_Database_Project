const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/candidates
// Returns all candidates
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.promise().query(`
            SELECT *
            FROM candidate
            ORDER BY last_name, first_name
        `);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/candidates/:id
// Returns a single candidate by candidate_id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.promise().query(
            'SELECT * FROM candidate WHERE candidate_id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Candidate not found'
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching candidate:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
