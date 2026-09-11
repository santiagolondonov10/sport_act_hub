import { getEstiloEstado } from '@/lib/statusStyles';

interface BadgeProps {
  estado: string;
  className?: string;
}

export function Badge({ estado, className = '' }: BadgeProps) {
  const estilo = getEstiloEstado(estado);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${estilo.clases} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} aria-hidden="true" />
      {estado}
    </span>
  );
}
