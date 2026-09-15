import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authHeaders, getSessionUser } from '@/lib/auth';
import type { Compromiso, EstadoCompromiso } from '@/types';

interface CompromisosContextValue {
  compromisos: Compromiso[];
  crearCompromiso: (nuevo: Omit<Compromiso, 'id'>) => Promise<Compromiso>;
  actualizarCompromiso: (id: string, cambios: Partial<Compromiso>) => Promise<void>;
  eliminarCompromiso: (id: string) => Promise<void>;
  cambiarEstado: (id: string, estado: EstadoCompromiso) => Promise<void>;
  getCompromisoPorId: (id: string) => Compromiso | undefined;
  recargarCompromisos: () => Promise<void>;
  loading: boolean;
}

const CompromisosContext = createContext<CompromisosContextValue | null>(null);

const PROGRESO_POR_ESTADO: Record<EstadoCompromiso, number> = {
  Pendiente: 0,
  'En curso': 50,
  'En revisión': 85,
  Cumplido: 100,
  Vencido: 40,
};

export function CompromisosProvider({ children }: { children: ReactNode }) {
  const [compromisos, setCompromisos] = useState<Compromiso[]>([]);
  const [loading, setLoading] = useState(true);

  const recargarCompromisos = async () => {
    try {
      const user = getSessionUser();
      if (!user) {
        setCompromisos([]);
        setLoading(false);
        return;
      }

      // Si es ADMIN sin compañía, no hacer búsquedas
      const isAdmin = user.subscriptionType === 'ADMIN';
      const hasCompany = Boolean(user.companiaId);
      if (isAdmin && !hasCompany) {
        setCompromisos([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const headers = new Headers();
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      const response = await fetch(`/api/compromisos`, { headers });
      if (response.ok) {
        const data = await response.json();
        setCompromisos(data);
      } else {
        setCompromisos([]);
      }
    } catch (error) {
      console.error('Error loading compromisos:', error);
      setCompromisos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    recargarCompromisos();
    const handleStorageChange = () => {
      recargarCompromisos();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getSessionUser()?.id, getSessionUser()?.companiaId]);

  async function crearCompromiso(nuevo: Omit<Compromiso, 'id'>): Promise<Compromiso> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/compromisos`, {
      method: 'POST',
      headers,
      body: JSON.stringify(nuevo),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No fue posible crear el compromiso.');
    }
    const compromiso = await response.json();
    setCompromisos((prev) => [...prev, compromiso]);
    return compromiso;
  }

  async function actualizarCompromiso(id: string, cambios: Partial<Compromiso>) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/compromisos/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(cambios),
    });
    if (!response.ok) throw new Error('No fue posible actualizar el compromiso.');
    const compromiso = await response.json();
    setCompromisos((prev) => prev.map((c) => (c.id === id ? compromiso : c)));
  }

  async function eliminarCompromiso(id: string) {
    const headers = new Headers();
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/compromisos/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('No fue posible eliminar el compromiso.');
    setCompromisos((prev) => prev.filter((c) => c.id !== id));
  }

  async function cambiarEstado(id: string, estado: EstadoCompromiso) {
    await actualizarCompromiso(id, {
      estado,
      progreso: PROGRESO_POR_ESTADO[estado],
    });
  }

  function getCompromisoPorId(id: string) {
    return compromisos.find((c) => c.id === id);
  }

  return (
    <CompromisosContext.Provider
      value={{
        compromisos,
        crearCompromiso,
        actualizarCompromiso,
        eliminarCompromiso,
        cambiarEstado,
        getCompromisoPorId,
        recargarCompromisos,
        loading,
      }}
    >
      {children}
    </CompromisosContext.Provider>
  );
}

export function useCompromisos(): CompromisosContextValue {
  const context = useContext(CompromisosContext);
  if (!context) throw new Error('useCompromisos must be used within CompromisosProvider');
  return context;
}
