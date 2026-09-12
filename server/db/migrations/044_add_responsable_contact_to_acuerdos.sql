-- Add responsable correo and telefono columns to acuerdos table
ALTER TABLE acuerdos ADD COLUMN IF NOT EXISTS responsable_correo VARCHAR(255);
ALTER TABLE acuerdos ADD COLUMN IF NOT EXISTS responsable_telefono VARCHAR(20);
