import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { formatCOP, formatFechaLarga } from '@/lib/format';
import { getResponsable } from '@/data';
import { useNotificacionLogs } from '@/hooks/useNotificacionLogs';
import type { Oportunidad } from '@/types';

interface OportunidadTableRowProps {
  oportunidad: Oportunidad;
  marcaNombre: string;
}

export function OportunidadTableRow({ oportunidad, marcaNombre }: OportunidadTableRowProps) {
  const responsable = getResponsable(oportunidad.responsableId);
  const { ultimaNotificacion } = useNotificacionLogs('oportunidad', oportunidad.id);

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
      <td className="px-4 py-3">
        <Link to={`/oportunidades/${oportunidad.id}`} className="font-medium text-gray-900 hover:text-brand-800 hover:underline">
          {marcaNombre}
        </Link>
      </td>
      <td className="px-4 py-3">
        <Badge estado={oportunidad.etapa} />
      </td>
      <td className="px-4 py-3 text-gray-600">{formatCOP(oportunidad.valorEstimadoCOP)}</td>
      <td className="px-4 py-3 text-gray-600">{responsable?.nombre}</td>
      <td className="px-4 py-3 text-gray-600">
        {ultimaNotificacion
          ? formatFechaLarga(new Date(ultimaNotificacion.fecha_envio).toISOString().split('T')[0])
          : 'Sin notificaciones'}
      </td>
    </tr>
  );
}
