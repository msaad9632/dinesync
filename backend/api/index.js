// ==========================================
// Vercel Serverless Entry Point
// ==========================================
// Migrations are NOT run here — schema changes on every cold start would
// race across concurrent invocations. The Postgres schema/views/functions
// are managed directly against Supabase (see project migrations).
module.exports = require('../app');
