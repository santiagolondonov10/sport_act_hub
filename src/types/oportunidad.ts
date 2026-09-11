export type EtapaOportunidad =
  | 'Prospección'
  | 'Contactado'
  | 'Propuesta'
  | 'Negociación'
  | 'Firmada'
  | 'Perdida'
  | 'Cancelada';

export const ETAPAS_OPORTUNIDAD: EtapaOportunidad[] = [
  'Prospección',
  'Contactado',
  'Propuesta',
  'Negociación',
  'Firmada',
  'Perdida',
  'Cancelada',
];

export interface ActividadOportunidad {
  id: string;
  fecha: string;
  descripcion: string;
  autor: string;
}

import type { DocumentoAdjunto } from './activo';

export interface ContratoAdjunto {
  nombre: string;
  base64: string;
}

export interface Oportunidad {
  id: string;
  marcaId: string;
  responsableId: string;
  etapa: EtapaOportunidad;
  valorEstimadoCOP: number;
  probabilidad: number;
  fechaEstimadaCierre: string;
  activosPropuestosIds: string[];
  proximoPaso: string;
  fechaCreacion: string;
  actividad: ActividadOportunidad[];
  motivoPerdida?: string;
  contratosAdjuntos?: ContratoAdjunto[];
  documentosAdjuntos?: DocumentoAdjunto[];
}
