import type { CapacidadSegmentacion, TipoAudiencia } from './audiencia';

export type CategoriaActivo =
  | 'Camiseta y uniforme'
  | 'Naming rights'
  | 'Vallas y pantallas'
  | 'Activos digitales'
  | 'Hospitality'
  | 'Activaciones'
  | 'Derechos de contenido'
  | 'Presencia en eventos'
  | 'Experiencias';

export type EstadoActivo = 'Disponible' | 'Reservado' | 'Vendido' | 'Inactivo';

export const CATEGORIAS_ACTIVO: CategoriaActivo[] = [
  'Camiseta y uniforme',
  'Naming rights',
  'Vallas y pantallas',
  'Activos digitales',
  'Hospitality',
  'Activaciones',
  'Derechos de contenido',
  'Presencia en eventos',
  'Experiencias',
];

export const ESTADOS_ACTIVO: EstadoActivo[] = ['Disponible', 'Reservado', 'Vendido', 'Inactivo'];

export interface FotoActivo {
  id: string;
  nombreArchivo: string;
  tipoMime: string;
  tamanioBytes: number;
  principal: boolean;
  createdAt: string;
}

export interface DocumentoAdjunto {
  nombre: string;
  base64: string;
}

/**
 * Información agregada sobre la audiencia y la capacidad de activación de un
 * activo. Opcional: solo aplica a activos con un componente de audiencia
 * (digitales, contenido, experiencias). Nunca contiene datos personales.
 */
export interface AudienciaActivo {
  segmentosRelacionadosIds: string[];
  canalActivacion: string;
  tipoAudiencia: TipoAudiencia;
  alcanceEstimado: number;
  capacidadSegmentacion: CapacidadSegmentacion;
  indicadoresDisponibles: string[];
  frecuenciaMaxima: string;
  restricciones: string;
  requiereGO: boolean;
  actualizadoEn: string;
}

export interface Activo {
  id: string;
  nombre: string;
  categoriaId: string;
  categoriaNombre?: string;
  canal: string;
  descripcion: string;
  valoracionCOP: number;
  inventarioTotal: number;
  inventarioDisponible: number;
  alcanceEstimado: string;
  estado: EstadoActivo;
  derechosIncluidos: string[];
  imagenColor: string;
  acuerdosAsociadosIds: string[];
  fotos?: FotoActivo[];
  documentosAdjuntos?: DocumentoAdjunto[];
  audiencia?: AudienciaActivo;
}
