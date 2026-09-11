import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: 'postgresql://postgres:Medellin123@localhost:5432/sports_act_hub'
});

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, 'db/migrations/043_add_contact_preferences_to_marcas.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    await pool.query(sql);
    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('✗ Error running migration:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
