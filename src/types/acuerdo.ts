export type EstadoAcuerdo =
  | 'Borrador'
  | 'Activo'
  | 'Próximo a vencer'
  | 'Finalizado'
  | 'Cancelado';

export interface Acuerdo {
  id: string;
  nombre: string;
  marcaId: string;
  oportunidadOrigenId?: string;
  responsableId: string;
  responsableCorreo?: string;
  responsableTelefono?: string;
  valorCOP: number;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoAcuerdo;
  activosIncluidosIds?: string[];
  notasRenovacion: string;
  interesRenovacion: 'Alto' | 'Medio' | 'Bajo' | 'Sin definir';
}
