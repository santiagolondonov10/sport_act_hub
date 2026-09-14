export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0';

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0';

  return num.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '$ 0';

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '$ 0';

  return `$ ${num.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
