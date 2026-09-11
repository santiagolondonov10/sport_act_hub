BEGIN;

-- Crear tabla marcas_detalladas con todos los campos requeridos
CREATE TABLE IF NOT EXISTS marcas_detalladas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compania_id UUID NOT NULL REFERENCES companias(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tipo_identificacion VARCHAR(50) NOT NULL,
    identificacion VARCHAR(50) NOT NULL,
    rut_url TEXT,
    persona_contacto_1 TEXT,
    telefono_contacto_1 VARCHAR(20),
    correo_contacto_1 VARCHAR(100),
    persona_contacto_2 TEXT,
    telefono_contacto_2 VARCHAR(20),
    correo_contacto_2 VARCHAR(100),
    persona_contacto_3 TEXT,
    telefono_contacto_3 VARCHAR(20),
    correo_contacto_3 VARCHAR(100),
    creado_por VARCHAR(255),
    actualizado_por VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_marcas_detalladas_compania_id ON marcas_detalladas(compania_id);
CREATE UNIQUE INDEX idx_marcas_detalladas_compania_identificacion ON marcas_detalladas(compania_id, identificacion);

COMMIT;
