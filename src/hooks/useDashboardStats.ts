import { useState, useEffect } from 'react';
import { authHeaders, getSessionUser } from '@/lib/auth';
import { apiCall } from '@/lib/api-client';

interface DashboardStats {
  valorPipeline: number;
  ingresosCerrados: number;
  activosDisponibles: number;
  acuerdosActivos: number;
  cumplimientoGeneral: number;
  compromisosVencidos: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = getSessionUser();
        if (!user) {
          setStats(null);
          setLoading(false);
          return;
        }

        // Si es ADMIN sin compañía, no hacer búsquedas
        const isAdmin = user.subscriptionType === 'ADMIN';
        const hasCompany = Boolean(user.companiaId);
        if (isAdmin && !hasCompany) {
          setStats(null);
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

        const response = await apiCall('/api/dashboard/stats', { headers });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError('No fue posible cargar las estadísticas del dashboard.');
          setStats(null);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Error al cargar las estadísticas.');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getSessionUser()?.id, getSessionUser()?.companiaId]);

  return { stats, loading, error };
}
