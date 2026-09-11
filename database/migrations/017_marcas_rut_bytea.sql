BEGIN;

-- Add columns to store RUT as binary data
ALTER TABLE marcas_detalladas
ADD COLUMN rut_archivo BYTEA,
ADD COLUMN rut_nombre_archivo VARCHAR(255);

-- Drop the old rut_url column if we want to replace it
-- (keeping it for now for backward compatibility)

COMMIT;
