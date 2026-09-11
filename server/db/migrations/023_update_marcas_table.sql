-- Update marcas table to include all required fields with proper structure

-- Check if the old structure exists and update it
ALTER TABLE marcas DROP COLUMN IF EXISTS sector CASCADE;

ALTER TABLE marcas ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES sectores(id) ON DELETE SET NULL;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS tipo_identificacion TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS identificacion TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS rut_data BYTEA;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS rut_nombre_archivo TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS persona_contacto_1 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS telefono_contacto_1 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS correo_contacto_1 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS cargo_contacto_1 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS persona_contacto_2 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS telefono_contacto_2 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS correo_contacto_2 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS cargo_contacto_2 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS persona_contacto_3 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS telefono_contacto_3 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS correo_contacto_3 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS cargo_contacto_3 TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS compania_id UUID;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS creado_por TEXT;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS actualizado_por TEXT;

-- Update existing records with a default company (Inter Miami)
UPDATE marcas SET compania_id = 'e5eaa980-19ba-43ba-8a3b-6f381fc90d8c' WHERE compania_id IS NULL;

-- Now make compania_id NOT NULL
ALTER TABLE marcas ALTER COLUMN compania_id SET NOT NULL;
ALTER TABLE marcas ADD CONSTRAINT fk_marcas_compania FOREIGN KEY (compania_id) REFERENCES companias(id) ON DELETE CASCADE;

-- Create view marcas_detalladas for easy retrieval with joined data
DROP VIEW IF EXISTS marcas_detalladas CASCADE;
CREATE VIEW marcas_detalladas AS
SELECT
  m.id, m.nombre, m.tipo_identificacion, m.identificacion,
  m.rut_nombre_archivo, m.sector_id, s.nombre AS sector_nombre,
  m.persona_contacto_1, m.telefono_contacto_1, m.correo_contacto_1, m.cargo_contacto_1,
  m.persona_contacto_2, m.telefono_contacto_2, m.correo_contacto_2, m.cargo_contacto_2,
  m.persona_contacto_3, m.telefono_contacto_3, m.correo_contacto_3, m.cargo_contacto_3,
  m.compania_id, m.creado_por, m.actualizado_por,
  m.created_at, m.updated_at, m.logo_iniciales, m.color_marca
FROM marcas m
LEFT JOIN sectores s ON m.sector_id = s.id;

CREATE INDEX IF NOT EXISTS idx_marcas_compania_id ON marcas(compania_id);
CREATE INDEX IF NOT EXISTS idx_marcas_sector_id ON marcas(sector_id);
