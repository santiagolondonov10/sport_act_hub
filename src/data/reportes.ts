import type { Reporte } from '@/types';

export const reportes: Reporte[] = [
  {
    id: 'rep-01',
    acuerdoId: 'ac-01',
    periodoInicio: '2026-02-01',
    periodoFin: '2026-08-31',
    narrativa:
      'Durante los primeros meses de la temporada, el patrocinio de camiseta titular ha mantenido una exposición sostenida en transmisiones de Liga BetPlay y Copa Colombia, con crecimiento constante en interacción digital tras cada partido de local.',
    alcanceTotal: 18500000,
    impresionesTotales: 42300000,
    interacciones: 890000,
    valorMediaticoEstimadoCOP: 3650000000,
    metricasMensuales: [
      { mes: 'Marzo', alcance: 2400000, impresiones: 5100000, interacciones: 98000 },
      { mes: 'Abril', alcance: 2650000, impresiones: 5600000, interacciones: 112000 },
      { mes: 'Mayo', alcance: 2900000, impresiones: 6200000, interacciones: 125000 },
      { mes: 'Junio', alcance: 3100000, impresiones: 6800000, interacciones: 140000 },
      { mes: 'Julio', alcance: 3450000, impresiones: 7400000, interacciones: 158000 },
      { mes: 'Agosto', alcance: 3800000, impresiones: 8100000, interacciones: 175000 },
    ],
  },
  {
    id: 'rep-02',
    acuerdoId: 'ac-02',
    periodoInicio: '2025-10-15',
    periodoFin: '2026-08-31',
    narrativa:
      'La presencia en vallas LED de Banco Meridiano ha acumulado alta visibilidad en transmisiones de televisión, con un pico de interacción coincidiendo con el cambio de diseño de marca instalado en agosto.',
    alcanceTotal: 9800000,
    impresionesTotales: 21400000,
    interacciones: 210000,
    valorMediaticoEstimadoCOP: 980000000,
    metricasMensuales: [
      { mes: 'Mayo', alcance: 1500000, impresiones: 3200000, interacciones: 28000 },
      { mes: 'Junio', alcance: 1620000, impresiones: 3450000, interacciones: 31000 },
      { mes: 'Julio', alcance: 1780000, impresiones: 3800000, interacciones: 35000 },
      { mes: 'Agosto', alcance: 1950000, impresiones: 4100000, interacciones: 41000 },
    ],
  },
  {
    id: 'rep-03',
    acuerdoId: 'ac-03',
    periodoInicio: '2026-03-05',
    periodoFin: '2026-08-31',
    narrativa:
      'El paquete digital de Conecta Móvil viene superando las expectativas de interacción, impulsado por el contenido de historias de activación y las piezas dedicadas publicadas en el feed principal.',
    alcanceTotal: 6200000,
    impresionesTotales: 14100000,
    interacciones: 385000,
    valorMediaticoEstimadoCOP: 640000000,
    metricasMensuales: [
      { mes: 'Mayo', alcance: 950000, impresiones: 2100000, interacciones: 58000 },
      { mes: 'Junio', alcance: 1050000, impresiones: 2350000, interacciones: 64000 },
      { mes: 'Julio', alcance: 1180000, impresiones: 2600000, interacciones: 71000 },
      { mes: 'Agosto', alcance: 1320000, impresiones: 2950000, interacciones: 79000 },
    ],
  },
  {
    id: 'rep-04',
    acuerdoId: 'ac-04',
    periodoInicio: '2026-04-14',
    periodoFin: '2026-08-31',
    narrativa:
      'El acuerdo de experiencias y contenido de marca con NovaTech Soluciones se acerca a su fecha de vencimiento. Los resultados de alcance respaldan una conversación de renovación con condiciones ampliadas.',
    alcanceTotal: 4100000,
    impresionesTotales: 8900000,
    interacciones: 156000,
    valorMediaticoEstimadoCOP: 610000000,
    metricasMensuales: [
      { mes: 'Mayo', alcance: 850000, impresiones: 1900000, interacciones: 31000 },
      { mes: 'Junio', alcance: 920000, impresiones: 2050000, interacciones: 34000 },
      { mes: 'Julio', alcance: 980000, impresiones: 2200000, interacciones: 37000 },
      { mes: 'Agosto', alcance: 1050000, impresiones: 2350000, interacciones: 40000 },
    ],
  },
  {
    id: 'rep-05',
    acuerdoId: 'ac-05',
    periodoInicio: '2025-06-01',
    periodoFin: '2026-05-31',
    narrativa:
      'El ciclo completo del newsletter oficial de patrocinadores con Café Sierra Nevada cerró con los 12 envíos programados entregados en tiempo, manteniendo una tasa de apertura estable durante todo el año.',
    alcanceTotal: 1020000,
    impresionesTotales: 1020000,
    interacciones: 61000,
    valorMediaticoEstimadoCOP: 78000000,
    metricasMensuales: [
      { mes: 'Febrero', alcance: 84000, impresiones: 84000, interacciones: 5100 },
      { mes: 'Marzo', alcance: 85500, impresiones: 85500, interacciones: 5300 },
      { mes: 'Abril', alcance: 86200, impresiones: 86200, interacciones: 5450 },
      { mes: 'Mayo', alcance: 87000, impresiones: 87000, interacciones: 5600 },
    ],
  },
];

export function getReporte(id: string): Reporte | undefined {
  return reportes.find((r) => r.id === id);
}

export function getReportePorAcuerdo(acuerdoId: string): Reporte | undefined {
  return reportes.find((r) => r.acuerdoId === acuerdoId);
}
