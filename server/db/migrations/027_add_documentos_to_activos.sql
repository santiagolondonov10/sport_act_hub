-- Agregar campo para documentos adjuntos a activos
ALTER TABLE activos ADD COLUMN documentos_adjuntos JSONB DEFAULT '[]'::jsonb;
