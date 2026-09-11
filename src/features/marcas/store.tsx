import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authHeaders, getSessionUser } from '@/lib/auth';

export interface Marca {
  id: string;
  nombre: string;
  tipoIdentificacion: string;
  identificacion: string;
  rutNombre?: string | null;
  rutUrl?: string; // Para enviar base64 del RUT al backend
  sectorId?: string | null;
  personaContacto1?: string | null;
  telefonoContacto1?: string | null;
  correoContacto1?: string | null;
  cargoContacto1?: string | null;
  personaContacto2?: string | null;
  telefonoContacto2?: string | null;
  correoContacto2?: string | null;
  cargoContacto2?: string | null;
  personaContacto3?: string | null;
  telefonoContacto3?: string | null;
  correoContacto3?: string | null;
  cargoContacto3?: string | null;
  creadoPor?: string | null;
  actualizadoPor?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface MarcasContextValue {
  marcas: Marca[];
  crearMarca: (nuevo: Omit<Marca, 'id' | 'creadoPor' | 'actualizadoPor' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  actualizarMarca: (id: string, cambios: Partial<Omit<Marca, 'id' | 'creadoPor' | 'actualizadoPor' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  eliminarMarca: (id: string) => Promise<void>;
  getMarcaPorId: (id: string) => Marca | undefined;
  loading: boolean;
}

const MarcasContext = createContext<MarcasContextValue | null>(null);

export function MarcasProvider({ children }: { children: ReactNode }) {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarMarcas = async () => {
      try {
        const user = getSessionUser();

        if (!user) {
          setMarcas([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const headers = new Headers();
        const auth = authHeaders();
        Object.entries(auth).forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });
        const response = await fetch(`/api/marcas`, { headers });
        if (response.ok) {
          const data = await response.json();
          setMarcas(data);
        } else {
          setMarcas([]);
        }
      } catch (error) {
        console.error('Error loading marcas:', error);
        setMarcas([]);
      } finally {
        setLoading(false);
      }
    };

    // Load on mount and when user changes
    cargarMarcas();

    // Listen for storage changes (from other tabs)
    const handleStorageChange = () => {
      // Reload immediately when storage changes (user logged in/out from another tab)
      cargarMarcas();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getSessionUser()?.id]);

  async function crearMarca(nuevo: Omit<Marca, 'id' | 'creadoPor' | 'actualizadoPor' | 'createdAt' | 'updatedAt'>) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/marcas`, {
      method: 'POST',
      headers,
      body: JSON.stringify(nuevo),
    });
    if (!response.ok) throw new Error('No fue posible crear la marca.');
    const marca = await response.json();
    setMarcas((prev) => [marca, ...prev]);
  }

  async function actualizarMarca(id: string, cambios: Partial<Omit<Marca, 'id' | 'creadoPor' | 'actualizadoPor' | 'createdAt' | 'updatedAt'>>) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const url = `/api/marcas/${id}`;
    console.log('Actualizando marca:', url, cambios);
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(cambios),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('Error response:', response.status, error);
      throw new Error(error.error || 'No fue posible actualizar la marca.');
    }
    const marca = await response.json();
    setMarcas((prev) => prev.map((m) => (m.id === id ? marca : m)));
  }

  async function eliminarMarca(id: string) {
    const headers = new Headers();
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => {
      if (value) headers.set(key, value);
    });
    const response = await fetch(`/api/marcas/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('No fue posible eliminar la marca.');
    setMarcas((prev) => prev.filter((m) => m.id !== id));
  }

  function getMarcaPorId(id: string) {
    return marcas.find((m) => m.id === id);
  }

  return (
    <MarcasContext.Provider value={{ marcas, crearMarca, actualizarMarca, eliminarMarca, getMarcaPorId, loading }}>
      {children}
    </MarcasContext.Provider>
  );
}

export function useMarcas(): MarcasContextValue {
  const context = useContext(MarcasContext);
  if (!context) throw new Error('useMarcas must be used within MarcasProvider');
  return context;
}
