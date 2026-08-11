// ==========================================
// Local Dev Server - Entry Point
// ==========================================
// Not used on Vercel (see api/index.js) — this runs migrations once on
// boot and keeps a normal long-lived Express server for local development.
const app = require('./app');
const { isCloud, getPool } = require('./db');
const { runMigrations } = require('./runMigrations');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const pool = await getPool();
        if (isCloud) {
            // Postgres schema/views/functions are managed directly against
            // Supabase (see project migrations) — runMigrations is T-SQL only.
            await pool.query('SELECT 1');
        } else {
            await runMigrations(pool);
        }
        console.log('Database migrations complete.');
    } catch (err) {
        console.error('Fatal: database setup failed, server will not start.');
        console.error(err.message);
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
