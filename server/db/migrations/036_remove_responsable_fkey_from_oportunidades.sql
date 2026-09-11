-- Remove foreign key constraint from responsable_id to allow contactos de marcas
ALTER TABLE oportunidades DROP CONSTRAINT IF EXISTS oportunidades_responsable_id_fkey;
