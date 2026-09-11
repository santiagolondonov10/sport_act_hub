import { useNavigate } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import { CalendarClock, GripVertical } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { formatCOPCompact, formatFecha, iniciales } from '@/lib/format';
import { ETAPAS_OPORTUNIDAD } from '@/types';
import type { Oportunidad } from '@/types';
import { useMarcas } from '@/features/marcas/store';
import { authHeaders } from '@/lib/auth';

interface OportunidadCardProps {
  oportunidad: Oportunidad;
  onCambiarEtapa: (etapa: Oportunidad['etapa']) => void;
}

export function OportunidadCard({ oportunidad, onCambiarEtapa }: OportunidadCardProps) {
  const navigate = useNavigate();
  const { marcas } = useMarcas();
  const marca = marcas.find((m) => m.id === oportunidad.marcaId);
  const [sectorNombre, setSectorNombre] = useState('');
  const wasDraggedRef = useRef(false);

  useEffect(() => {
    if (!marca?.sectorId) {
      setSectorNombre('');
      return;
    }

    const cargarSector = async () => {
      try {
        const headers = new Headers();
        const auth = authHeaders();
        Object.entries(auth).forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });
        const response = await fetch(`/api/sectores/${marca.sectorId}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setSectorNombre(data.nombre);
        } else {
          setSectorNombre('');
        }
      } catch (error) {
        console.error('Error loading sector:', error);
        setSectorNombre('');
      }
    };

    cargarSector();
  }, [marca?.id, marca?.sectorId]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: oportunidad.id,
  });

  const handleNameClick = (e: React.MouseEvent) => {
    if (wasDraggedRef.current) {
      e.preventDefault();
      wasDraggedRef.current = false;
      return;
    }
    navigate(`/oportunidades/${oportunidad.id}`);
  };

  const handleDragStart = () => {
    wasDraggedRef.current = false;
  };

  const handleDragEnd = () => {
    wasDraggedRef.current = true;
  };

  const estilo = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 20 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={estilo}
      className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={handleNameClick}
          className="min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <p className="truncate text-sm font-semibold text-gray-900 hover:text-brand-800 hover:underline">
            {marca?.nombre}
          </p>
          <p className="truncate text-xs text-gray-500">{sectorNombre}</p>
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          onPointerDown={(e) => {
            handleDragStart();
            listeners?.onPointerDown?.(e);
          }}
          onPointerUp={(e) => {
            handleDragEnd();
            listeners?.onPointerUp?.(e);
          }}
          aria-label="Arrastrar para cambiar de etapa"
          className="shrink-0 cursor-grab touch-none rounded p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
      </div>

      <p className="mb-2 text-sm font-semibold text-brand-800">{formatCOPCompact(oportunidad.valorEstimadoCOP)}</p>

      <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
        <CalendarClock size={12} />
        {formatFecha(oportunidad.fechaEstimadaCierre)}
      </div>

      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-accent-600" style={{ width: `${oportunidad.probabilidad}%` }} />
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-500">{sectorNombre || '-'}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white bg-brand-600"
          title={oportunidad.responsableId}
        >
          {iniciales(oportunidad.responsableId)}
        </span>
        <label className="sr-only" htmlFor={`etapa-${oportunidad.id}`}>
          Cambiar etapa de {marca?.nombre}
        </label>
        <select
          id={`etapa-${oportunidad.id}`}
          value={oportunidad.etapa}
          onChange={(e) => onCambiarEtapa(e.target.value as Oportunidad['etapa'])}
          className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 text-xs text-gray-600 focus:border-brand-800 focus:outline-none"
        >
          {ETAPAS_OPORTUNIDAD.map((etapa) => (
            <option key={etapa} value={etapa}>
              {etapa}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
