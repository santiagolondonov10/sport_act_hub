ALTER TABLE oportunidades DROP CONSTRAINT oportunidades_etapa_check;
ALTER TABLE oportunidades ADD CONSTRAINT oportunidades_etapa_check CHECK (etapa IN ('Prospección', 'Contactado', 'Propuesta', 'Negociación', 'Firmada', 'Perdida', 'Cancelada'));
