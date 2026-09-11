export interface EstiloEstado {
  clases: string;
  punto: string;
}

const NEUTRO: EstiloEstado = { clases: 'bg-gray-100 text-gray-700', punto: 'bg-gray-400' };

const mapaGenerico: Record<string, EstiloEstado> = {
  // Activos
  Disponible: { clases: 'bg-success-50 text-success-700', punto: 'bg-success-500' },
  Reservado: { clases: 'bg-warning-50 text-warning-700', punto: 'bg-warning-500' },
  Vendido: { clases: 'bg-info-50 text-info-700', punto: 'bg-info-500' },
  Inactivo: { clases: 'bg-gray-100 text-gray-600', punto: 'bg-gray-400' },

  // Oportunidades
  Prospección: { clases: 'bg-gray-100 text-gray-700', punto: 'bg-gray-400' },
  Contactado: { clases: 'bg-info-50 text-info-700', punto: 'bg-info-500' },
  Propuesta: { clases: 'bg-warning-50 text-warning-700', punto: 'bg-warning-500' },
  Negociación: { clases: 'bg-brand-700/10 text-brand-700', punto: 'bg-brand-700' },
  Firmada: { clases: 'bg-success-50 text-success-700', punto: 'bg-success-500' },
  Perdida: { clases: 'bg-danger-50 text-danger-700', punto: 'bg-danger-500' },
  Cancelada: { clases: 'bg-gray-100 text-gray-700', punto: 'bg-gray-400' },

  // Acuerdos
  Borrador: { clases: 'bg-gray-100 text-gray-600', punto: 'bg-gray-400' },
  Activo: { clases: 'bg-success-50 text-success-700', punto: 'bg-success-500' },
  'Próximo a vencer': { clases: 'bg-warning-50 text-warning-700', punto: 'bg-warning-500' },
  Finalizado: { clases: 'bg-info-50 text-info-700', punto: 'bg-info-500' },
  Cancelado: { clases: 'bg-danger-50 text-danger-700', punto: 'bg-danger-500' },

  // Compromisos
  Pendiente: { clases: 'bg-gray-100 text-gray-700', punto: 'bg-gray-400' },
  'En curso': { clases: 'bg-info-50 text-info-700', punto: 'bg-info-500' },
  'En revisión': { clases: 'bg-warning-50 text-warning-700', punto: 'bg-warning-500' },
  Cumplido: { clases: 'bg-success-50 text-success-700', punto: 'bg-success-500' },
  Vencido: { clases: 'bg-danger-50 text-danger-700', punto: 'bg-danger-500' },

  // Evidencias
  Aprobada: { clases: 'bg-success-50 text-success-700', punto: 'bg-success-500' },
  Rechazada: { clases: 'bg-danger-50 text-danger-700', punto: 'bg-danger-500' },

  // Prioridad
  Baja: { clases: 'bg-gray-100 text-gray-600', punto: 'bg-gray-400' },
  Media: { clases: 'bg-info-50 text-info-700', punto: 'bg-info-500' },
  Alta: { clases: 'bg-warning-50 text-warning-700', punto: 'bg-warning-500' },
  Urgente: { clases: 'bg-danger-50 text-danger-700', punto: 'bg-danger-500' },

  // Audiencias y alcance
  Activable: { clases: 'bg-success-50 text-success-700', punto: 'bg-success-500' },
  'Requiere actualización': { clases: 'bg-warning-50 text-warning-700', punto: 'bg-warning-500' },
  'Disponible con ajustes': { clases: 'bg-warning-50 text-warning-700', punto: 'bg-warning-500' },
  'No disponible': { clases: 'bg-gray-100 text-gray-600', punto: 'bg-gray-400' },
  Activa: { clases: 'bg-info-50 text-info-700', punto: 'bg-info-500' },

  // Tipo de audiencia (Propia / Social / Presencial / Mixta)
  Propia: { clases: 'bg-info-50 text-info-700', punto: 'bg-info-500' },
  Social: { clases: 'bg-violet-50 text-violet-700', punto: 'bg-violet-500' },
  Presencial: { clases: 'bg-success-50 text-success-700', punto: 'bg-success-500' },
  Mixta: { clases: 'bg-warning-50 text-warning-700', punto: 'bg-warning-500' },
};

export function getEstiloEstado(estado: string): EstiloEstado {
  return mapaGenerico[estado] ?? NEUTRO;
}
