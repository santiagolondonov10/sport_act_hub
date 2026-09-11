interface ProgressBarProps {
  valor: number;
  className?: string;
  colorClase?: string;
}

export function ProgressBar({ valor, className = '', colorClase }: ProgressBarProps) {
  const porcentaje = Math.min(100, Math.max(0, valor));
  const color = colorClase ?? (porcentaje >= 100 ? 'bg-success-500' : porcentaje >= 50 ? 'bg-info-500' : 'bg-warning-500');

  return (
    <div
      role="progressbar"
      aria-valuenow={porcentaje}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className}`}
    >
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${porcentaje}%` }} />
    </div>
  );
}
