import { useState, useEffect, useMemo } from 'react';
import { authHeaders } from '@/lib/auth';

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

export function useNotificacionLogs(tipo: 'evidencia' | 'oportunidad' | 'acuerdo', entidadId?: string) {
  const [logs, setLogs] = useState<NotificacionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ultimaNotificacion = useMemo(() => {
    if (logs.length === 0) return null;
    return logs[0]; // Ya están ordenados por fecha_envio DESC
  }, [logs]);

  useEffect(() => {
    if (!entidadId) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    async function fetchLogs() {
      setIsLoading(true);
      setError(null);
      try {
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        Object.entries(authHeaders()).forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });

        const response = await fetch(`/api/notificacion-logs/${tipo}/${entidadId}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error('Error al obtener logs de notificación');
        }

        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogs();
  }, [tipo, entidadId]);

  return { logs, isLoading, error, ultimaNotificacion };
}
