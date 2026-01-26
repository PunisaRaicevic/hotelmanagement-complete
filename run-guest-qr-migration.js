import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const sqlPath = path.join(__dirname, 'migrations', 'add_guest_qr_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration to add guest QR code system...\n');

    await pool.query(sql);

    console.log('Migration completed successfully!');

    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'rooms'
      AND column_name IN ('guest_session_token', 'guest_count', 'guest_phone', 'guest_email', 'token_created_at')
    `);

    console.log('\nNew columns in rooms table:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

    // Check if guest_service_requests table exists
    const tableResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'guest_service_requests'
    `);

    if (tableResult.rows.length > 0) {
      console.log('\n✓ guest_service_requests table created');
    }

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
