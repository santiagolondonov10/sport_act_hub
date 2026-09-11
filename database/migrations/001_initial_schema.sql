BEGIN;

CREATE TABLE responsables (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    cargo TEXT NOT NULL,
    iniciales VARCHAR(8) NOT NULL,
    avatar_color VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marcas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    sector TEXT NOT NULL,
    logo_iniciales VARCHAR(8) NOT NULL,
    color_marca VARCHAR(32) NOT NULL,
    contacto_nombre TEXT NOT NULL,
    contacto_cargo TEXT NOT NULL,
    contacto_email TEXT NOT NULL,
    contacto_telefono TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    canal TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    valoracion_cop NUMERIC(15, 2) NOT NULL CHECK (valoracion_cop >= 0),
    inventario_total INTEGER NOT NULL CHECK (inventario_total >= 0),
    inventario_disponible INTEGER NOT NULL CHECK (inventario_disponible >= 0 AND inventario_disponible <= inventario_total),
    alcance_estimado TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('Disponible', 'Reservado', 'Vendido', 'Inactivo')),
    derechos_incluidos JSONB NOT NULL DEFAULT '[]'::jsonb,
    imagen_color VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE oportunidades (
    id TEXT PRIMARY KEY,
    marca_id TEXT NOT NULL REFERENCES marcas(id),
    responsable_id TEXT NOT NULL REFERENCES responsables(id),
    etapa TEXT NOT NULL CHECK (etapa IN ('Prospección', 'Contactado', 'Propuesta', 'Negociación', 'Firmada', 'Perdida', 'Cancelada')),
    valor_estimado_cop NUMERIC(15, 2) NOT NULL CHECK (valor_estimado_cop >= 0),
    probabilidad SMALLINT NOT NULL CHECK (probabilidad BETWEEN 0 AND 100),
    fecha_estimada_cierre DATE NOT NULL,
    proximo_paso TEXT NOT NULL,
    fecha_creacion DATE NOT NULL,
    motivo_perdida TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE oportunidad_activos (
    oportunidad_id TEXT NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
    activo_id TEXT NOT NULL REFERENCES activos(id),
    PRIMARY KEY (oportunidad_id, activo_id)
);

CREATE TABLE actividades_oportunidad (
    id TEXT PRIMARY KEY,
    oportunidad_id TEXT NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ NOT NULL,
    descripcion TEXT NOT NULL,
    autor TEXT NOT NULL
);

CREATE TABLE acuerdos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    marca_id TEXT NOT NULL REFERENCES marcas(id),
    oportunidad_origen_id TEXT REFERENCES oportunidades(id),
    responsable_id TEXT NOT NULL REFERENCES responsables(id),
    valor_cop NUMERIC(15, 2) NOT NULL CHECK (valor_cop >= 0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL CHECK (fecha_fin >= fecha_inicio),
    estado TEXT NOT NULL CHECK (estado IN ('Borrador', 'Activo', 'Próximo a vencer', 'Finalizado', 'Cancelado')),
    notas_renovacion TEXT NOT NULL DEFAULT '',
    interes_renovacion TEXT NOT NULL CHECK (interes_renovacion IN ('Alto', 'Medio', 'Bajo', 'Sin definir')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE acuerdo_activos (
    acuerdo_id TEXT NOT NULL REFERENCES acuerdos(id) ON DELETE CASCADE,
    activo_id TEXT NOT NULL REFERENCES activos(id),
    PRIMARY KEY (acuerdo_id, activo_id)
);

CREATE TABLE segmentos_audiencia (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo_dato TEXT NOT NULL CHECK (tipo_dato IN ('Propia', 'Social', 'Presencial', 'Mixta')),
    tamano INTEGER NOT NULL CHECK (tamano >= 0),
    crecimiento NUMERIC(7, 2) NOT NULL DEFAULT 0,
    canal_principal TEXT NOT NULL,
    indicador_destacado_etiqueta TEXT NOT NULL,
    indicador_destacado_valor TEXT NOT NULL,
    fuente_dato TEXT NOT NULL CHECK (fuente_dato IN ('Sports Act GO', 'Manual', 'Red social')),
    estado TEXT NOT NULL CHECK (estado IN ('Activable', 'Requiere actualización', 'No disponible')),
    intereses JSONB NOT NULL DEFAULT '[]'::jsonb,
    caracteristicas JSONB NOT NULL DEFAULT '[]'::jsonb,
    canales_disponibles JSONB NOT NULL DEFAULT '[]'::jsonb,
    indicadores_disponibles JSONB NOT NULL DEFAULT '[]'::jsonb,
    actualizado_en TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE canales_audiencia (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Propia', 'Social', 'Presencial', 'Mixta')),
    tamano_audiencia INTEGER NOT NULL CHECK (tamano_audiencia >= 0),
    alcance_periodo INTEGER NOT NULL CHECK (alcance_periodo >= 0),
    tasa_interaccion NUMERIC(7, 2),
    tasa_conversion NUMERIC(7, 2),
    crecimiento_periodo NUMERIC(7, 2),
    frecuencia_activacion TEXT NOT NULL,
    capacidad_segmentacion TEXT NOT NULL CHECK (capacidad_segmentacion IN ('Alta', 'Media', 'Baja', 'No disponible')),
    indicadores_disponibles JSONB NOT NULL DEFAULT '[]'::jsonb,
    estado TEXT NOT NULL CHECK (estado IN ('Activable', 'Requiere actualización', 'No disponible')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE capacidades_activacion (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    canal_id TEXT NOT NULL REFERENCES canales_audiencia(id),
    alcance_estimado INTEGER NOT NULL CHECK (alcance_estimado >= 0),
    indicadores_medibles JSONB NOT NULL DEFAULT '[]'::jsonb,
    estado TEXT NOT NULL CHECK (estado IN ('Disponible', 'Disponible con ajustes', 'No disponible')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE segmentos_capacidades (
    segmento_id TEXT NOT NULL REFERENCES segmentos_audiencia(id) ON DELETE CASCADE,
    capacidad_id TEXT NOT NULL REFERENCES capacidades_activacion(id) ON DELETE CASCADE,
    PRIMARY KEY (segmento_id, capacidad_id)
);

CREATE TABLE compromisos (
    id TEXT PRIMARY KEY,
    acuerdo_id TEXT NOT NULL REFERENCES acuerdos(id) ON DELETE CASCADE,
    entregable TEXT NOT NULL,
    categoria TEXT NOT NULL,
    responsable_id TEXT NOT NULL REFERENCES responsables(id),
    fecha_limite DATE NOT NULL,
    prioridad TEXT NOT NULL CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Urgente')),
    estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'En curso', 'En revisión', 'Cumplido', 'Vencido')),
    progreso SMALLINT NOT NULL DEFAULT 0 CHECK (progreso BETWEEN 0 AND 100),
    evidencias_requeridas INTEGER NOT NULL DEFAULT 0 CHECK (evidencias_requeridas >= 0),
    observaciones TEXT NOT NULL DEFAULT '',
    segmento_audiencia_id TEXT REFERENCES segmentos_audiencia(id),
    canal_audiencia_id TEXT REFERENCES canales_audiencia(id),
    activo_relacionado_id TEXT REFERENCES activos(id),
    indicador_comprometido TEXT,
    meta_indicador NUMERIC(15, 2),
    periodo_indicador TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campanas_audiencia (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    objetivo TEXT NOT NULL,
    patrocinador_id TEXT REFERENCES marcas(id),
    activo_id TEXT REFERENCES activos(id),
    acuerdo_id TEXT REFERENCES acuerdos(id),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL CHECK (periodo_fin >= periodo_inicio),
    alcance INTEGER NOT NULL DEFAULT 0 CHECK (alcance >= 0),
    interacciones INTEGER NOT NULL DEFAULT 0 CHECK (interacciones >= 0),
    registros INTEGER NOT NULL DEFAULT 0 CHECK (registros >= 0),
    conversiones INTEGER NOT NULL DEFAULT 0 CHECK (conversiones >= 0),
    meta_indicadores JSONB NOT NULL DEFAULT '{}'::jsonb,
    resultado_indicadores JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado TEXT NOT NULL CHECK (estado IN ('Borrador', 'Activa', 'Finalizada')),
    recomendacion_renovacion TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campana_segmentos (
    campana_id TEXT NOT NULL REFERENCES campanas_audiencia(id) ON DELETE CASCADE,
    segmento_id TEXT NOT NULL REFERENCES segmentos_audiencia(id),
    PRIMARY KEY (campana_id, segmento_id)
);

CREATE TABLE campana_canales (
    campana_id TEXT NOT NULL REFERENCES campanas_audiencia(id) ON DELETE CASCADE,
    canal_id TEXT NOT NULL REFERENCES canales_audiencia(id),
    PRIMARY KEY (campana_id, canal_id)
);

CREATE TABLE evidencias (
    id TEXT PRIMARY KEY,
    compromiso_id TEXT NOT NULL REFERENCES compromisos(id) ON DELETE CASCADE,
    acuerdo_id TEXT NOT NULL REFERENCES acuerdos(id),
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_ejecucion DATE NOT NULL,
    ubicacion_canal TEXT NOT NULL,
    responsable_id TEXT NOT NULL REFERENCES responsables(id),
    estado TEXT NOT NULL CHECK (estado IN ('En revisión', 'Aprobada', 'Rechazada')),
    color_preview VARCHAR(32) NOT NULL,
    url TEXT,
    campana_audiencia_id TEXT REFERENCES campanas_audiencia(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reportes (
    id TEXT PRIMARY KEY,
    acuerdo_id TEXT NOT NULL REFERENCES acuerdos(id) ON DELETE CASCADE,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL CHECK (periodo_fin >= periodo_inicio),
    narrativa TEXT NOT NULL,
    alcance_total INTEGER NOT NULL DEFAULT 0 CHECK (alcance_total >= 0),
    impresiones_totales INTEGER NOT NULL DEFAULT 0 CHECK (impresiones_totales >= 0),
    interacciones INTEGER NOT NULL DEFAULT 0 CHECK (interacciones >= 0),
    valor_mediatico_estimado_cop NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (valor_mediatico_estimado_cop >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reporte_metricas_mensuales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reporte_id TEXT NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    mes DATE NOT NULL,
    alcance INTEGER NOT NULL DEFAULT 0 CHECK (alcance >= 0),
    impresiones INTEGER NOT NULL DEFAULT 0 CHECK (impresiones >= 0),
    interacciones INTEGER NOT NULL DEFAULT 0 CHECK (interacciones >= 0),
    UNIQUE (reporte_id, mes)
);

CREATE INDEX idx_oportunidades_marca_id ON oportunidades(marca_id);
CREATE INDEX idx_oportunidades_responsable_id ON oportunidades(responsable_id);
CREATE INDEX idx_oportunidades_etapa ON oportunidades(etapa);
CREATE INDEX idx_acuerdos_marca_id ON acuerdos(marca_id);
CREATE INDEX idx_acuerdos_estado ON acuerdos(estado);
CREATE INDEX idx_compromisos_acuerdo_id ON compromisos(acuerdo_id);
CREATE INDEX idx_compromisos_estado_fecha ON compromisos(estado, fecha_limite);
CREATE INDEX idx_evidencias_compromiso_id ON evidencias(compromiso_id);
CREATE INDEX idx_campanas_acuerdo_id ON campanas_audiencia(acuerdo_id);

COMMIT;