import { acuerdos, activos, compromisos, evidencias, marcas, oportunidades, responsables } from '@/data';
import type { EstadoCompromiso, EtapaOportunidad } from '@/types';
import { diasHasta } from './format';

const ETAPAS_ABIERTAS: EtapaOportunidad[] = [
  'Prospección',
  'Contactado',
  'Propuesta',
  'Negociación',
];

const ESTADOS_ACUERDO_VIGENTE = ['Activo', 'Próximo a vencer'] as const;
const ESTADOS_ACUERDO_INGRESO = ['Activo', 'Próximo a vencer', 'Finalizado'] as const;

export function getValorPipeline(): number {
  return oportunidades
    .filter((o) => ETAPAS_ABIERTAS.includes(o.etapa))
    .reduce((total, o) => total + o.valorEstimadoCOP, 0);
}

export function getIngresosCerrados(): number {
  return acuerdos
    .filter((a) => (ESTADOS_ACUERDO_INGRESO as readonly string[]).includes(a.estado))
    .reduce((total, a) => total + a.valorCOP, 0);
}

export function getActivosDisponiblesCount(): number {
  return activos.filter((a) => a.estado === 'Disponible').length;
}

export function getAcuerdosActivosCount(): number {
  return acuerdos.filter((a) => (ESTADOS_ACUERDO_VIGENTE as readonly string[]).includes(a.estado)).length;
}

export function getCumplimientoPorAcuerdo(acuerdoId: string): number {
  const delAcuerdo = compromisos.filter((c) => c.acuerdoId === acuerdoId);
  if (delAcuerdo.length === 0) return 0;
  const cumplidos = delAcuerdo.filter((c) => c.estado === 'Cumplido').length;
  return Math.round((cumplidos / delAcuerdo.length) * 100);
}

export function getCumplimientoGeneral(): number {
  if (compromisos.length === 0) return 0;
  const cumplidos = compromisos.filter((c) => c.estado === 'Cumplido').length;
  return Math.round((cumplidos / compromisos.length) * 100);
}

export function getCompromisosPendientesCount(): number {
  return compromisos.filter((c) => c.estado === 'Pendiente' || c.estado === 'En curso').length;
}

export function getCompromisosVencidosCount(): number {
  return compromisos.filter((c) => c.estado === 'Vencido').length;
}

export interface AcuerdoProximoAVencer {
  id: string;
  nombre: string;
  marcaNombre: string;
  fechaFin: string;
  diasRestantes: number;
}

export function getAcuerdosProximosAVencer(limiteDias = 90): AcuerdoProximoAVencer[] {
  return acuerdos
    .filter((a) => a.estado === 'Próximo a vencer' || a.estado === 'Activo')
    .map((a) => ({
      id: a.id,
      nombre: a.nombre,
      marcaNombre: marcas.find((m) => m.id === a.marcaId)?.nombre ?? 'Sin marca',
      fechaFin: a.fechaFin,
      diasRestantes: diasHasta(a.fechaFin),
    }))
    .filter((a) => a.diasRestantes <= limiteDias)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}

export interface EtapaPipelineResumen {
  etapa: EtapaOportunidad;
  cantidad: number;
  valorCOP: number;
}

export function getPipelinePorEtapa(): EtapaPipelineResumen[] {
  const etapas: EtapaOportunidad[] = [
    'Prospección',
    'Contactado',
    'Propuesta',
    'Negociación',
    'Firmada',
    'Perdida',
  ];
  return etapas.map((etapa) => {
    const enEtapa = oportunidades.filter((o) => o.etapa === etapa);
    return {
      etapa,
      cantidad: enEtapa.length,
      valorCOP: enEtapa.reduce((total, o) => total + o.valorEstimadoCOP, 0),
    };
  });
}

export interface EstadoCompromisoResumen {
  estado: EstadoCompromiso;
  cantidad: number;
}

export function getCompromisosPorEstado(): EstadoCompromisoResumen[] {
  const estados: EstadoCompromiso[] = ['Pendiente', 'En curso', 'En revisión', 'Cumplido', 'Vencido'];
  return estados.map((estado) => ({
    estado,
    cantidad: compromisos.filter((c) => c.estado === estado).length,
  }));
}

export interface CumplimientoMensual {
  mes: string;
  cumplimiento: number;
}

