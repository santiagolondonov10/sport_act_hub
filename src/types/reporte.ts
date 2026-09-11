export interface MetricaMensual {
  mes: string;
  alcance: number;
  impresiones: number;
  interacciones: number;
}

export interface Reporte {
  id: string;
  acuerdoId: string;
  periodoInicio: string;
  periodoFin: string;
  narrativa: string;
  alcanceTotal: number;
  impresionesTotales: number;
  interacciones: number;
  valorMediaticoEstimadoCOP: number;
  metricasMensuales: MetricaMensual[];
}
