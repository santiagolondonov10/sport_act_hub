import { Mail } from 'lucide-react';
import { formatFechaLarga, formatHora } from '@/lib/format';

interface NotificacionLog {
  id: string;
  tipo_entidad: string;
  entidad_id: string;
  destinatario_email: string;
  destinatario_nombre: string;
  asunto: string;
  fecha_envio: string;
  estado: string;
}

interface NotificacionLogsListProps {
  logs: NotificacionLog[];
  isLoading?: boolean;
}

export function NotificacionLogsList({ logs, isLoading = false }: NotificacionLogsListProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Cargando logs de notificación...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-500">No hay notificaciones registradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-900">Historial de notificaciones</p>
      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
          >
            <Mail size={16} className="mt-0.5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{log.destinatario_nombre}</p>
                <span className="text-xs text-gray-500">({log.destinatario_email})</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{log.asunto}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{formatFechaLarga(new Date(log.fecha_envio).toISOString().split('T')[0])}</span>
                <span>•</span>
                <span>{formatHora(log.fecha_envio)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
