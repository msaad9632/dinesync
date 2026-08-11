// ==========================================
// Database Connection Configuration
// ==========================================
// Two backends, because local dev and the live demo genuinely can't share one:
//   - Local dev: SQL Server via the Windows-only msnodesqlv8 ODBC driver,
//     Windows-integrated auth, no env file needed.
//   - Live demo (Vercel): Postgres (Supabase) via the pure-JS `pg` driver,
//     the only one that runs in a Linux serverless function.
// Presence of DATABASE_URL picks the cloud path.
const isCloud = !!process.env.DATABASE_URL;

let pool;

async function getPool() {
    if (pool) return pool;

    if (isCloud) {
        const { Pool } = require('pg');
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
        });
        try {
            await pool.query('SELECT 1');
            console.log('Connected to Postgres (Supabase)!');
        } catch (err) {
            console.error('Database connection failed!', err.message);
            throw err;
        }
        return pool;
    }

    const sql = require('mssql/msnodesqlv8');
    const config = {
        connectionString: process.env.DB_CONNECTION_STRING ||
            'Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=DineSyncDB;Trusted_Connection=yes;'
    };
    try {
        pool = await sql.connect(config);
        console.log('Connected to SQL Server (local SQLEXPRESS)!');
    } catch (err) {
        console.error('Database connection failed!');
        console.error('Error:', err.message);
        console.error('');
        console.error('TROUBLESHOOTING:');
        console.error('1. Make sure SQL Server is running');
        console.error('2. Make sure the DineSyncDB database exists (run db_setup.sql)');
        throw err;
    }
    return pool;
}

// Lazily require the mssql type helpers (sql.Int, sql.VarChar, ...) only
// when actually on the local/SQL Server path — a top-level require would
// crash on Vercel, where the Windows-only msnodesqlv8 package isn't installed.
function getSql() {
    return require('mssql/msnodesqlv8');
}

module.exports = { isCloud, getPool, getSql };
