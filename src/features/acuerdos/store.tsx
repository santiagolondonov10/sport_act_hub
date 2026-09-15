import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Acuerdo } from '@/types';
import { authHeaders, getSessionUser } from '@/lib/auth';

interface AcuerdosContextValue {
  acuerdos: Acuerdo[];
  loading: boolean;
  recargarAcuerdos: () => Promise<void>;
  actualizarAcuerdo: (id: string, cambios: Partial<Acuerdo>) => Promise<void>;
  eliminarAcuerdo: (id: string) => Promise<void>;
}

const AcuerdosContext = createContext<AcuerdosContextValue | null>(null);

export function AcuerdosProvider({ children }: { children: ReactNode }) {
  const [acuerdos, setAcuerdos] = useState<Acuerdo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarAcuerdos = async () => {
      try {
        const user = getSessionUser();
        if (!user) {
          setAcuerdos([]);
          setLoading(false);
          return;
        }

        // Si es ADMIN sin compañía, no hacer búsquedas
        const isAdmin = user.subscriptionType === 'ADMIN';
        const hasCompany = Boolean(user.companiaId);
        if (isAdmin && !hasCompany) {
          setAcuerdos([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const headers = new Headers();
        const auth = authHeaders();
        Object.entries(auth).forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });
        const response = await fetch(`/api/acuerdos`, { headers });
        if (response.ok) {
          const data = await response.json();
          setAcuerdos(data);
        } else {
          setAcuerdos([]);
        }
      } catch (error) {
        console.error('Error loading acuerdos:', error);
        setAcuerdos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarAcuerdos();
  }, [getSessionUser()?.id, getSessionUser()?.companiaId]);

  async function recargarAcuerdos() {
    try {
      const headers = new Headers();
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      const response = await fetch(`/api/acuerdos`, { headers });
      if (response.ok) {
        const data = await response.json();
        setAcuerdos(data);
      }
    } catch (error) {
      console.error('Error reloading acuerdos:', error);
    }
  }

  async function actualizarAcuerdo(id: string, cambios: Partial<Acuerdo>) {
    try {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      const response = await fetch(`/api/acuerdos/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(cambios),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || 'No fue posible actualizar el acuerdo.');
      }
      await recargarAcuerdos();
    } catch (error) {
      throw error;
    }
  }

  async function eliminarAcuerdo(id: string) {
    try {
      const headers = new Headers();
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      const response = await fetch(`/api/acuerdos/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || 'No fue posible eliminar el acuerdo.');
      }
      await recargarAcuerdos();
    } catch (error) {
      throw error;
    }
  }

  return (
    <AcuerdosContext.Provider value={{ acuerdos, loading, recargarAcuerdos, actualizarAcuerdo, eliminarAcuerdo }}>
      {children}
    </AcuerdosContext.Provider>
  );
}

export function useAcuerdos(): AcuerdosContextValue {
  const context = useContext(AcuerdosContext);
  if (!context) throw new Error('useAcuerdos must be used within AcuerdosProvider');
  return context;
}
