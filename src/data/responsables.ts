import type { Responsable } from '@/types';

export const responsables: Responsable[] = [
  {
    id: 'resp-01',
    nombre: 'Camila Restrepo',
    cargo: 'Directora Comercial',
    iniciales: 'CR',
    avatarColor: '#0a4269',
  },
  {
    id: 'resp-02',
    nombre: 'Juan Pablo Osorio',
    cargo: 'Ejecutivo de Cuentas',
    iniciales: 'JO',
    avatarColor: '#12a150',
  },
  {
    id: 'resp-03',
    nombre: 'Valentina Gómez',
    cargo: 'Ejecutiva de Cuentas',
    iniciales: 'VG',
    avatarColor: '#a8d400',
  },
  {
    id: 'resp-04',
    nombre: 'Andrés Felipe Duarte',
    cargo: 'Coordinador de Activaciones',
    iniciales: 'AD',
    avatarColor: '#d68a00',
  },
  {
    id: 'resp-05',
    nombre: 'Laura Martínez',
    cargo: 'Analista de Cumplimiento',
    iniciales: 'LM',
    avatarColor: '#2563eb',
  },
];

export function getResponsable(id: string): Responsable | undefined {
  return responsables.find((r) => r.id === id);
}
