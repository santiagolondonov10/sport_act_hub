import type { Activo } from '@/types';

/**
 * Insignias derivadas de la información agregada de audiencia de un activo.
 * Nunca se guardan como campo independiente: se calculan a partir de
 * `activo.audiencia` para evitar datos duplicados o inconsistentes.
 */
export function getInsigniasAudiencia(activo: Activo): string[] {
  const audiencia = activo.audiencia;
  if (!audiencia) return [];

  const insignias: string[] = [];
  if (audiencia.tipoAudiencia === 'Propia' || audiencia.tipoAudiencia === 'Mixta') {
    insignias.push('Audiencia propia');
  }
  if (audiencia.capacidadSegmentacion === 'Alta' || audiencia.capacidadSegmentacion === 'Media') {
    insignias.push('Segmentación disponible');
  }
  if (audiencia.indicadoresDisponibles.length > 0) {
    insignias.push('Medición disponible');
  }
  if (audiencia.requiereGO) {
    insignias.push('Activable con GO');
  }
  return insignias;
}
