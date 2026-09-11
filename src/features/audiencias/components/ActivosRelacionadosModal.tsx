import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { getActivo } from '@/data';
import { formatCOPCompact } from '@/lib/format';

interface ActivosRelacionadosModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  activosIds: string[];
}

export function ActivosRelacionadosModal({ abierto, onCerrar, titulo, activosIds }: ActivosRelacionadosModalProps) {
  const activos = activosIds.map((id) => getActivo(id)).filter((a) => a !== undefined);

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Activos relacionados"
      descripcion={titulo}
    >
      {activos.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Aún no hay activos comerciales vinculados a esta capacidad de audiencia.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {activos.map((activo) => (
            <li key={activo.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${activo.imagenColor}1a`, color: activo.imagenColor }}
                >
                  <Package size={16} />
                </span>
                <div>
                  <Link
                    to={`/activos/${activo.id}`}
                    onClick={onCerrar}
                    className="text-sm font-medium text-gray-900 hover:text-brand-800 hover:underline"
                  >
                    {activo.nombre}
                  </Link>
                  <p className="text-xs text-gray-500">{activo.categoriaNombre || 'Sin categoría'} · {formatCOPCompact(activo.valoracionCOP)}</p>
                </div>
              </div>
              <Badge estado={activo.estado} />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