const NOMBRES_MES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export function getCumplimientoMensual(cantidadMeses = 6): CumplimientoMensual[] {
  const hoy = new Date();
  const meses: CumplimientoMensual[] = [];

  for (let i = cantidadMeses - 1; i >= 0; i--) {
    const fechaMes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const anio = fechaMes.getFullYear();
    const mesIndex = fechaMes.getMonth();

    const compromisosDelMes = compromisos.filter((c) => {
      const fecha = new Date(`${c.fechaLimite}T00:00:00`);
      return fecha.getFullYear() === anio && fecha.getMonth() === mesIndex;
    });

    const cumplidos = compromisosDelMes.filter((c) => c.estado === 'Cumplido').length;
    const cumplimiento =
      compromisosDelMes.length > 0 ? Math.round((cumplidos / compromisosDelMes.length) * 100) : 0;

    meses.push({ mes: NOMBRES_MES[mesIndex], cumplimiento });
  }

  return meses;
}

export interface ActividadReciente {
  id: string;
  tipo: 'oportunidad' | 'evidencia' | 'compromiso';
  descripcion: string;
  fecha: string;
  autor: string;
}

export function getActividadReciente(limite = 8): ActividadReciente[] {
  const deOportunidades: ActividadReciente[] = oportunidades.flatMap((o) =>
    o.actividad.map((a) => ({
      id: a.id,
      tipo: 'oportunidad' as const,
      descripcion: a.descripcion,
      fecha: a.fecha,
      autor: a.autor,
    })),
  );

  const deEvidencias: ActividadReciente[] = evidencias.map((e) => ({
    id: e.id,
    tipo: 'evidencia' as const,
    descripcion: `Evidencia registrada: ${e.titulo}`,
    fecha: e.fechaEjecucion,
    autor: responsables.find((r) => r.id === e.responsableId)?.nombre ?? 'Equipo comercial',
  }));

  return [...deOportunidades, ...deEvidencias]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, limite);
}

export interface AlertaOperativa {
  id: string;
  nivel: 'alta' | 'media';
  mensaje: string;
}

export function getAlertasOperativas(): AlertaOperativa[] {
  const alertas: AlertaOperativa[] = [];

  const vencidos = getCompromisosVencidosCount();
  if (vencidos > 0) {
    alertas.push({
      id: 'alerta-vencidos',
      nivel: 'alta',
      mensaje: `${vencidos} compromiso(s) vencido(s) requieren atención inmediata.`,
    });
  }

  const proximosAVencer = getAcuerdosProximosAVencer(60);
  if (proximosAVencer.length > 0) {
    alertas.push({
      id: 'alerta-vencimiento',
      nivel: 'media',
      mensaje: `${proximosAVencer.length} acuerdo(s) vencen en menos de 60 días.`,
    });
  }

  const evidenciasRechazadas = evidencias.filter((e) => e.estado === 'Rechazada').length;
  if (evidenciasRechazadas > 0) {
    alertas.push({
      id: 'alerta-evidencias',
      nivel: 'media',
      mensaje: `${evidenciasRechazadas} evidencia(s) rechazada(s) esperan corrección.`,
    });
  }

  const evidenciasEnRevision = evidencias.filter((e) => e.estado === 'En revisión').length;
  if (evidenciasEnRevision > 0) {
    alertas.push({
      id: 'alerta-revision',
      nivel: 'media',
      mensaje: `${evidenciasEnRevision} evidencia(s) esperan revisión de aprobación.`,
    });
  }

  return alertas;
}

export interface NotificacionMock {
  id: string;
  mensaje: string;
  fecha: string;
}

export function getNotificaciones(): NotificacionMock[] {
  const notificaciones: NotificacionMock[] = [];

  for (const acuerdo of getAcuerdosProximosAVencer(60).slice(0, 2)) {
    notificaciones.push({
      id: `notif-${acuerdo.id}`,
      mensaje: `El acuerdo con ${acuerdo.marcaNombre} vence en ${acuerdo.diasRestantes} días.`,
      fecha: acuerdo.fechaFin,
    });
  }

  for (const compromiso of compromisos.filter((c) => c.estado === 'Vencido').slice(0, 2)) {
    notificaciones.push({
      id: `notif-${compromiso.id}`,
      mensaje: `Compromiso vencido: "${compromiso.entregable}".`,
      fecha: compromiso.fechaLimite,
    });
  }

  for (const evidencia of evidencias.filter((e) => e.estado === 'En revisión').slice(0, 2)) {
    notificaciones.push({
      id: `notif-${evidencia.id}`,
      mensaje: `Nueva evidencia en revisión: "${evidencia.titulo}".`,
      fecha: evidencia.fechaEjecucion,
    });
  }

  return notificaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}
