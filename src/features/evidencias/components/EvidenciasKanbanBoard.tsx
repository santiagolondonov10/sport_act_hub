import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Evidencia, EstadoEvidencia } from '@/types';
import { EvidenciasKanbanColumn } from './EvidenciasKanbanColumn';

interface EvidenciasKanbanBoardProps {
  evidencias: Evidencia[];
  onCambiarEstado: (id: string, estado: EstadoEvidencia) => void;
  onSeleccionar: (evidencia: Evidencia) => void;
  onSolicitarRevision?: (evidenciaId: string) => void;
}

const ESTADOS_KANBAN: EstadoEvidencia[] = ['En revisión', 'Aprobada', 'Rechazada'];

export function EvidenciasKanbanBoard({ evidencias, onCambiarEstado, onSeleccionar, onSolicitarRevision }: EvidenciasKanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const nuevoEstado = over.id as EstadoEvidencia;
    const evidencia = evidencias.find((e) => e.id === active.id);
    if (evidencia && evidencia.estado !== nuevoEstado) {
      try {
        onCambiarEstado(evidencia.id, nuevoEstado);
      } catch (error) {
        console.error('Error al cambiar estado:', error);
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ESTADOS_KANBAN.map((estado) => (
          <EvidenciasKanbanColumn
            key={estado}
            estado={estado}
            evidencias={evidencias.filter((e) => e.estado === estado)}
            onSeleccionar={onSeleccionar}
            onSolicitarRevision={onSolicitarRevision}
          />
        ))}
      </div>
    </DndContext>
  );
}
