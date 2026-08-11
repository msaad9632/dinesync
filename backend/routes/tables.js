// ==========================================
// Table Routes
// ==========================================
const express = require('express');
const router = express.Router();
const { isCloud, getPool, getSql } = require('../db');
const { requiredInt, oneOf, respondIfInvalid } = require('../validate');

const TABLE_STATUSES = ['Available', 'Reserved', 'Maintenance'];

// GET /api/tables - Get all tables with zone info (LEFT JOIN)
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query('SELECT * FROM vw_TableDetails ORDER BY "TableID" ASC');
            res.json(result.rows);
        } else {
            const result = await pool.request().query('SELECT * FROM vw_TableDetails ORDER BY TableID ASC');
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching tables:', err);
        res.status(500).json({ error: 'Failed to fetch tables' });
    }
});

// GET /api/tables/available - Get available tables only
router.get('/available', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(`
                SELECT * FROM vw_TableDetails
                WHERE "Status" <> 'Maintenance'
                ORDER BY "TableID" ASC
            `);
            res.json(result.rows);
        } else {
            const result = await pool.request().query(`
                SELECT * FROM vw_TableDetails
                WHERE Status <> 'Maintenance'
                ORDER BY TableID ASC
            `);
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching available tables:', err);
        res.status(500).json({ error: 'Failed to fetch available tables' });
    }
});

// GET /api/tables/largest - Get table with largest capacity (subquery)
router.get('/largest', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(`
                SELECT tableid AS "TableID", zoneid AS "ZoneID", capacity AS "Capacity", status AS "Status"
                FROM RestaurantTable
                WHERE capacity = (SELECT MAX(capacity) FROM RestaurantTable)
            `);
            res.json(result.rows);
        } else {
            const result = await pool.request().query(`
                SELECT TableID, ZoneID, Capacity, Status
                FROM RestaurantTable
                WHERE Capacity = (SELECT MAX(Capacity) FROM RestaurantTable)
            `);
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching largest table:', err);
        res.status(500).json({ error: 'Failed to fetch largest table' });
    }
});

// POST /api/tables - Add a new table
router.post('/', async (req, res) => {
    try {
        const { ZoneID, Capacity, Status } = req.body;
        if (respondIfInvalid(res, [
            requiredInt(ZoneID, 'ZoneID', { min: 1 }),
            requiredInt(Capacity, 'Capacity', { min: 1, max: 20 }),
            Status !== undefined ? oneOf(Status, 'Status', TABLE_STATUSES) : null,
        ])) return;
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(
                'INSERT INTO RestaurantTable (ZoneID, Capacity, Status) VALUES ($1, $2, $3) RETURNING tableid AS "TableID"',
                [ZoneID, Capacity, Status || 'Available']
            );
            res.status(201).json({ message: 'Table added!', TableID: result.rows[0].TableID });
        } else {
            const sql = getSql();
            const result = await pool.request()
                .input('zoneId', sql.Int, ZoneID)
                .input('capacity', sql.Int, Capacity)
                .input('status', sql.VarChar, Status || 'Available')
                .query('INSERT INTO RestaurantTable (ZoneID, Capacity, Status) VALUES (@zoneId, @capacity, @status); SELECT SCOPE_IDENTITY() AS TableID;');
            res.status(201).json({ message: 'Table added!', TableID: result.recordset[0].TableID });
        }
    } catch (err) {
        console.error('Error adding table:', err);
        res.status(500).json({ error: 'Failed to add table' });
    }
});

// PUT /api/tables/:id/status - Update table status (Available, Maintenance, Reserved)
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { Status } = req.body;
        if (respondIfInvalid(res, [
            requiredInt(id, 'id', { min: 1 }),
            oneOf(Status, 'Status', TABLE_STATUSES),
        ])) return;
        const pool = await getPool();
        if (isCloud) {
            await pool.query('UPDATE RestaurantTable SET Status = $1 WHERE tableid = $2', [Status, id]);
        } else {
            const sql = getSql();
            await pool.request()
                .input('id', sql.Int, id)
                .input('status', sql.VarChar, Status)
                .query('UPDATE RestaurantTable SET Status = @status WHERE TableID = @id');
        }
        res.json({ message: `Table status updated to ${Status}!` });
    } catch (err) {
        console.error('Error updating table status:', err);
        res.status(500).json({ error: 'Failed to update table status' });
    }
});

module.exports = router;
