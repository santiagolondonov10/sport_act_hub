-- Add marca_id and compania_id to compromisos table
ALTER TABLE compromisos ADD COLUMN IF NOT EXISTS marca_id TEXT;
ALTER TABLE compromisos ADD COLUMN IF NOT EXISTS compania_id TEXT;
