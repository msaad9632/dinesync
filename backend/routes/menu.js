// ==========================================
// Menu Routes
// ==========================================
const express = require('express');
const router = express.Router();
const { isCloud, getPool, getSql } = require('../db');
const { requiredString, requiredNumber, requiredInt, respondIfInvalid } = require('../validate');

const SELECT_COLS = 'itemid AS "ItemID", name AS "Name", price AS "Price", category AS "Category"';

// GET /api/menu - Get all menu items
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(`SELECT ${SELECT_COLS} FROM Menu ORDER BY Category, Name ASC`);
            res.json(result.rows);
        } else {
            const result = await pool.request().query('SELECT * FROM Menu ORDER BY Category, Name ASC');
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching menu:', err);
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

// POST /api/menu - Add a new menu item
router.post('/', async (req, res) => {
    try {
        const { Name, Price, Category } = req.body;
        if (respondIfInvalid(res, [
            requiredString(Name, 'Name', { maxLength: 100 }),
            requiredNumber(Price, 'Price', { min: 0 }),
            requiredString(Category, 'Category', { maxLength: 50 }),
        ])) return;
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(
                'INSERT INTO Menu (Name, Price, Category) VALUES ($1, $2, $3) RETURNING itemid AS "ItemID"',
                [Name, Price, Category]
            );
            res.status(201).json({ message: 'Menu item added!', ItemID: result.rows[0].ItemID });
        } else {
            const sql = getSql();
            const result = await pool.request()
                .input('name', sql.VarChar, Name)
                .input('price', sql.Decimal(10, 2), Price)
                .input('category', sql.VarChar, Category)
                .query('INSERT INTO Menu (Name, Price, Category) VALUES (@name, @price, @category); SELECT SCOPE_IDENTITY() AS ItemID;');
            res.status(201).json({ message: 'Menu item added!', ItemID: result.recordset[0].ItemID });
        }
    } catch (err) {
        console.error('Error adding menu item:', err);
        res.status(500).json({ error: 'Failed to add menu item' });
    }
});

// DELETE /api/menu/:id - Delete a menu item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (respondIfInvalid(res, [requiredInt(id, 'id', { min: 1 })])) return;
        const pool = await getPool();
        if (isCloud) {
            await pool.query('DELETE FROM Menu WHERE itemid = $1', [id]);
        } else {
            const sql = getSql();
            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM Menu WHERE ItemID = @id');
        }
        res.json({ message: 'Menu item deleted!' });
    } catch (err) {
        console.error('Error deleting menu item:', err);
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
});

module.exports = router;
