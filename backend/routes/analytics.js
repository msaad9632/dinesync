// ==========================================
// Analytics Routes
// ==========================================
const express = require('express');
const router = express.Router();
const { isCloud, getPool } = require('../db');

// GET /api/analytics/top-customers - Customers with most reservations (HAVING clause)
router.get('/top-customers', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(`
                SELECT c.customerid AS "CustomerID", c.name AS "Name", c.phone AS "Phone",
                       COUNT(r.resid) AS "TotalReservations"
                FROM Customer c
                JOIN Reservation r ON c.customerid = r.customerid
                GROUP BY c.customerid, c.name, c.phone
                HAVING COUNT(r.resid) >= 1
                ORDER BY "TotalReservations" DESC
            `);
            res.json(result.rows);
        } else {
            const result = await pool.request().query(`
                SELECT c.CustomerID, c.Name, c.Phone, COUNT(r.ResID) AS TotalReservations
                FROM Customer c
                JOIN Reservation r ON c.CustomerID = r.CustomerID
                GROUP BY c.CustomerID, c.Name, c.Phone
                HAVING COUNT(r.ResID) >= 1
                ORDER BY TotalReservations DESC
            `);
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching top customers:', err);
        res.status(500).json({ error: 'Failed to fetch top customers' });
    }
});

// GET /api/analytics/best-sellers - Most ordered menu items
router.get('/best-sellers', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(`
                SELECT m.name AS "Name", m.category AS "Category", SUM(od.quantity) AS "TotalOrdered"
                FROM Menu m
                JOIN OrderDetail od ON m.itemid = od.itemid
                GROUP BY m.name, m.category
                ORDER BY "TotalOrdered" DESC
            `);
            res.json(result.rows);
        } else {
            const result = await pool.request().query(`
                SELECT m.Name, m.Category, SUM(od.Quantity) AS TotalOrdered
                FROM Menu m
                JOIN OrderDetail od ON m.ItemID = od.ItemID
                GROUP BY m.Name, m.Category
                ORDER BY TotalOrdered DESC
            `);
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching best sellers:', err);
        res.status(500).json({ error: 'Failed to fetch best sellers' });
    }
});

// GET /api/analytics/high-demand-zones - Busiest zones
router.get('/high-demand-zones', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(`
                SELECT tz.zonename AS "ZoneName", tz.surchargeamount AS "SurchargeAmount",
                       COUNT(r.resid) AS "TotalReservations"
                FROM TableZone tz
                LEFT JOIN RestaurantTable rt ON tz.zoneid = rt.zoneid
                LEFT JOIN Reservation r ON rt.tableid = r.tableid
                GROUP BY tz.zonename, tz.surchargeamount
                ORDER BY "TotalReservations" DESC
            `);
            res.json(result.rows);
        } else {
            const result = await pool.request().query(`
                SELECT tz.ZoneName, tz.SurchargeAmount, COUNT(r.ResID) AS TotalReservations
                FROM TableZone tz
                LEFT JOIN RestaurantTable rt ON tz.ZoneID = rt.ZoneID
                LEFT JOIN Reservation r ON rt.TableID = r.TableID
                GROUP BY tz.ZoneName, tz.SurchargeAmount
                ORDER BY TotalReservations DESC
            `);
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching zone demand:', err);
        res.status(500).json({ error: 'Failed to fetch zone demand' });
    }
});

// GET /api/analytics/above-avg-items - Items priced above average (subquery)
router.get('/above-avg-items', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query(`
                SELECT name AS "Name", price AS "Price", category AS "Category"
                FROM Menu
                WHERE price > (SELECT AVG(price) FROM Menu)
                ORDER BY price DESC
            `);
            res.json(result.rows);
        } else {
            const result = await pool.request().query(`
                SELECT Name, Price, Category
                FROM Menu
                WHERE Price > (SELECT AVG(Price) FROM Menu)
                ORDER BY Price DESC
            `);
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching above-avg items:', err);
        res.status(500).json({ error: 'Failed to fetch above-avg items' });
    }
});

// GET /api/analytics/summary - Dashboard summary stats
router.get('/summary', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const customers = await pool.query('SELECT COUNT(*) AS count FROM Customer');
            const reservations = await pool.query('SELECT COUNT(*) AS count FROM Reservation');
            const menuItems = await pool.query('SELECT COUNT(*) AS count FROM Menu');
            const tables = await pool.query('SELECT COUNT(*) AS count FROM RestaurantTable');
            const pending = await pool.query("SELECT COUNT(*) AS count FROM Reservation WHERE reservationstatus = 'Pending'");
            const confirmed = await pool.query("SELECT COUNT(*) AS count FROM Reservation WHERE reservationstatus = 'Confirmed'");

            res.json({
                totalCustomers: Number(customers.rows[0].count),
                totalReservations: Number(reservations.rows[0].count),
                totalMenuItems: Number(menuItems.rows[0].count),
                totalTables: Number(tables.rows[0].count),
                pendingReservations: Number(pending.rows[0].count),
                confirmedReservations: Number(confirmed.rows[0].count)
            });
        } else {
            const customers = await pool.request().query('SELECT COUNT(*) AS count FROM Customer');
            const reservations = await pool.request().query('SELECT COUNT(*) AS count FROM Reservation');
            const menuItems = await pool.request().query('SELECT COUNT(*) AS count FROM Menu');
            const tables = await pool.request().query('SELECT COUNT(*) AS count FROM RestaurantTable');
            const pending = await pool.request().query("SELECT COUNT(*) AS count FROM Reservation WHERE ReservationStatus = 'Pending'");
            const confirmed = await pool.request().query("SELECT COUNT(*) AS count FROM Reservation WHERE ReservationStatus = 'Confirmed'");

            res.json({
                totalCustomers: customers.recordset[0].count,
                totalReservations: reservations.recordset[0].count,
                totalMenuItems: menuItems.recordset[0].count,
                totalTables: tables.recordset[0].count,
                pendingReservations: pending.recordset[0].count,
                confirmedReservations: confirmed.recordset[0].count
            });
        }
    } catch (err) {
        console.error('Error fetching summary:', err);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

module.exports = router;
