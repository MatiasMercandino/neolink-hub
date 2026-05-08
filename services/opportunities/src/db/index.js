'use strict';

const { Pool } = require('pg');

/**
 * Shared PostgreSQL connection pool.
 *
 * Configuration is read from environment variables:
 *   PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
 *
 * The pool is lazily created on first import and reused across the process.
 */
const pool = new Pool({
  host:     process.env.PGHOST     ?? 'localhost',
  port:     Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'neolink_hub',
  user:     process.env.PGUSER     ?? 'neolink',
  password: process.env.PGPASSWORD ?? '',
  // Keep a modest pool — scale horizontally at the service level.
  max:                20,
  idleTimeoutMillis:  30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Verify the database connection on startup.
 * @returns {Promise<void>}
 */
async function checkConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[DB] PostgreSQL connection established.');
  } finally {
    client.release();
  }
}

module.exports = { pool, checkConnection };
