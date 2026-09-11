import { pool } from './server/src/db.ts';

const client = await pool.connect();

try {
  // Drop all tables and extensions
  await client.query(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
  `);
  console.log('✓ Base de datos limpiada');
} finally {
  client.release();
  process.exit(0);
}
