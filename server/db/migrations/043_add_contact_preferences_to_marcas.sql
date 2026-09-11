-- Add contact preference columns to marcas table
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS contactar_por_whatsapp BOOLEAN DEFAULT false;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS contactar_por_correo BOOLEAN DEFAULT false;
