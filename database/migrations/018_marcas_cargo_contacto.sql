BEGIN;

ALTER TABLE marcas_detalladas
ADD COLUMN cargo_contacto_1 VARCHAR(255),
ADD COLUMN cargo_contacto_2 VARCHAR(255),
ADD COLUMN cargo_contacto_3 VARCHAR(255);

COMMIT;
