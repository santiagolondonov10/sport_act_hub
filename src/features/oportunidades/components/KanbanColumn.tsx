import { useDroppable } from '@dnd-kit/core';
import { formatCOPCompact } from '@/lib/format';
import { getEstiloEstado } from '@/lib/statusStyles';
import type { EtapaOportunidad, Oportunidad } from '@/types';
import { OportunidadCard } from './OportunidadCard';

interface KanbanColumnProps {
  etapa: EtapaOportunidad;
  oportunidades: Oportunidad[];
  onCambiarEtapa: (id: string, etapa: EtapaOportunidad) => void;
}

export function KanbanColumn({ etapa, oportunidades, onCambiarEtapa }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  const estilo = getEstiloEstado(etapa);
  const valorTotal = oportunidades.reduce((total, o) => total + (o.valorEstimadoCOP || 0), 0);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-gray-100/70">
      <div className="flex items-center justify-between px-3 pt-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${estilo.clases}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} />
          {etapa}
        </span>
        <span className="text-xs font-medium text-gray-500">{oportunidades.length}</span>
      </div>
      <p className="px-3 pb-2 pt-1 text-xs text-gray-500">{formatCOPCompact(valorTotal)}</p>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto rounded-b-xl p-2 transition-colors ${
          isOver ? 'bg-brand-800/5' : ''
        }`}
        style={{ minHeight: 160 }}
      >
        {oportunidades.map((oportunidad) => (
          <OportunidadCard
            key={oportunidad.id}
            oportunidad={oportunidad}
            onCambiarEtapa={(nuevaEtapa) => onCambiarEtapa(oportunidad.id, nuevaEtapa)}
          />
        ))}
        {oportunidades.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-gray-400">Sin oportunidades en esta etapa</p>
        )}
      </div>
    </div>
  );
}
