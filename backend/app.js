// ==========================================
// Express App - shared by the local dev server (server.js)
// and the Vercel serverless entry point (api/index.js)
// ==========================================
const express = require('express');
const cors = require('cors');

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.disable('x-powered-by');

// Minimal security headers (no helmet dependency needed for this app's size)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
});

// Middleware. Same-origin requests (frontend + API on the same Vercel
// deployment) never trigger CORS in the browser at all; this only matters
// for local dev, where the Vite server runs on a different port.
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '10kb' }));

// Import Routes
const customerRoutes = require('./routes/customers');
const zoneRoutes = require('./routes/zones');
const tableRoutes = require('./routes/tables');
const reservationRoutes = require('./routes/reservations');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');

// Use Routes
app.use('/api/customers', customerRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);

// Test route (also mounted at "/" for local convenience; on Vercel "/"
// is served by the static frontend build, so this only ever answers "/api")
app.get(['/', '/api'], (req, res) => {
    res.json({ message: 'DineSync API is running!' });
});

// 404 for unknown API routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Central error handler: never leak stack traces / internals to the client
// (e.g. malformed JSON bodies throw inside express.json() before reaching a route).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ error: 'Something went wrong' });
});

module.exports = app;
