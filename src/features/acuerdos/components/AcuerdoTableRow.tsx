import { Link } from 'react-router-dom';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { formatFecha, formatFechaLarga } from '@/lib/format';
import { formatCurrency } from '@/lib/formatters';
import { getCumplimientoPorAcuerdo, getTiempoConsumidoPorAcuerdo } from '@/lib/selectors';
import { useNotificacionLogs } from '@/hooks/useNotificacionLogs';
import { AlertaSemaforoAcuerdo } from './AlertaSemaforoAcuerdo';
import type { Acuerdo } from '@/types';

interface AcuerdoTableRowProps {
  acuerdo: Acuerdo;
  marcaNombre?: string;
  enviandoAlerta?: string | null;
  onEnviarAlerta?: (id: string) => void;
  onEditar?: (id: string) => void;
  onEliminar?: (id: string) => void;
}

export function AcuerdoTableRow({ acuerdo, marcaNombre, enviandoAlerta, onEnviarAlerta, onEditar, onEliminar }: AcuerdoTableRowProps) {
  const cumplimiento = getCumplimientoPorAcuerdo(acuerdo.id);
  const tiempoConsumido = getTiempoConsumidoPorAcuerdo(acuerdo.fechaInicio, acuerdo.fechaFin);
  const mostrarBotonAlerta = tiempoConsumido > 80;
  const { ultimaNotificacion } = useNotificacionLogs('acuerdo', acuerdo.id);

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {onEditar && (
            <button
              onClick={() => onEditar(acuerdo.id)}
              className="text-gray-600 hover:text-brand-800 transition-colors"
              title="Editar"
            >
              <Pencil size={16} />
            </button>
          )}
          {onEliminar && (
            <button
              onClick={async () => {
                if (!confirm('¿Estás seguro de que quieres eliminar este acuerdo?')) return;
                onEliminar(acuerdo.id);
              }}
              className="text-gray-600 hover:text-red-600 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Link to={`/acuerdos/${acuerdo.id}`} className="font-medium text-gray-900 hover:text-brand-800 hover:underline">
          {acuerdo.nombre}
        </Link>
      </td>
      <td className="px-4 py-3 text-gray-600">{marcaNombre}</td>
      <td className="px-4 py-3 text-gray-600">{formatCurrency(acuerdo.valorCOP)}</td>
      <td className="px-4 py-3 text-gray-500">
        {formatFecha(acuerdo.fechaInicio)} – {formatFecha(acuerdo.fechaFin)}
      </td>
      <td className="px-4 py-3">
        <AlertaSemaforoAcuerdo tiempoConsumido={tiempoConsumido} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ProgressBar valor={cumplimiento} className="w-20" />
          <span className="text-xs text-gray-500">{cumplimiento}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge estado={acuerdo.estado} />
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">
        {ultimaNotificacion
          ? formatFechaLarga(new Date(ultimaNotificacion.fecha_envio).toISOString().split('T')[0])
          : 'Sin notificaciones'}
      </td>
      <td className="px-4 py-3 text-center">
        {mostrarBotonAlerta && onEnviarAlerta && (
          <Button
            variante="peligro"
            icono={<MessageSquare size={14} />}
            onClick={() => onEnviarAlerta(acuerdo.id)}
            disabled={enviandoAlerta === acuerdo.id}
            className="text-xs"
          >
            {enviandoAlerta === acuerdo.id ? '...' : 'Alerta'}
          </Button>
        )}
      </td>
    </tr>
  );
}
