import { createContext, useContext, useState, useEffect } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { getSessionUser } from './auth';

interface EntityStoreValue<T> {
  items: T[];
  setItems: Dispatch<SetStateAction<T[]>>;
}

export function createEntityStore<T extends { id: string }>(datosIniciales: T[]) {
  const Context = createContext<EntityStoreValue<T> | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<T[]>(datosIniciales);

    // Limpiar datos cuando el usuario cambia o cierra sesión
    useEffect(() => {
      const user = getSessionUser();
      if (!user) {
        setItems([]);
      }
    }, [getSessionUser()?.id]);

    return <Context.Provider value={{ items, setItems }}>{children}</Context.Provider>;
  }

  function useEntityStore(): EntityStoreValue<T> {
    const context = useContext(Context);
    if (!context) {
      throw new Error('useEntityStore debe usarse dentro de su Provider correspondiente');
    }
    return context;
  }

  return { Provider, useEntityStore };
}
