BEGIN;

-- Crear tabla de categorías de activos
CREATE TABLE activo_categorias (
    id UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar las categorías existentes con IDs específicos
INSERT INTO activo_categorias (id, nombre, descripcion, is_active)
VALUES
    ('b4896acf-e559-4a36-b3e9-fb67b19d8851', 'Camiseta y uniforme', 'Patrocinio de camiseta, uniforme y equipamiento deportivo', TRUE),
    ('9663399d-d952-4656-96c8-59b5ecc23051', 'Naming rights', 'Derechos de nombre para estadios, canchas y sedes', TRUE),
    ('7dac53a5-3af2-4936-88e7-8d26d1675f02', 'Vallas y pantallas', 'Espacios publicitarios en vallas, pantallas y displayes', TRUE),
    ('0b735cfe-854a-4800-ac23-0ace188a9547', 'Activos digitales', 'Presencia en redes sociales, página web y plataformas digitales', TRUE),
    ('a3fdb2f1-f7a3-49bc-87ac-08fe4ad7ca7f', 'Hospitality', 'Servicios de hospitalidad, catering y experiencias VIP', TRUE),
    ('a4a89ebc-5aae-4ecc-8dfa-6f9642eba102', 'Activaciones', 'Activaciones de marca y eventos experienciales', TRUE),
    ('d97de1a6-95ed-46e7-ab96-531bad7f94f5', 'Derechos de contenido', 'Derechos de transmisión y distribución de contenido', TRUE),
    ('e73aa0b6-950c-4b6b-92c6-fe4f249a0ecf', 'Presencia en eventos', 'Presencia y activación en eventos deportivos y corporativos', TRUE),
    ('a36b2e85-6e9b-47f8-a940-654981dc7580', 'Experiencias', 'Experiencias exclusivas con jugadores, audiencias y fans', TRUE)
ON CONFLICT DO NOTHING;

-- Agregar columna con foreign key a la nueva tabla
ALTER TABLE activos
ADD COLUMN categoria_id UUID REFERENCES activo_categorias(id);

-- Migrar datos: asignar categoria_id basado en el nombre de la categoría
UPDATE activos a
SET categoria_id = (
    SELECT id FROM activo_categorias ac
    WHERE ac.nombre = a.categoria
    LIMIT 1
)
WHERE categoria IS NOT NULL AND categoria_id IS NULL;

-- Hacer categoria_id NOT NULL después de migrar los datos
ALTER TABLE activos
ALTER COLUMN categoria_id SET NOT NULL;

-- Crear índice para mejor rendimiento
CREATE INDEX idx_activos_categoria_id ON activos(categoria_id);

COMMIT;
