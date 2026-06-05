// One-time script to push schema.sql to Neon DB
// Run with: node src/db/migrate.js
// Safe to run multiple times — all statements use IF NOT EXISTS

// Suppress pg SSL deprecation warning (Neon handles SSL via the connection string)
process.env.NODE_NO_WARNINGS = '1';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  // Read the SQL file from the same folder as this script
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('🔄 Running migration...\n');
    await client.query(sql); // run the entire file as one transaction
    console.log('✅ Migration complete! Tables created:');
    console.log('   - customers');
    console.log('   - notes');
    console.log('   - matches');
    console.log('   - journey_events');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end(); // close all connections after we're done
  }
}

migrate();
