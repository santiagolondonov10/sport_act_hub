BEGIN;

-- Eliminar la columna categoria que fue reemplazada por categoria_id
ALTER TABLE activos DROP COLUMN IF EXISTS categoria;

COMMIT;
