import { Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/formatters';
import type { Activo } from '@/types';

interface ActivoMarketplaceCardProps {
  activo: Activo & { compania_nombre?: string; compania_logo?: string; categoriaNombre?: string };
  onSeleccionar: () => void;
}

export function ActivoMarketplaceCard({ activo, onSeleccionar }: ActivoMarketplaceCardProps) {
  const primeraFoto = activo.fotos?.[0];

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full">
      {/* Header compacto con compañía */}
      <div className="bg-gradient-to-r from-brand-50 to-brand-100/50 px-2 py-1.5 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          {activo.compania_logo ? (
            activo.compania_logo.startsWith('http') || activo.compania_logo.startsWith('data:') ? (
              <img src={activo.compania_logo} alt={activo.compania_nombre} className="w-4 h-4 object-contain" />
            ) : (
              <span className="text-sm">{activo.compania_logo}</span>
            )
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {activo.compania_nombre ? activo.compania_nombre[0].toUpperCase() : 'C'}
            </div>
          )}
          <p className="text-[10px] font-medium text-gray-700 truncate">{activo.compania_nombre || 'Compañía'}</p>
        </div>
      </div>

      {/* Foto compacta */}
      <div className="relative h-20 bg-gray-100 overflow-hidden">
        {primeraFoto ? (
          <img
            src={`/api/activos/${activo.id}/fotos/${primeraFoto.id}`}
            alt={activo.nombre}
            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
            onClick={onSeleccionar}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Package size={24} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Contenido compacto */}
      <div className="flex-1 flex flex-col p-2">
        <h3 className="text-xs font-semibold text-gray-900 line-clamp-1 hover:text-brand-800 cursor-pointer" onClick={onSeleccionar}>
          {activo.nombre}
        </h3>

        <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{activo.categoriaNombre || activo.categoriaId || 'Sin categoría'}</p>

        <div className="mt-1.5 space-y-1 flex-1">
          <div className="flex justify-between">
            <p className="text-[9px] text-gray-500">Valor</p>
            <p className="text-[9px] font-semibold text-gray-900">{formatCurrency(activo.valoracionCOP || 0)}</p>
          </div>

          <div className="flex justify-between">
            <p className="text-[9px] text-gray-500">Stock</p>
            <p className="text-[9px] font-semibold text-gray-900">{activo.inventarioDisponible}/{activo.inventarioTotal}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-2 py-1.5">
        <Button
          variante="primario"
          onClick={onSeleccionar}
          className="w-full text-xs py-1"
          tamano="sm"
        >
          Ver
        </Button>
      </div>
    </div>
  );
}
