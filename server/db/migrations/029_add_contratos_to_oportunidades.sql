ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS contratos_adjuntos JSONB DEFAULT '[]'::jsonb;
