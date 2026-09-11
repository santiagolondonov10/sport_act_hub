BEGIN;

CREATE TABLE sectores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sectores_nombre_not_empty CHECK (LENGTH(TRIM(nombre)) > 0)
);

CREATE UNIQUE INDEX sectores_nombre_unique ON sectores (LOWER(nombre));

INSERT INTO sectores (nombre, descripcion)
VALUES
    ('Bebidas', 'Marcas de bebidas y consumo masivo.'),
    ('Banca y Finanzas', 'Entidades financieras, banca y servicios de inversión.'),
    ('Telecomunicaciones', 'Operadores y servicios de conectividad.'),
    ('Retail y Moda', 'Comercio minorista, moda y estilo de vida.'),
    ('Seguros', 'Compañías de seguros y gestión de riesgos.'),
    ('Movilidad', 'Automotores, transporte y soluciones de movilidad.'),
    ('Tecnología', 'Software, hardware y servicios tecnológicos.'),
    ('Energía', 'Energía, servicios públicos y sostenibilidad.'),
    ('Salud', 'Servicios, productos y organizaciones de salud.'),
    ('Agroindustria', 'Producción agrícola, alimentos y bebidas de origen.'),
    ('Educación', 'Instituciones y servicios educativos.'),
    ('Entretenimiento', 'Medios, ocio y experiencias de entretenimiento.')
ON CONFLICT DO NOTHING;

COMMIT;