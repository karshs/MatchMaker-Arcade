// resetDemo.js — Development-only script to clear all sent matches and restore candidate availability
// Run with: npm run reset:demo

process.env.NODE_NO_WARNINGS = '1';
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runReset() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Demo Reset ---');
    
    // 1. Delete all records from the matches table
    console.log('1. Clearing matches table...');
    const result = await client.query('DELETE FROM matches');
    console.log(`-> Successfully deleted ${result.rowCount} match records.`);

    // 2. We are intentionally NOT reverting journey_status in the customers table 
    //    so as to preserve the exact demographic variance set by seed.js, but
    //    if you want to force all "Matches Shared" back to "Searching", uncomment the following block:
    /*
    console.log('2. Reverting journey status...');
    const statusResult = await client.query(
      `UPDATE customers SET journey_status = 'Searching' WHERE journey_status = 'Matches Shared'`
    );
    console.log(`-> Reverted ${statusResult.rowCount} customers back to Searching status.`);
    */
    
    console.log('--- Demo Reset Complete! Candidates are now fully available again. ---');
  } catch (error) {
    console.error('Error during demo reset:', error);
  } finally {
    client.release();
    pool.end();
  }
}

runReset();
