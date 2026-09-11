-- Add internal responsable fields to oportunidades
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS responsable_interno_nombre TEXT;
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS responsable_interno_correo TEXT;
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS responsable_interno_telefono TEXT;
