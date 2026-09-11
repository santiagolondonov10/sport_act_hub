import { useState } from 'react';
import { Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { canalesAudiencia } from '@/data';
import { formatNumero } from '@/lib/format';
import type { CapacidadActivacion } from '@/types';
import { ActivosRelacionadosModal } from './ActivosRelacionadosModal';

export function CapacidadesActivacionSection({ capacidades }: { capacidades: CapacidadActivacion[] }) {
  const [capacidadSeleccionada, setCapacidadSeleccionada] = useState<CapacidadActivacion | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Layers size={16} className="text-brand-800" />
        <h3 className="text-sm font-semibold text-gray-900">Capacidades disponibles para patrocinadores</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {capacidades.map((capacidad) => {
          const canal = canalesAudiencia.find((c) => c.id === capacidad.canalId);
          return (
            <div key={capacidad.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900">{capacidad.nombre}</h4>
                <Badge estado={capacidad.estado} />
              </div>
              <p className="mb-3 text-xs text-gray-500">{capacidad.descripcion}</p>
              <dl className="mb-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Canal</dt>
                  <dd className="font-medium text-gray-700">{canal?.nombre ?? 'Sin definir'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Alcance estimado</dt>
                  <dd className="font-medium text-gray-700">{formatNumero(capacidad.alcanceEstimado)}</dd>
                </div>
              </dl>
              <div className="mb-3 flex flex-wrap gap-1">
                {capacidad.indicadoresMedibles.map((indicador) => (
                  <span key={indicador} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                    {indicador}
                  </span>
                ))}
              </div>
              <Button
                variante="secundario"
                tamano="sm"
                onClick={() => setCapacidadSeleccionada(capacidad)}
                className="mt-auto w-full justify-center"
              >
                Ver activos relacionados
              </Button>
            </div>
          );
        })}
      </div>

      <ActivosRelacionadosModal
        abierto={Boolean(capacidadSeleccionada)}
        onCerrar={() => setCapacidadSeleccionada(null)}
        titulo={capacidadSeleccionada?.nombre ?? ''}
        activosIds={capacidadSeleccionada?.activosRelacionadosIds ?? []}
      />
    </div>
  );
}
