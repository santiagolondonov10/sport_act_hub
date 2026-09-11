/**
 * Tipos del módulo "Audiencias y alcance".
 *
 * Representan únicamente información AGREGADA sobre las audiencias de la
 * organización deportiva (contactos propios, seguidores, canales, campañas).
 * Los datos personales individuales de aficionados viven en Sports Act GO,
 * nunca en Business Hub — por eso ninguna entidad de este archivo modela
 * personas, sino segmentos, canales y resultados consolidados.
 */

export type TipoAudiencia = 'Propia' | 'Social' | 'Presencial' | 'Mixta';

export type EstadoAudiencia = 'Activable' | 'Requiere actualización' | 'No disponible';

export type FuenteDatoAudiencia = 'Sports Act GO' | 'Manual' | 'Red social';

export type CapacidadSegmentacion = 'Alta' | 'Media' | 'Baja' | 'No disponible';

export type EstadoCapacidadActivacion = 'Disponible' | 'Disponible con ajustes' | 'No disponible';

export type EstadoCampanaAudiencia = 'Borrador' | 'Activa' | 'Finalizada';

export const TIPOS_AUDIENCIA: TipoAudiencia[] = ['Propia', 'Social', 'Presencial', 'Mixta'];

export const ESTADOS_AUDIENCIA: EstadoAudiencia[] = [
  'Activable',
  'Requiere actualización',
  'No disponible',
];

export const CAPACIDADES_SEGMENTACION: CapacidadSegmentacion[] = ['Alta', 'Media', 'Baja', 'No disponible'];

export const ESTADOS_CAPACIDAD_ACTIVACION: EstadoCapacidadActivacion[] = [
  'Disponible',
  'Disponible con ajustes',
  'No disponible',
];

export const INDICADORES_AUDIENCIA: string[] = [
  'Envíos',
  'Entregas',
  'Aperturas',
  'Clics',
  'Visitas',
  'Registros',
  'Leads',
  'Conversiones',
  'Ventas',
  'Participación',
  'Alcance',
  'Interacciones',
  'Reproducciones',
  'Respuestas',
];

export interface SegmentoAudiencia {
  id: string;
  nombre: string;
  descripcion: string;
  tipoAudienciaLabel: string;
  tamano: number;
  crecimiento: number;
  canalPrincipal: string;
  indicadorDestacadoEtiqueta: string;
  indicadorDestacadoValor: string;
  tipoDato: TipoAudiencia;
  fuenteDato: FuenteDatoAudiencia;
  estado: EstadoAudiencia;
  intereses: string[];
  caracteristicas: string[];
  canalesDisponibles: string[];
  indicadoresDisponibles: string[];
  capacidadesActivacionIds: string[];
  activosRelacionadosIds: string[];
  campanasAnterioresIds: string[];
  actualizadoEn: string;
}

export interface CanalAudiencia {
  id: string;
  nombre: string;
  tipo: TipoAudiencia;
  tamanoAudiencia: number;
  alcancePeriodo: number;
  tasaInteraccion?: number;
  tasaConversion?: number;
  /** Variación porcentual frente al periodo anterior, cuando se conoce. */
  crecimientoPeriodo?: number;
  frecuenciaActivacion: string;
  capacidadSegmentacion: CapacidadSegmentacion;
  indicadoresDisponibles: string[];
  estado: EstadoAudiencia;
  activosRelacionadosIds: string[];
}

export interface CapacidadActivacion {
  id: string;
  nombre: string;
  descripcion: string;
  canalId: string;
  segmentosIds: string[];
  alcanceEstimado: number;
  indicadoresMedibles: string[];
  estado: EstadoCapacidadActivacion;
  activosRelacionadosIds: string[];
}

export interface CampanaAudiencia {
  id: string;
  nombre: string;
  objetivo: string;
  patrocinadorId?: string;
  segmentosIds: string[];
  canalesIds: string[];
  canalTexto: string;
  activoId?: string;
  acuerdoId?: string;
  periodoInicio: string;
  periodoFin: string;
  alcance: number;
  interacciones: number;
  registros: number;
  conversiones: number;
  metaIndicadores: Record<string, number>;
  resultadoIndicadores: Record<string, number>;
  estado: EstadoCampanaAudiencia;
  evidenciasIds: string[];
  recomendacionRenovacion: string;
}

export interface EstadoIntegracionGO {
  estado: 'No configurada' | 'Modo demostración' | 'Lista para integrar';
  ultimaActualizacionSimulada: string;
  mensaje: string;
}
