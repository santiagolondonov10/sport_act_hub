import { useState, useEffect } from 'react';
import { authHeaders, getSessionUser } from '@/lib/auth';
import { apiCall } from '@/lib/api-client';

export interface AcuerdoRelevante {
  id: string;
  nombre: string;
  marcaNombre: string;
  valorCOP: number;
  fechaFin: string;
  cumplimiento: number;
  estado: string;
}

export function useAcuerdosRelevantes() {
  const [data, setData] = useState<AcuerdoRelevante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = getSessionUser();
        if (!user) {
          setData([]);
          setLoading(false);
          return;
        }

        const isAdmin = user.subscriptionType === 'ADMIN';
        const hasCompany = Boolean(user.companiaId);
        if (isAdmin && !hasCompany) {
          setData([]);
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

        const response = await apiCall('/api/dashboard/acuerdos-relevantes', { headers });
        if (response.ok) {
          const data = await response.json();
          setData(data);
        } else {
          setError('No fue posible cargar los acuerdos.');
          setData([]);
        }
      } catch (err) {
        console.error('Error fetching relevant agreements:', err);
        setError('Error al cargar los datos.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getSessionUser()?.id, getSessionUser()?.companiaId]);

  return { data, loading, error };
}
