// ==========================================
// Zone Routes
// ==========================================
const express = require('express');
const router = express.Router();
const { isCloud, getPool } = require('../db');

// GET /api/zones - Get all zones
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query('SELECT * FROM TableZone ORDER BY ZoneName ASC');
            res.json(result.rows);
        } else {
            const result = await pool.request().query('SELECT * FROM TableZone ORDER BY ZoneName ASC');
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching zones:', err);
        res.status(500).json({ error: 'Failed to fetch zones' });
    }
});

module.exports = router;
