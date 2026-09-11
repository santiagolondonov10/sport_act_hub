ALTER TABLE acuerdos ADD COLUMN IF NOT EXISTS activos_incluidos_ids JSONB DEFAULT '[]'::jsonb;
