import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icono: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}

export function EmptyState({ icono: Icono, titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icono size={22} />
      </div>
      <p className="text-sm font-medium text-gray-900">{titulo}</p>
      {descripcion && <p className="mt-1 max-w-sm text-sm text-gray-500">{descripcion}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}
