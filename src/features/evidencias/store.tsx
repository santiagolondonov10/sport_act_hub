import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authHeaders, getSessionUser } from '@/lib/auth';
import type { Evidencia, EstadoEvidencia } from '@/types';

interface EvidenciasContextValue {
  evidencias: Evidencia[];
  crearEvidencia: (nueva: Omit<Evidencia, 'id' | 'estado'> & { archivos?: Array<{ nombre: string; tipo: string; datos: string }> }) => Promise<Evidencia>;
  actualizarEvidencia: (id: string, updates: Partial<Omit<Evidencia, 'id' | 'estado'>> & { archivos?: Array<{ nombre: string; tipo: string; datos: string }> }) => Promise<Evidencia>;
  cambiarEstado: (id: string, estado: EstadoEvidencia) => Promise<void>;
  eliminarEvidencia: (id: string) => Promise<void>;
  loading: boolean;
}

const EvidenciasContext = createContext<EvidenciasContextValue | null>(null);

export function EvidenciasProvider({ children }: { children: ReactNode }) {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [loading, setLoading] = useState(true);

  const recargarEvidencias = async () => {
    try {
      const user = getSessionUser();
      if (!user) {
        setEvidencias([]);
        setLoading(false);
        return;
      }

      // Si es ADMIN sin compañía, no hacer búsquedas
      const isAdmin = user.subscriptionType === 'ADMIN';
      const hasCompany = Boolean(user.companiaId);
      if (isAdmin && !hasCompany) {
        setEvidencias([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const headers = new Headers();
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      const response = await fetch(`/api/evidencias`, { headers });
      if (response.ok) {
        const data = await response.json();
        setEvidencias(data);
      } else {
        setEvidencias([]);
      }
    } catch (error) {
      console.error('Error loading evidencias:', error);
      setEvidencias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    recargarEvidencias();
  }, [getSessionUser()?.id, getSessionUser()?.companiaId]);

  async function crearEvidencia(nueva: Omit<Evidencia, 'id' | 'estado'> & { archivos?: Array<{ nombre: string; tipo: string; datos: string }> }): Promise<Evidencia> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/evidencias`, {
      method: 'POST',
      headers,
      body: JSON.stringify(nueva),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No fue posible crear la evidencia.');
    }
    const evidencia = await response.json();
    setEvidencias((prev) => [evidencia, ...prev]);
    return evidencia;
  }

  async function actualizarEvidencia(
    id: string,
    updates: Partial<Omit<Evidencia, 'id' | 'estado'>> & { archivos?: Array<{ nombre: string; tipo: string; datos: string }> }
  ): Promise<Evidencia> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/evidencias/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No fue posible actualizar la evidencia.');
    }
    const evidencia = await response.json();
    setEvidencias((prev) => prev.map((e) => (e.id === id ? evidencia : e)));
    return evidencia;
  }

  async function cambiarEstado(id: string, estado: EstadoEvidencia) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/evidencias/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ estado }),
    });
    if (!response.ok) throw new Error('No fue posible actualizar el estado de la evidencia.');
    const evidencia = await response.json();
    setEvidencias((prev) => prev.map((e) => (e.id === id ? evidencia : e)));
  }

  async function eliminarEvidencia(id: string) {
    const headers = new Headers();
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/evidencias/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('No fue posible eliminar la evidencia.');
    setEvidencias((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <EvidenciasContext.Provider
      value={{
        evidencias,
        crearEvidencia,
        actualizarEvidencia,
        cambiarEstado,
        eliminarEvidencia,
        loading,
      }}
    >
      {children}
    </EvidenciasContext.Provider>
  );
}

export function useEvidencias(): EvidenciasContextValue {
  const context = useContext(EvidenciasContext);
  if (!context) throw new Error('useEvidencias must be used within EvidenciasProvider');
  return context;
}
