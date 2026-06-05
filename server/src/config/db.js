// PostgreSQL connection pool — shared across all controllers
const { Pool } = require('pg');
const { config } = require('./env');

// Suppress pg v8 SSL deprecation warning — Neon's sslmode=require triggers it
// It's a cosmetic deprecation notice, not an actual error. Fixed in pg v9.
process.env.NODE_NO_WARNINGS = '1';

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false }, // required for Neon DB proxy connections
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Called once at startup to confirm DB is reachable before accepting traffic
async function testConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() AS server_time');
    console.log(`✅ Database connected — ${result.rows[0].server_time}`);
  } finally {
    client.release(); // always return connection to pool
  }
}

// Wrapper around pool.query that returns rows directly (less boilerplate)
async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

module.exports = { pool, testConnection, query };
