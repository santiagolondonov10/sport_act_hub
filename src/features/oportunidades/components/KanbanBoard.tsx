import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { ETAPAS_OPORTUNIDAD } from '@/types';
import type { EtapaOportunidad, Oportunidad } from '@/types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  oportunidades: Oportunidad[];
  onCambiarEtapa: (id: string, etapa: EtapaOportunidad) => Promise<void>;
}

export function KanbanBoard({ oportunidades, onCambiarEtapa }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const nuevaEtapa = over.id as EtapaOportunidad;
    const oportunidad = oportunidades.find((o) => o.id === active.id);
    if (oportunidad && oportunidad.etapa !== nuevaEtapa) {
      try {
        await onCambiarEtapa(oportunidad.id, nuevaEtapa);
      } catch (error) {
        console.error('Error al cambiar etapa:', error);
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ETAPAS_OPORTUNIDAD.map((etapa) => (
          <KanbanColumn
            key={etapa}
            etapa={etapa}
            oportunidades={oportunidades.filter((o) => o.etapa === etapa)}
            onCambiarEtapa={onCambiarEtapa}
          />
        ))}
      </div>
    </DndContext>
  );
}
