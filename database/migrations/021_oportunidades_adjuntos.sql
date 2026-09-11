BEGIN;

-- Agregar columnas para contratos y documentos adjuntos a oportunidades
ALTER TABLE oportunidades
ADD COLUMN IF NOT EXISTS contratos_adjuntos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documentos_adjuntos JSONB DEFAULT '[]'::jsonb;

COMMIT;
