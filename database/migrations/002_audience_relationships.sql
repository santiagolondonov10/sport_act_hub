BEGIN;

CREATE TABLE activo_audiencias (
    activo_id TEXT PRIMARY KEY REFERENCES activos(id) ON DELETE CASCADE,
    canal_activacion TEXT NOT NULL,
    tipo_audiencia TEXT NOT NULL CHECK (tipo_audiencia IN ('Propia', 'Social', 'Presencial', 'Mixta')),
    alcance_estimado INTEGER NOT NULL CHECK (alcance_estimado >= 0),
    capacidad_segmentacion TEXT NOT NULL CHECK (capacidad_segmentacion IN ('Alta', 'Media', 'Baja', 'No disponible')),
    indicadores_disponibles JSONB NOT NULL DEFAULT '[]'::jsonb,
    frecuencia_maxima TEXT NOT NULL,
    restricciones TEXT NOT NULL,
    requiere_go BOOLEAN NOT NULL DEFAULT FALSE,
    actualizado_en TIMESTAMPTZ NOT NULL
);

CREATE TABLE segmento_canales (
    segmento_id TEXT NOT NULL REFERENCES segmentos_audiencia(id) ON DELETE CASCADE,
    canal_id TEXT NOT NULL REFERENCES canales_audiencia(id) ON DELETE CASCADE,
    PRIMARY KEY (segmento_id, canal_id)
);

CREATE TABLE segmento_activos (
    segmento_id TEXT NOT NULL REFERENCES segmentos_audiencia(id) ON DELETE CASCADE,
    activo_id TEXT NOT NULL REFERENCES activos(id),
    PRIMARY KEY (segmento_id, activo_id)
);

CREATE TABLE segmento_campanas_anteriores (
    segmento_id TEXT NOT NULL REFERENCES segmentos_audiencia(id) ON DELETE CASCADE,
    campana_id TEXT NOT NULL REFERENCES campanas_audiencia(id) ON DELETE CASCADE,
    PRIMARY KEY (segmento_id, campana_id)
);

CREATE TABLE capacidad_activos (
    capacidad_id TEXT NOT NULL REFERENCES capacidades_activacion(id) ON DELETE CASCADE,
    activo_id TEXT NOT NULL REFERENCES activos(id),
    PRIMARY KEY (capacidad_id, activo_id)
);

CREATE TABLE campana_evidencias (
    campana_id TEXT NOT NULL REFERENCES campanas_audiencia(id) ON DELETE CASCADE,
    evidencia_id TEXT NOT NULL REFERENCES evidencias(id) ON DELETE CASCADE,
    PRIMARY KEY (campana_id, evidencia_id)
);

CREATE TABLE evolucion_contactos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mes VARCHAR(12) NOT NULL UNIQUE,
    contactos INTEGER NOT NULL CHECK (contactos >= 0)
);

COMMIT;