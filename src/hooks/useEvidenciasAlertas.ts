import { useState, useEffect } from 'react';
import { authHeaders, getSessionUser } from '@/lib/auth';

export interface AlertaEvidencia {
  id: string;
  compromisoId: string;
  estado: string;
  fechaCreacion: string;
  entregable: string;
  acuerdoId: string;
  acuerdoNombre: string;
  marcaNombre: string;
  responsableId: string;
}

export function useEvidenciasAlertas() {
  const [alertas, setAlertas] = useState<AlertaEvidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const user = getSessionUser();
        if (!user) {
          setAlertas([]);
          setLoading(false);
          return;
        }

        const isAdmin = user.subscriptionType === 'ADMIN';
        const hasCompany = Boolean(user.companiaId);
        if (isAdmin && !hasCompany) {
          setAlertas([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        const headers = new Headers();
        const auth = authHeaders();
        Object.entries(auth).forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });

        const response = await fetch('/api/evidencias-alertas', { headers });
        if (response.ok) {
          const data = await response.json();
          setAlertas(data);
        } else {
          setError('No fue posible cargar las alertas.');
          setAlertas([]);
        }
      } catch (err) {
        console.error('Error fetching evidencias alertas:', err);
        setError('Error al cargar las alertas.');
        setAlertas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertas();
  }, [getSessionUser()?.id, getSessionUser()?.companiaId]);

  return { alertas, loading, error };
}
