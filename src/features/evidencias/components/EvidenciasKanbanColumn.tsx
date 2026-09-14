import { useDroppable } from '@dnd-kit/core';
import { getEstiloEstado } from '@/lib/statusStyles';
import type { Evidencia, EstadoEvidencia } from '@/types';
import { EvidenciaCard } from './EvidenciaCard';

interface EvidenciasKanbanColumnProps {
  estado: EstadoEvidencia;
  evidencias: Evidencia[];
  onSeleccionar: (evidencia: Evidencia) => void;
}

export function EvidenciasKanbanColumn({ estado, evidencias, onSeleccionar }: EvidenciasKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  const estilo = getEstiloEstado(estado);

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-xl bg-gray-100/70">
      <div className="flex items-center justify-between px-3 pt-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${estilo.clases}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} />
          {estado}
        </span>
        <span className="text-xs font-medium text-gray-500">{evidencias.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto rounded-b-xl p-2 transition-colors ${
          isOver ? 'bg-brand-800/5' : ''
        }`}
        style={{ minHeight: 200 }}
      >
        {evidencias.map((evidencia) => (
          <div key={evidencia.id} className="cursor-grab active:cursor-grabbing">
            <EvidenciaCard
              evidencia={evidencia}
              onSeleccionar={() => onSeleccionar(evidencia)}
            />
          </div>
        ))}
        {evidencias.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-gray-400">Sin evidencias en este estado</p>
        )}
      </div>
    </div>
  );
}
