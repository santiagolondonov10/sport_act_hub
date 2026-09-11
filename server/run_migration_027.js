import { pool } from './dist/db.js';

(async () => {
  try {
    console.log('Ejecutando migración 027...');
    await pool.query('ALTER TABLE activos ADD COLUMN IF NOT EXISTS documentos_adjuntos JSONB DEFAULT \'[]\'::jsonb');
    console.log('✓ Migración 027 aplicada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
