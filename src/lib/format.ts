const LOCALE = 'es-CO';

export function formatCOP(valor: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatCOPCompact(valor: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'COP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(valor);
}

export function formatNumero(valor: number): string {
  return new Intl.NumberFormat(LOCALE).format(valor);
}

export function formatNumeroCompacto(valor: number): string {
  return new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 }).format(
    valor,
  );
}

export function formatPorcentaje(valor: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    maximumFractionDigits: fractionDigits,
  }).format(valor / 100);
}

function esValidoISO(fechaISO: string | null | undefined): boolean {
  if (!fechaISO) return false;
  // Si ya contiene 'T', es una fecha completa; si no, es solo YYYY-MM-DD
  const fechaFormato = fechaISO.includes('T') ? fechaISO : `${fechaISO}T00:00:00`;
  const fecha = new Date(fechaFormato);
  return !isNaN(fecha.getTime());
}

export function formatFecha(fechaISO: string | null | undefined): string {
  if (!esValidoISO(fechaISO) || !fechaISO) return '-';
  const fechaFormato = fechaISO.includes('T') ? fechaISO : `${fechaISO}T00:00:00`;
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(fechaFormato));
}

export function formatFechaLarga(fechaISO: string | null | undefined): string {
  if (!esValidoISO(fechaISO) || !fechaISO) return '-';
  const fechaFormato = fechaISO.includes('T') ? fechaISO : `${fechaISO}T00:00:00`;
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fechaFormato));
}

export function formatFechaCorta(fechaISO: string | null | undefined): string {
  if (!esValidoISO(fechaISO) || !fechaISO) return '-';
  const fechaFormato = fechaISO.includes('T') ? fechaISO : `${fechaISO}T00:00:00`;
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(fechaFormato));
}

export function formatFechaHora(fechaISO: string | null | undefined): string {
  if (!fechaISO) return '-';
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return '-';
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

export function formatHora(fechaISO: string | null | undefined): string {
  if (!fechaISO) return '-';
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return '-';
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

export function diasHasta(fechaISO: string | null | undefined): number {
  if (!esValidoISO(fechaISO) || !fechaISO) return 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaFormato = fechaISO.includes('T') ? fechaISO : `${fechaISO}T00:00:00`;
  const fecha = new Date(fechaFormato);
  const diffMs = fecha.getTime() - hoy.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('');
}
