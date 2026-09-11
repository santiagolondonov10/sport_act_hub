-- Create table for activo photos
CREATE TABLE IF NOT EXISTS activo_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activo_id TEXT NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
  foto_data BYTEA NOT NULL,
  nombre_archivo TEXT NOT NULL,
  tipo_mime TEXT NOT NULL DEFAULT 'image/jpeg',
  tamanio_bytes INTEGER NOT NULL,
  principal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activo_id, principal) -- Solo una foto principal por activo
);

CREATE INDEX idx_activo_fotos_activo_id ON activo_fotos(activo_id);

-- Alter activos table to add foto_id reference (optional, for quick access)
ALTER TABLE activos ADD COLUMN IF NOT EXISTS foto_principal_id UUID REFERENCES activo_fotos(id) ON DELETE SET NULL;
