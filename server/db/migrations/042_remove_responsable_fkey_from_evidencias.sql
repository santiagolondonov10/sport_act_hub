-- Remove responsable foreign key constraint from evidencias table
ALTER TABLE evidencias DROP CONSTRAINT IF EXISTS evidencias_responsable_id_fkey;
