// ==========================================
// Customer Routes
// ==========================================
const express = require('express');
const router = express.Router();
const { isCloud, getPool, getSql } = require('../db');
const { requiredString, optionalString, requiredInt, respondIfInvalid } = require('../validate');

const SELECT_COLS = 'customerid AS "CustomerID", name AS "Name", phone AS "Phone", email AS "Email"';

// GET /api/customers - Get all customers
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(`SELECT ${SELECT_COLS} FROM Customer ORDER BY Name ASC`);
            res.json(result.rows);
        } else {
            const result = await pool.request().query('SELECT * FROM Customer ORDER BY Name ASC');
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// GET /api/customers/search?phone=xxx - Search by phone
router.get('/search', async (req, res) => {
    try {
        const { phone } = req.query;
        if (respondIfInvalid(res, [requiredString(phone, 'phone', { maxLength: 20 })])) return;
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(
                `SELECT ${SELECT_COLS} FROM Customer WHERE Phone LIKE $1 ORDER BY Name ASC`,
                [`%${phone}%`]
            );
            res.json(result.rows);
        } else {
            const sql = getSql();
            const result = await pool.request()
                .input('phone', sql.VarChar, `%${phone}%`)
                .query('SELECT CustomerID, Name, Phone FROM Customer WHERE Phone LIKE @phone ORDER BY Name ASC');
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error searching customers:', err);
        res.status(500).json({ error: 'Failed to search customers' });
    }
});

// POST /api/customers - Add a new customer
router.post('/', async (req, res) => {
    try {
        const { Name, Phone, Email } = req.body;
        if (respondIfInvalid(res, [
            requiredString(Name, 'Name', { maxLength: 100 }),
            requiredString(Phone, 'Phone', { maxLength: 15 }),
            optionalString(Email, 'Email', { maxLength: 100 }),
        ])) return;
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(
                'INSERT INTO Customer (Name, Phone, Email) VALUES ($1, $2, $3) RETURNING customerid AS "CustomerID"',
                [Name, Phone, Email || null]
            );
            res.status(201).json({ message: 'Customer added!', CustomerID: result.rows[0].CustomerID });
        } else {
            const sql = getSql();
            const result = await pool.request()
                .input('name', sql.VarChar, Name)
                .input('phone', sql.VarChar, Phone)
                .input('email', sql.VarChar, Email)
                .query('INSERT INTO Customer (Name, Phone, Email) VALUES (@name, @phone, @email); SELECT SCOPE_IDENTITY() AS CustomerID;');
            res.status(201).json({ message: 'Customer added!', CustomerID: result.recordset[0].CustomerID });
        }
    } catch (err) {
        console.error('Error adding customer:', err);
        res.status(500).json({ error: 'Failed to add customer' });
    }
});

// DELETE /api/customers/:id - Delete a customer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (respondIfInvalid(res, [requiredInt(id, 'id', { min: 1 })])) return;
        const pool = await getPool();
        if (isCloud) {
            await pool.query('DELETE FROM Customer WHERE customerid = $1', [id]);
        } else {
            const sql = getSql();
            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM Customer WHERE CustomerID = @id');
        }
        res.json({ message: 'Customer deleted!' });
    } catch (err) {
        console.error('Error deleting customer:', err);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

module.exports = router;
