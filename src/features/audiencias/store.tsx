import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { CampanaAudiencia, CanalAudiencia, CapacidadActivacion, EstadoIntegracionGO, SegmentoAudiencia } from '@/types';

interface AudienciasContextValue {
  segmentos: SegmentoAudiencia[];
  canales: CanalAudiencia[];
  capacidades: CapacidadActivacion[];
  campanas: CampanaAudiencia[];
  estadoIntegracionGO: EstadoIntegracionGO;
  actualizarSegmento: (id: string, cambios: Partial<SegmentoAudiencia>) => void;
  refrescarDatos: () => void;
}

const AudienciasContext = createContext<AudienciasContextValue | null>(null);

export function AudienciasProvider({ children }: { children: ReactNode }) {
  const [segmentos, setSegmentos] = useState<SegmentoAudiencia[]>([]);
  const [estadoIntegracionGO, setEstadoIntegracionGO] = useState<EstadoIntegracionGO>({
    estado: 'No configurada',
    ultimaActualizacionSimulada: new Date().toISOString(),
    mensaje: 'Sin datos disponibles',
  });

  function actualizarSegmento(id: string, cambios: Partial<SegmentoAudiencia>) {
    setSegmentos((prev) => prev.map((seg) => (seg.id === id ? { ...seg, ...cambios } : seg)));
  }

  function refrescarDatos() {
    setEstadoIntegracionGO((prev) => ({
      ...prev,
      ultimaActualizacionSimulada: new Date().toISOString(),
    }));
  }

  return (
    <AudienciasContext.Provider
      value={{
        segmentos,
        canales: [],
        capacidades: [],
        campanas: [],
        estadoIntegracionGO,
        actualizarSegmento,
        refrescarDatos,
      }}
    >
      {children}
    </AudienciasContext.Provider>
  );
}

export function useAudiencias(): AudienciasContextValue {
  const context = useContext(AudienciasContext);
  if (!context) throw new Error('useAudiencias debe usarse dentro de AudienciasProvider');
  return context;
}
