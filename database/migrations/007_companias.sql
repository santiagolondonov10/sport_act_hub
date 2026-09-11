BEGIN;

CREATE TABLE companias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    sector TEXT NOT NULL,
    nombre_contacto TEXT NOT NULL,
    telefono_contacto TEXT NOT NULL,
    telefono2_contacto TEXT,
    mail_contacto TEXT NOT NULL,
    mail2_contacto TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT companias_nombre_not_empty CHECK (LENGTH(TRIM(nombre)) > 0),
    CONSTRAINT companias_sector_not_empty CHECK (LENGTH(TRIM(sector)) > 0),
    CONSTRAINT companias_mail_contacto_format CHECK (POSITION('@' IN mail_contacto) > 1),
    CONSTRAINT companias_mail2_contacto_format CHECK (mail2_contacto IS NULL OR POSITION('@' IN mail2_contacto) > 1)
);

CREATE INDEX companias_nombre_idx ON companias (LOWER(nombre));
CREATE INDEX companias_sector_idx ON companias (LOWER(sector));

COMMENT ON COLUMN companias.logo_url IS 'URL o ruta del logo. El almacenamiento binario se incorporará con la capa de archivos.';

COMMIT;