// ==========================================
// Reservation Routes
// ==========================================
const express = require('express');
const router = express.Router();
const { isCloud, getPool, getSql } = require('../db');
const { requiredInt, requiredString, oneOf, respondIfInvalid } = require('../validate');

const RESERVATION_STATUSES = ['Pending', 'Confirmed', 'Denied', 'Cancelled', 'Fulfilled'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

// GET /api/reservations - Get all reservations
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        if (isCloud) {
            const result = await pool.query('SELECT * FROM vw_ReservationDetails ORDER BY "ReservationDate", "StartTime"');
            res.json(result.rows);
        } else {
            const result = await pool.request().query('SELECT * FROM vw_ReservationDetails ORDER BY ReservationDate, StartTime');
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error fetching reservations:', err);
        res.status(500).json({ error: 'Failed to fetch reservations' });
    }
});

// POST /api/reservations - Create a new reservation
router.post('/', async (req, res) => {
    try {
        const { CustomerID, TableID, ReservationDate, StartTime, EndTime } = req.body;
        if (respondIfInvalid(res, [
            requiredInt(CustomerID, 'CustomerID', { min: 1 }),
            requiredInt(TableID, 'TableID', { min: 1 }),
            requiredString(ReservationDate, 'ReservationDate') || (!DATE_RE.test(ReservationDate) ? 'ReservationDate must be YYYY-MM-DD' : null),
            requiredString(StartTime, 'StartTime') || (!TIME_RE.test(StartTime) ? 'StartTime must be HH:MM' : null),
            requiredString(EndTime, 'EndTime') || (!TIME_RE.test(EndTime) ? 'EndTime must be HH:MM' : null),
            (TIME_RE.test(StartTime) && TIME_RE.test(EndTime) && EndTime <= StartTime) ? 'EndTime must be after StartTime' : null,
        ])) return;
        const pool = await getPool();

        let newId;
        if (isCloud) {
            const result = await pool.query(
                'SELECT fn_create_reservation($1, $2, $3, $4, $5) AS "ResID"',
                [CustomerID, TableID, ReservationDate, StartTime, EndTime]
            );
            newId = result.rows[0].ResID;
        } else {
            const sql = getSql();
            const result = await pool.request()
                .input('CustomerID', sql.Int, CustomerID)
                .input('TableID', sql.Int, TableID)
                .input('ReservationDate', sql.Date, ReservationDate)
                .input('StartTime', sql.Time, StartTime)
                .input('EndTime', sql.Time, EndTime)
                .execute('sp_CreateReservation');
            newId = result.recordset[0].ResID;
        }

        res.status(201).json({ message: 'Reservation created!', status: 'Pending', ResID: newId });
    } catch (err) {
        // Foreign key violation (unknown CustomerID/TableID): mssql error 547, Postgres SQLSTATE 23503
        if (err.number === 547 || err.code === '23503') {
            return res.status(400).json({ error: 'CustomerID or TableID does not exist' });
        }
        // Our custom conflict error: mssql error 51000, Postgres SQLSTATE 50000
        if (err.number === 51000 || err.code === '50000') {
            return res.status(409).json({ error: err.message });
        }
        console.error('Error creating reservation:', err);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

// PUT /api/reservations/:id/status - Update reservation status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { ReservationStatus } = req.body;
        if (respondIfInvalid(res, [
            requiredInt(id, 'id', { min: 1 }),
            oneOf(ReservationStatus, 'ReservationStatus', RESERVATION_STATUSES),
        ])) return;
        const pool = await getPool();

        if (isCloud) {
            await pool.query('SELECT fn_update_reservation_status($1, $2)', [id, ReservationStatus]);
        } else {
            const sql = getSql();
            await pool.request()
                .input('ResID', sql.Int, id)
                .input('NewStatus', sql.VarChar, ReservationStatus)
                .execute('sp_UpdateReservationStatus');
        }

        res.json({ message: 'Reservation status updated!' });
    } catch (err) {
        console.error('Error updating reservation:', err);
        res.status(500).json({ error: 'Failed to update reservation' });
    }
});

// GET /api/reservations/:id/bill - Calculate total bill for a reservation
router.get('/:id/bill', async (req, res) => {
    try {
        const { id } = req.params;
        if (respondIfInvalid(res, [requiredInt(id, 'id', { min: 1 })])) return;
        const pool = await getPool();

        if (isCloud) {
            const result = await pool.query(
                `SELECT r.resid AS "ResID",
                        COALESCE(SUM(m.price * od.quantity), 0) AS "FoodTotal",
                        tz.surchargeamount AS "SurchargeAmount",
                        COALESCE(SUM(m.price * od.quantity), 0) + tz.surchargeamount AS "GrandTotal"
                 FROM Reservation r
                 JOIN RestaurantTable rt ON r.tableid = rt.tableid
                 JOIN TableZone tz ON rt.zoneid = tz.zoneid
                 LEFT JOIN OrderDetail od ON r.resid = od.resid
                 LEFT JOIN Menu m ON od.itemid = m.itemid
                 WHERE r.resid = $1
                 GROUP BY r.resid, tz.surchargeamount`,
                [id]
            );
            res.json(result.rows[0] || { message: 'No bill found' });
        } else {
            const sql = getSql();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT r.ResID,
                           ISNULL(SUM(m.Price * od.Quantity), 0) AS FoodTotal,
                           tz.SurchargeAmount,
                           ISNULL(SUM(m.Price * od.Quantity), 0) + tz.SurchargeAmount AS GrandTotal
                    FROM Reservation r
                    JOIN RestaurantTable rt ON r.TableID = rt.TableID
                    JOIN TableZone tz ON rt.ZoneID = tz.ZoneID
                    LEFT JOIN OrderDetail od ON r.ResID = od.ResID
                    LEFT JOIN Menu m ON od.ItemID = m.ItemID
                    WHERE r.ResID = @id
                    GROUP BY r.ResID, tz.SurchargeAmount
                `);
            res.json(result.recordset[0] || { message: 'No bill found' });
        }
    } catch (err) {
        console.error('Error calculating bill:', err);
        res.status(500).json({ error: 'Failed to calculate bill' });
    }
});

module.exports = router;
