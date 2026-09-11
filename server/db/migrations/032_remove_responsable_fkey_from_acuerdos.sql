-- Remove all foreign key constraints from acuerdos table
-- This allows storing references without database validation
ALTER TABLE acuerdos DROP CONSTRAINT IF EXISTS acuerdos_responsable_id_fkey;
ALTER TABLE acuerdos DROP CONSTRAINT IF EXISTS acuerdos_oportunidad_origen_id_fkey;
ALTER TABLE acuerdos DROP CONSTRAINT IF EXISTS acuerdos_marca_id_fkey;

-- Make columns nullable where appropriate
DO $$
BEGIN
  BEGIN
    ALTER TABLE acuerdos ALTER COLUMN responsable_id DROP NOT NULL;
  EXCEPTION WHEN others THEN
    NULL;
  END;
  BEGIN
    ALTER TABLE acuerdos ALTER COLUMN oportunidad_origen_id DROP NOT NULL;
  EXCEPTION WHEN others THEN
    NULL;
  END;
  BEGIN
    ALTER TABLE acuerdos ALTER COLUMN marca_id DROP NOT NULL;
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;
