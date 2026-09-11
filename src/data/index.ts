import type { Activo, Oportunidad, Acuerdo, Compromiso, Evidencia, Reporte, Marca, Responsable, SegmentoAudiencia, CanalAudiencia, CampanaAudiencia, CapacidadActivacion, EstadoIntegracionGO } from '@/types';
import { responsables as responsablesData } from './responsables.js';

export const activos: Activo[] = [];
export const oportunidades: Oportunidad[] = [];
export const acuerdos: Acuerdo[] = [];
export const compromisos: Compromiso[] = [];
export const evidencias: Evidencia[] = [];
export const reportes: Reporte[] = [];
export const marcas: Marca[] = [];
export const responsables: Responsable[] = responsablesData;
export const segmentosAudiencia: SegmentoAudiencia[] = [];
export const canalesAudiencia: CanalAudiencia[] = [];
export const campanasAudiencia: CampanaAudiencia[] = [];
export const capacidadesActivacion: CapacidadActivacion[] = [];
export const estadoIntegracionGO: EstadoIntegracionGO = {
  estado: 'No configurada',
  ultimaActualizacionSimulada: new Date().toISOString(),
  mensaje: 'Sin datos disponibles',
};

// Helper functions that return undefined (no mock data available)
export function getAcuerdo(_id: string): Acuerdo | undefined {
  return undefined;
}

export function getActivo(_id: string): Activo | undefined {
  return undefined;
}

export function getMarca(_id: string): Marca | undefined {
  return undefined;
}

export function getResponsable(_id: string): Responsable | undefined {
  return undefined;
}

export function getCompromisosPorAcuerdo(_acuerdoId: string): Compromiso[] {
  return [];
}

export function getEvidenciasPorCompromiso(_compromisoId: string): Evidencia[] {
  return [];
}

export function getReportePorAcuerdo(_acuerdoId: string): Reporte | undefined {
  return undefined;
}

export const evolucionContactosPropios: any[] = [];
