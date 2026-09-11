import { createEntityStore } from '@/lib/createEntityStore';
import type { Evidencia, EstadoEvidencia } from '@/types';

const { Provider, useEntityStore } = createEntityStore<Evidencia>([]);

export const EvidenciasProvider = Provider;

export function useEvidencias() {
  const { items, setItems } = useEntityStore();

  function crearEvidencia(nueva: Omit<Evidencia, 'id' | 'estado'>) {
    const id = `ev-${Date.now()}`;
    setItems((prev) => [{ ...nueva, id, estado: 'En revisión' as EstadoEvidencia }, ...prev]);
    return id;
  }

  function cambiarEstado(id: string, estado: EstadoEvidencia) {
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, estado } : e)));
  }

  return { evidencias: items, crearEvidencia, cambiarEstado };
}
