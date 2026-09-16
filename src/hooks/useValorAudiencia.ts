import { useState, useEffect } from 'react';
import { authHeaders, getSessionUser } from '@/lib/auth';

export interface ValorAudienciaData {
  canalesCount: number;
  campanasConPatrocinio: number;
  segmentosActivables: number;
  alcancePeriodo: number;
}

export function useValorAudiencia() {
  const [data, setData] = useState<ValorAudienciaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = getSessionUser();
        if (!user) {
          setData(null);
          setLoading(false);
          return;
        }

        const isAdmin = user.subscriptionType === 'ADMIN';
        const hasCompany = Boolean(user.companiaId);
        if (isAdmin && !hasCompany) {
          setData(null);
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

        const response = await fetch('/api/dashboard/valor-audiencia', { headers });
        if (response.ok) {
          const data = await response.json();
          setData(data);
        } else {
          setError('No fue posible cargar datos de audiencia.');
          setData(null);
        }
      } catch (err) {
        console.error('Error fetching audience value:', err);
        setError('Error al cargar los datos.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getSessionUser()?.id, getSessionUser()?.companiaId]);

  return { data, loading, error };
}
