-- Remove foreign key constraint from responsable_id in acuerdos table
-- This allows acuerdos to store responsable data without database constraints

-- Try different possible constraint names
DO $$
BEGIN
  BEGIN
    ALTER TABLE acuerdos DROP CONSTRAINT acuerdos_responsable_id_fkey;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
END
$$;

-- Make responsable_id nullable to allow any value
ALTER TABLE acuerdos ALTER COLUMN responsable_id TYPE TEXT;
ALTER TABLE acuerdos ALTER COLUMN responsable_id DROP NOT NULL;
