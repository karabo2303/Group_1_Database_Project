const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// GET all nominations (with filters)
router.get('/', async (req, res) => {
    try {
        const { status, electionId, candidateId } = req.query;
        let query = `
            SELECT cn.NominationID, cn.ElectionID, e.ElectionName, e.Status as ElectionStatus,
                   u.UserID as CandidateUserID, u.FullName AS CandidateName, u.EmailAddress, 
                   p.PositionName, p.PositionID,
                   cn.ApprovalStatus, cn.ApprovedBy, cn.NominationDate,
                   YEAR(e.StartDateTime) as ElectionYear
            FROM CandidateNomination cn
            JOIN System_User u ON cn.CandidateUserID = u.UserID
            JOIN Election e ON cn.ElectionID = e.ElectionID
            JOIN Positions p ON cn.PositionID = p.PositionID
        `;
        const params = [];
        
        const conditions = [];
        if (status) {
            conditions.push('cn.ApprovalStatus = ?');
            params.push(status);
        }
        if (electionId) {
            conditions.push('cn.ElectionID = ?');
            params.push(electionId);
        }
        if (candidateId) {
            conditions.push('cn.CandidateUserID = ?');
            params.push(candidateId);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY cn.NominationDate DESC';
        
        const [rows] = await pool.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET pending nominations
router.get('/pending', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT cn.NominationID, cn.ElectionID, e.ElectionName, e.Status as ElectionStatus,
                   u.UserID as CandidateUserID, u.FullName AS CandidateName, u.EmailAddress,
                   p.PositionName, p.PositionID, cn.NominationDate,
                   YEAR(e.StartDateTime) as ElectionYear
            FROM CandidateNomination cn
            JOIN System_User u ON cn.CandidateUserID = u.UserID
            JOIN Election e ON cn.ElectionID = e.ElectionID
            JOIN Positions p ON cn.PositionID = p.PositionID
            WHERE cn.ApprovalStatus = 'Pending'
            ORDER BY cn.NominationDate
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET max NominationID
router.get('/max-id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT IFNULL(MAX(NominationID), 0) AS maxId FROM CandidateNomination');
        res.json({ success: true, maxId: rows[0].maxId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET check if candidate already has approved nomination in SAME YEAR
router.get('/check-approved-same-year/:candidateId/:year', async (req, res) => {
    try {
        const { candidateId, year } = req.params;
        const [rows] = await pool.query(`
            SELECT cn.NominationID, cn.ElectionID, e.ElectionName, e.Status, cn.ApprovalStatus,
                   p.PositionName, YEAR(e.StartDateTime) as ElectionYear
            FROM CandidateNomination cn
            JOIN Election e ON cn.ElectionID = e.ElectionID
            JOIN Positions p ON cn.PositionID = p.PositionID
            WHERE cn.CandidateUserID = ? 
              AND cn.ApprovalStatus = 'Approved'
              AND YEAR(e.StartDateTime) = ?
        `, [candidateId, year]);
        
        res.json({ 
            success: true, 
            hasApprovedInSameYear: rows.length > 0,
            approvedNomination: rows[0] || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET check if candidate has ANY approved nomination (for display purposes)
router.get('/check-any-approved/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;
        const [rows] = await pool.query(`
            SELECT COUNT(*) AS count 
            FROM CandidateNomination
            WHERE CandidateUserID = ? 
              AND ApprovalStatus = 'Approved'
        `, [candidateId]);
        
        res.json({ 
            success: true, 
            hasAnyApproved: rows[0].count > 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update nomination status (approve/reject)
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approvedBy } = req.body;
        
        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }
        
        // Get nomination details with election year
        const [nomination] = await pool.query(`
            SELECT cn.CandidateUserID, YEAR(e.StartDateTime) as ElectionYear
            FROM CandidateNomination cn
            JOIN Election e ON cn.ElectionID = e.ElectionID
            WHERE cn.NominationID = ?
        `, [id]);
        
        if (nomination.length === 0) {
            return res.status(404).json({ success: false, error: 'Nomination not found' });
        }
        
        await pool.query(
            'UPDATE CandidateNomination SET ApprovalStatus = ?, ApprovedBy = ? WHERE NominationID = ?',
            [status, approvedBy || null, id]
        );
        
        // If approving, reject all other pending nominations for this candidate in the SAME YEAR
        if (status === 'Approved') {
            const candidateId = nomination[0].CandidateUserID;
            const electionYear = nomination[0].ElectionYear;
            
            const [rejectResult] = await pool.query(
                `UPDATE CandidateNomination cn
                 JOIN Election e ON cn.ElectionID = e.ElectionID
                 SET cn.ApprovalStatus = 'Rejected'
                 WHERE cn.CandidateUserID = ? 
                   AND cn.NominationID != ?
                   AND cn.ApprovalStatus = 'Pending'
                   AND YEAR(e.StartDateTime) = ?`,
                [candidateId, id, electionYear]
            );
            
            console.log(`Rejected ${rejectResult.affectedRows} other pending nominations for candidate ${candidateId} in year ${electionYear}`);
        }
        
        res.json({ success: true, message: `Nomination ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create new nomination - YEAR-BASED restriction
router.post('/', async (req, res) => {
    try {
        const { NominationID, ElectionID, CandidateUserID, PositionID, ApprovalStatus, NominationDate } = req.body;
        
        // Get the election year first
        const [electionInfo] = await pool.query(
            'SELECT YEAR(StartDateTime) as ElectionYear FROM Election WHERE ElectionID = ?',
            [ElectionID]
        );
        
        const electionYear = electionInfo[0]?.ElectionYear;
        
        if (!electionYear) {
            return res.status(400).json({ success: false, error: 'Invalid election' });
        }
        
        // Check if candidate already has an approved nomination in the SAME YEAR
        const [sameYearApproved] = await pool.query(`
            SELECT COUNT(*) AS count 
            FROM CandidateNomination cn
            JOIN Election e ON cn.ElectionID = e.ElectionID
            WHERE cn.CandidateUserID = ? 
              AND cn.ApprovalStatus = 'Approved'
              AND YEAR(e.StartDateTime) = ?
        `, [CandidateUserID, electionYear]);
        
        if (sameYearApproved[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                error: `You already have an approved nomination for the ${electionYear} election cycle. You cannot apply for another position in the same year.`
            });
        }
        
        // Check if already applied for this specific position
        const [existing] = await pool.query(
            'SELECT COUNT(*) AS count FROM CandidateNomination WHERE ElectionID = ? AND CandidateUserID = ? AND PositionID = ?',
            [ElectionID, CandidateUserID, PositionID]
        );
        
        if (existing[0].count > 0) {
            return res.status(400).json({ success: false, error: 'You have already applied for this position' });
        }
        
        await pool.query(
            'INSERT INTO CandidateNomination (NominationID, ElectionID, CandidateUserID, PositionID, ApprovalStatus, NominationDate) VALUES (?, ?, ?, ?, ?, ?)',
            [NominationID, ElectionID, CandidateUserID, PositionID, ApprovalStatus, NominationDate]
        );
        
        res.json({ success: true, message: 'Nomination submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;