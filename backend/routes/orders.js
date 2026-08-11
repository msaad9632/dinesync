// ==========================================
// Order Routes (Pre-Order Module)
// ==========================================
const express = require('express');
const router = express.Router();
const { isCloud, getPool, getSql } = require('../db');
const { requiredInt, respondIfInvalid } = require('../validate');

// GET /api/orders/:resId - Get orders for a reservation
router.get('/:resId', async (req, res) => {
    try {
        const { resId } = req.params;
        if (respondIfInvalid(res, [requiredInt(resId, 'resId', { min: 1 })])) return;
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(
                `SELECT od.orderid AS "OrderID", od.quantity AS "Quantity", m.name AS "Name",
                        m.price AS "Price", m.category AS "Category",
                        (m.price * od.quantity) AS "Subtotal"
                 FROM OrderDetail od
                 JOIN Menu m ON od.itemid = m.itemid
                 WHERE od.resid = $1`,
                [resId]
            );
            res.json(result.rows);
        } else {
            const sql = getSql();
            const result = await pool.request()
                .input('resId', sql.Int, resId)
                .query(`
                    SELECT od.OrderID, od.Quantity, m.Name, m.Price, m.Category,
                           (m.Price * od.Quantity) AS Subtotal
                    FROM OrderDetail od
                    JOIN Menu m ON od.ItemID = m.ItemID
                    WHERE od.ResID = @resId
                `);
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// POST /api/orders - Add a pre-order item
router.post('/', async (req, res) => {
    try {
        const { ResID, ItemID, Quantity } = req.body;
        if (respondIfInvalid(res, [
            requiredInt(ResID, 'ResID', { min: 1 }),
            requiredInt(ItemID, 'ItemID', { min: 1 }),
            requiredInt(Quantity, 'Quantity', { min: 1, max: 20 }),
        ])) return;
        const pool = await getPool();

        let orderId;
        if (isCloud) {
            const result = await pool.query(
                'SELECT fn_add_preorder($1, $2, $3) AS "OrderID"',
                [ResID, ItemID, Quantity]
            );
            orderId = result.rows[0].OrderID;
        } else {
            const sql = getSql();
            const result = await pool.request()
                .input('ResID', sql.Int, ResID)
                .input('ItemID', sql.Int, ItemID)
                .input('Quantity', sql.Int, Quantity)
                .execute('sp_AddPreOrder');
            orderId = result.recordset[0].OrderID;
        }

        res.status(201).json({ message: 'Pre-order added!', OrderID: orderId });
    } catch (err) {
        if (err.number === 547 || err.code === '23503') {
            return res.status(400).json({ error: 'ResID or ItemID does not exist' });
        }
        console.error('Error adding order:', err);
        res.status(500).json({ error: 'Failed to add order' });
    }
});

module.exports = router;
