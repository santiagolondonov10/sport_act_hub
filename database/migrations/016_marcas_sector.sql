BEGIN;

-- Add sector_id column to marcas_detalladas
ALTER TABLE marcas_detalladas
ADD COLUMN sector_id UUID REFERENCES sectores(id) ON DELETE SET NULL;

-- Create index for sector_id
CREATE INDEX idx_marcas_detalladas_sector_id ON marcas_detalladas(sector_id);

COMMIT;
