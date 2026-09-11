import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSql = fs.readFileSync('./database/migrations/014_multi_tenant_compania_id.sql', 'utf8');

    console.log('Applying migration...');
    await pool.query(migrationSql);

    console.log('Migration completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
