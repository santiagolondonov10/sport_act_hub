-- Add activos_propuestos_ids column to oportunidades table

ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS activos_propuestos_ids JSONB DEFAULT '[]'::jsonb;
