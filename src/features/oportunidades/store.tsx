import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { EtapaOportunidad, Oportunidad } from '@/types';
import { authHeaders, getSessionUser } from '@/lib/auth';

interface OportunidadesContextValue {
  oportunidades: Oportunidad[];
  crearOportunidad: (nueva: Omit<Oportunidad, 'id' | 'fechaCreacion' | 'actividad'>) => Promise<void>;
  actualizarOportunidad: (id: string, cambios: Partial<Oportunidad>) => Promise<void>;
  moverEtapa: (id: string, etapa: EtapaOportunidad) => Promise<void>;
  cargarContrato: (id: string, archivo: File) => Promise<void>;
  eliminarOportunidad: (id: string) => Promise<void>;
  getOportunidadPorId: (id: string) => Oportunidad | undefined;
  loading: boolean;
}

const OportunidadesContext = createContext<OportunidadesContextValue | null>(null);

export function OportunidadesProvider({ children }: { children: ReactNode }) {
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarOportunidades = async () => {
      try {
        const user = getSessionUser();
        if (!user) {
          setOportunidades([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const headers = new Headers();
        const auth = authHeaders();
        Object.entries(auth).forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });
        const response = await fetch(`/api/oportunidades`, { headers });
        if (response.ok) {
          const data = await response.json();
          const oportunidadesConActividad = data.map((opp: any) => ({
            ...opp,
            actividad: opp.actividad || [],
          }));
          setOportunidades(oportunidadesConActividad);
        } else {
          setOportunidades([]);
        }
      } catch (error) {
        console.error('Error loading oportunidades:', error);
        setOportunidades([]);
      } finally {
        setLoading(false);
      }
    };

    cargarOportunidades();
  }, [getSessionUser()?.id]);

  async function crearOportunidad(nueva: Omit<Oportunidad, 'id' | 'fechaCreacion' | 'actividad'>) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/oportunidades`, {
      method: 'POST',
      headers,
      body: JSON.stringify(nueva),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error al crear oportunidad' }));
      throw new Error(error.error || 'No fue posible crear la oportunidad.');
    }
    const oportunidad = await response.json();
    const oportunidadConActividad = {
      ...oportunidad,
      actividad: oportunidad.actividad || [],
    };
    setOportunidades((prev) => [oportunidadConActividad, ...prev]);
  }

  async function actualizarOportunidad(id: string, cambios: Partial<Oportunidad>) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/oportunidades/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(cambios),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('Error response:', response.status, error);
      throw new Error(error.error || 'No fue posible actualizar la oportunidad.');
    }
    const oportunidad = await response.json();
    const oportunidadConActividad = {
      ...oportunidad,
      actividad: oportunidad.actividad || [],
    };
    setOportunidades((prev) => prev.map((o) => (o.id === id ? oportunidadConActividad : o)));
  }

  async function moverEtapa(id: string, etapa: EtapaOportunidad) {
    await actualizarOportunidad(id, { etapa });
  }

  async function cargarContrato(id: string, archivo: File) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(archivo);
    });
    const oportunidad = oportunidades.find((o) => o.id === id);
    const contratosActuales = oportunidad?.contratosAdjuntos || [];
    const nuevoContrato = { nombre: archivo.name, base64 };
    await actualizarOportunidad(id, {
      ...oportunidad!,
      contratosAdjuntos: [...contratosActuales, nuevoContrato]
    });
  }

  async function eliminarOportunidad(id: string) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/oportunidades/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || 'No fue posible eliminar la oportunidad.');
    }
    setOportunidades((prev) => prev.filter((o) => o.id !== id));
  }

  function getOportunidadPorId(id: string) {
    return oportunidades.find((o) => o.id === id);
  }

  return (
    <OportunidadesContext.Provider value={{ oportunidades, crearOportunidad, actualizarOportunidad, moverEtapa, cargarContrato, eliminarOportunidad, getOportunidadPorId, loading }}>
      {children}
    </OportunidadesContext.Provider>
  );
}

export function useOportunidades(): OportunidadesContextValue {
  const context = useContext(OportunidadesContext);
  if (!context) throw new Error('useOportunidades must be used within OportunidadesProvider');
  return context;
}
