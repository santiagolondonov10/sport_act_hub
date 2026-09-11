import type { Prioridad } from './common';

export type CategoriaCompromiso =
  | 'Activación'
  | 'Contenido digital'
  | 'Hospitality'
  | 'Señalización'
  | 'Reportería'
  | 'Evento';

export type EstadoCompromiso =
  | 'Pendiente'
  | 'En curso'
  | 'En revisión'
  | 'Cumplido'
  | 'Vencido';

export const ESTADOS_COMPROMISO: EstadoCompromiso[] = [
  'Pendiente',
  'En curso',
  'En revisión',
  'Cumplido',
  'Vencido',
];

export interface Compromiso {
  id: string;
  acuerdoId: string;
  marcaId?: string;
  entregable: string;
  categoria: CategoriaCompromiso;
  responsableId: string;
  fechaLimite: string;
  prioridad: Prioridad;
  estado: EstadoCompromiso;
  progreso: number;
  evidenciasRequeridas: number;
  observaciones: string;
  /** Vínculo opcional con el módulo de Audiencias y alcance (información agregada). */
  segmentoAudienciaId?: string;
  canalAudienciaId?: string;
  campanaAudienciaId?: string;
  activoRelacionadoId?: string;
  indicadorComprometido?: string;
  metaIndicador?: number;
  periodoIndicador?: string;
}
