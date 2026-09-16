import { useState, useEffect } from 'react';
import { authHeaders, getSessionUser } from '@/lib/auth';

export interface PipelineEtapa {
  etapa: string;
  cantidad: number;
  valorCOP: number;
}

export function usePipelineData() {
  const [data, setData] = useState<PipelineEtapa[]>([]);
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

        const response = await fetch('/api/dashboard/pipeline-por-etapa', { headers });
        if (response.ok) {
          const data = await response.json();
          console.log('Pipeline data from backend:', data);
          const parsed = data.map((item: any) => {
            const cantidad = parseInt(item.cantidad) || 0;
            const valorCOP = parseInt(item.valorCOP) || 0;
            console.log(`${item.etapa}: cantidad=${item.cantidad}(${cantidad}), valorCOP=${item.valorCOP}(${valorCOP})`);
            return { etapa: item.etapa, cantidad, valorCOP };
          });
          console.log('Parsed pipeline data:', parsed);
          setData(parsed);
        } else {
          setError('No fue posible cargar los datos del pipeline.');
          setData([]);
        }
      } catch (err) {
        console.error('Error fetching pipeline data:', err);
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
