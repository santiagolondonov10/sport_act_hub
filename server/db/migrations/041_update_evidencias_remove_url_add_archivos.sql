-- Remove url column, add compania_id and archivos columns to evidencias table
ALTER TABLE evidencias DROP COLUMN IF EXISTS url;
ALTER TABLE evidencias ADD COLUMN IF NOT EXISTS compania_id TEXT;
ALTER TABLE evidencias ADD COLUMN IF NOT EXISTS archivos JSONB DEFAULT '[]';
