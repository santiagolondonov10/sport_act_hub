import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Activo } from '@/types';
import { authHeaders, getSessionUser } from '@/lib/auth';

interface ActivosContextValue {
  activos: Activo[];
  crearActivo: (nuevo: Omit<Activo, 'id' | 'acuerdosAsociadosIds'>, archivo?: File) => Promise<string>;
  actualizarActivo: (id: string, cambios: Partial<Omit<Activo, 'id' | 'acuerdosAsociadosIds'>>) => Promise<void>;
  eliminarActivo: (id: string) => Promise<void>;
  getActivoPorId: (id: string) => Activo | undefined;
  loading: boolean;
}

const ActivosContext = createContext<ActivosContextValue | null>(null);

export function ActivosProvider({ children }: { children: ReactNode }) {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarActivos = async () => {
      try {
        const user = getSessionUser();
        if (!user) {
          setActivos([]);
          setLoading(false);
          return;
        }

        // Si es ADMIN sin compañía, no hacer búsquedas
        const isAdmin = user.subscriptionType === 'ADMIN';
        const hasCompany = Boolean(user.companiaId);
        if (isAdmin && !hasCompany) {
          setActivos([]);
          setLoading(false);
          return;
        }

        const headers = new Headers();
        const auth = authHeaders();
        Object.entries(auth).forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });
        const response = await fetch(`/api/activos`, { headers });
        if (response.ok) {
          const data = await response.json();
          setActivos(data);
        }
      } catch (error) {
        console.error('Error loading activos:', error);
        setActivos([]);
      } finally {
        setLoading(false);
      }
    };
    cargarActivos();
  }, [getSessionUser()?.id, getSessionUser()?.companiaId]);

  async function crearActivo(nuevo: any) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });

    // Si hay foto base64 en los datos, ya va incluida
    const response = await fetch(`/api/activos`, {
      method: 'POST',
      headers,
      body: JSON.stringify(nuevo),
    });

    if (!response.ok) {
      throw new Error('No fue posible crear el activo.');
    }

    const activo: Activo = await response.json();
    setActivos((prev) => [activo, ...prev]);

    return activo.id;
  }

  async function actualizarActivo(id: string, cambios: Partial<Omit<Activo, 'id' | 'acuerdosAsociadosIds'>>) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/activos/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(cambios),
    });
    if (!response.ok) throw new Error('No fue posible actualizar el activo.');
    const activo = await response.json();
    setActivos((prev) => prev.map((a) => (a.id === id ? { ...activo, acuerdosAsociadosIds: a.acuerdosAsociadosIds } : a)));
  }

  async function eliminarActivo(id: string) {
    const headers = new Headers();
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/activos/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('No fue posible eliminar el activo.');
    setActivos((prev) => prev.filter((a) => a.id !== id));
  }

  function getActivoPorId(id: string) {
    return activos.find((activo) => activo.id === id);
  }

  return (
    <ActivosContext.Provider value={{ activos, crearActivo, actualizarActivo, eliminarActivo, getActivoPorId, loading }}>
      {children}
    </ActivosContext.Provider>
  );
}

export function useActivos(): ActivosContextValue {
  const context = useContext(ActivosContext);
  if (!context) throw new Error('useActivos must be used within ActivosProvider');
  return context;
}
