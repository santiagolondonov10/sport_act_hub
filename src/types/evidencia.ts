export type TipoEvidencia =
  | 'Fotografía'
  | 'Captura de pantalla'
  | 'Enlace'
  | 'Documento'
  | 'Captura de campaña'
  | 'Informe de email'
  | 'Resultado de landing'
  | 'Registro de participantes'
  | 'Evidencia de publicación'
  | 'Reporte de conversión'
  | 'Encuesta'
  | 'Fotografía de activación';

export const TIPOS_EVIDENCIA: TipoEvidencia[] = [
  'Fotografía',
  'Captura de pantalla',
  'Enlace',
  'Documento',
  'Captura de campaña',
  'Informe de email',
  'Resultado de landing',
  'Registro de participantes',
  'Evidencia de publicación',
  'Reporte de conversión',
  'Encuesta',
  'Fotografía de activación',
];

export type EstadoEvidencia = 'En revisión' | 'Aprobada' | 'Rechazada';

export interface Evidencia {
  id: string;
  compromisoId: string;
  acuerdoId: string;
  tipo: TipoEvidencia;
  titulo: string;
  descripcion: string;
  fechaEjecucion: string;
  ubicacionCanal: string;
  responsableId: string;
  estado: EstadoEvidencia;
  colorPreview: string;
  url?: string;
  /** Campaña de audiencia que esta evidencia respalda, cuando aplica. */
  campanaAudienciaId?: string;
}
