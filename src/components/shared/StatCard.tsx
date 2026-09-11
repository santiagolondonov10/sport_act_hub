import { TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Tono = 'neutro' | 'exito' | 'advertencia' | 'peligro' | 'marca';

interface StatCardProps {
  etiqueta: string;
  valor: string;
  icono: LucideIcon;
  nota?: string;
  tono?: Tono;
  /** Variación porcentual frente al periodo anterior. Positivo o negativo. */
  variacion?: number;
}

const tonos: Record<Tono, string> = {
  neutro: 'bg-gray-100 text-gray-600',
  exito: 'bg-success-50 text-success-700',
  advertencia: 'bg-warning-50 text-warning-700',
  peligro: 'bg-danger-50 text-danger-700',
  marca: 'bg-brand-800/10 text-brand-800',
};

export function StatCard({ etiqueta, valor, icono: Icono, nota, tono = 'neutro', variacion }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{etiqueta}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tonos[tono]}`}>
          <Icono size={16} />
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-gray-900">{valor}</p>
        {variacion !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              variacion >= 0 ? 'text-success-700' : 'text-danger-700'
            }`}
          >
            {variacion >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {variacion >= 0 ? '+' : ''}
            {variacion.toFixed(1)}%
          </span>
        )}
      </div>
      {nota && <p className="mt-1 text-xs text-gray-500">{nota}</p>}
    </div>
  );
}
