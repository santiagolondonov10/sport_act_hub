-- Remove foreign key constraint from responsable_id in acuerdos table
-- This allows acuerdos to reference both responsables from the organization and contacts from marcas
ALTER TABLE acuerdos DROP CONSTRAINT IF EXISTS acuerdos_responsable_id_fkey;
