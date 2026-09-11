BEGIN;

-- Add compania_id to transactional tables
-- These tables store data specific to each company

-- Activos table - company-specific assets
ALTER TABLE activos ADD COLUMN compania_id UUID REFERENCES companias(id);
UPDATE activos SET compania_id = (SELECT compania_id FROM auth_credentials LIMIT 1) WHERE compania_id IS NULL;
ALTER TABLE activos ALTER COLUMN compania_id SET NOT NULL;
CREATE INDEX idx_activos_compania_id ON activos(compania_id);

-- Oportunidades table - company-specific opportunities
ALTER TABLE oportunidades ADD COLUMN compania_id UUID REFERENCES companias(id);
UPDATE oportunidades SET compania_id = (SELECT compania_id FROM auth_credentials LIMIT 1) WHERE compania_id IS NULL;
ALTER TABLE oportunidades ALTER COLUMN compania_id SET NOT NULL;
CREATE INDEX idx_oportunidades_compania_id ON oportunidades(compania_id);
CREATE UNIQUE INDEX idx_oportunidades_compania_id_uniq ON oportunidades(compania_id, id);

-- Acuerdos table - company-specific agreements
ALTER TABLE acuerdos ADD COLUMN compania_id UUID REFERENCES companias(id);
UPDATE acuerdos SET compania_id = (SELECT compania_id FROM auth_credentials LIMIT 1) WHERE compania_id IS NULL;
ALTER TABLE acuerdos ALTER COLUMN compania_id SET NOT NULL;
CREATE INDEX idx_acuerdos_compania_id ON acuerdos(compania_id);
CREATE UNIQUE INDEX idx_acuerdos_compania_id_uniq ON acuerdos(compania_id, id);

-- Compromisos table - company-specific commitments
ALTER TABLE compromisos ADD COLUMN compania_id UUID REFERENCES companias(id);
UPDATE compromisos SET compania_id = (
  SELECT ac.compania_id FROM acuerdos ac WHERE ac.id = compromisos.acuerdo_id LIMIT 1
) WHERE compania_id IS NULL;
ALTER TABLE compromisos ALTER COLUMN compania_id SET NOT NULL;
CREATE INDEX idx_compromisos_compania_id ON compromisos(compania_id);
CREATE UNIQUE INDEX idx_compromisos_compania_id_uniq ON compromisos(compania_id, id);

-- Campanas_audiencia table - company-specific campaigns
ALTER TABLE campanas_audiencia ADD COLUMN compania_id UUID REFERENCES companias(id);
UPDATE campanas_audiencia SET compania_id = (SELECT compania_id FROM auth_credentials LIMIT 1) WHERE compania_id IS NULL;
ALTER TABLE campanas_audiencia ALTER COLUMN compania_id SET NOT NULL;
CREATE INDEX idx_campanas_compania_id ON campanas_audiencia(compania_id);
CREATE UNIQUE INDEX idx_campanas_compania_id_uniq ON campanas_audiencia(compania_id, id);

-- Evidencias table - company-specific evidence
ALTER TABLE evidencias ADD COLUMN compania_id UUID REFERENCES companias(id);
UPDATE evidencias SET compania_id = (
  SELECT ac.compania_id FROM acuerdos ac WHERE ac.id = evidencias.acuerdo_id LIMIT 1
) WHERE compania_id IS NULL;
ALTER TABLE evidencias ALTER COLUMN compania_id SET NOT NULL;
CREATE INDEX idx_evidencias_compania_id ON evidencias(compania_id);
CREATE UNIQUE INDEX idx_evidencias_compania_id_uniq ON evidencias(compania_id, id);

-- Reportes table - company-specific reports
ALTER TABLE reportes ADD COLUMN compania_id UUID REFERENCES companias(id);
UPDATE reportes SET compania_id = (
  SELECT ac.compania_id FROM acuerdos ac WHERE ac.id = reportes.acuerdo_id LIMIT 1
) WHERE compania_id IS NULL;
ALTER TABLE reportes ALTER COLUMN compania_id SET NOT NULL;
CREATE INDEX idx_reportes_compania_id ON reportes(compania_id);
CREATE UNIQUE INDEX idx_reportes_compania_id_uniq ON reportes(compania_id, id);

-- Activi dades_oportunidad table - company-specific activity
ALTER TABLE actividades_oportunidad ADD COLUMN compania_id UUID REFERENCES companias(id);
UPDATE actividades_oportunidad SET compania_id = (
  SELECT o.compania_id FROM oportunidades o WHERE o.id = actividades_oportunidad.oportunidad_id LIMIT 1
) WHERE compania_id IS NULL;
ALTER TABLE actividades_oportunidad ALTER COLUMN compania_id SET NOT NULL;
CREATE INDEX idx_actividades_compania_id ON actividades_oportunidad(compania_id);

COMMIT;
