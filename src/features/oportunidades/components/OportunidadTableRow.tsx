import { Link } from 'react-router-dom';
import { formatCOP, formatFechaLarga } from '@/lib/format';
import { getResponsable } from '@/data';
import { useNotificacionLogs } from '@/hooks/useNotificacionLogs';
import { ETAPAS_OPORTUNIDAD } from '@/types';
import type { Oportunidad } from '@/types';

interface OportunidadTableRowProps {
  oportunidad: Oportunidad;
  marcaNombre: string;
  onCambiarEtapa: (etapa: Oportunidad['etapa']) => void;
}

export function OportunidadTableRow({ oportunidad, marcaNombre, onCambiarEtapa }: OportunidadTableRowProps) {
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
        <select
          value={oportunidad.etapa}
          onChange={(e) => onCambiarEtapa(e.target.value as Oportunidad['etapa'])}
          className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:border-brand-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 cursor-pointer"
        >
          {ETAPAS_OPORTUNIDAD.map((etapa) => (
            <option key={etapa} value={etapa}>
              {etapa}
            </option>
          ))}
        </select>
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
