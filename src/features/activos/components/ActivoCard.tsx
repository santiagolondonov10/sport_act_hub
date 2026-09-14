import { Link } from 'react-router-dom';
import { Package, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/formatters';
import { getInsigniasAudiencia } from '@/lib/activoAudiencia';
import type { Activo } from '@/types';

export function ActivoCard({ activo }: { activo: Activo }) {
  const insigniasAudiencia = getInsigniasAudiencia(activo);

  return (
    <Link
      to={`/activos/${activo.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className="flex h-24 items-center justify-center"
        style={{ backgroundColor: `${activo.imagenColor}1a` }}
      >
        <Package size={28} style={{ color: activo.imagenColor }} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-800">{activo.nombre}</h3>
          <Badge estado={activo.estado} />
        </div>
        <p className="text-xs text-gray-500">{activo.categoriaNombre || 'Sin categoría'} · {activo.canal}</p>
        <p className="line-clamp-2 text-xs text-gray-500">{activo.descripcion}</p>
        {insigniasAudiencia.length > 0 && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-info-50 px-2 py-0.5 text-[11px] font-medium text-info-700">
            <UsersRound size={11} />
            {insigniasAudiencia[0]}
            {insigniasAudiencia.length > 1 ? ` +${insigniasAudiencia.length - 1}` : ''}
          </span>
        )}
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="font-semibold text-gray-900">{formatCurrency(activo.valoracionCOP)}</span>
          <span className="text-xs text-gray-500">
            {activo.inventarioDisponible}/{activo.inventarioTotal} disponible
          </span>
        </div>
      </div>
    </Link>
  );
}
