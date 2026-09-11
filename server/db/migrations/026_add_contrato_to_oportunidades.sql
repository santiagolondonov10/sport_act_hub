-- Agregar campo para contrato PDF a oportunidades
ALTER TABLE oportunidades ADD COLUMN contrato_url VARCHAR(1024);
ALTER TABLE oportunidades ADD COLUMN contrato_nombre VARCHAR(255);
