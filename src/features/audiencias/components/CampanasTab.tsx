import { useMemo, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getMarca } from '@/data';
import { formatFecha, formatNumero, formatPorcentaje } from '@/lib/format';
import type { CampanaAudiencia, SegmentoAudiencia } from '@/types';
import { CampanaDetalleModal } from './CampanaDetalleModal';

interface CampanasTabProps {
  campanas: CampanaAudiencia[];
  segmentos: SegmentoAudiencia[];
  filtroSegmentoInicial: string | null;
  onLimpiarFiltroSegmento: () => void;
}

export function CampanasTab({ campanas, segmentos, filtroSegmentoInicial, onLimpiarFiltroSegmento }: CampanasTabProps) {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');
  const [segmentoId, setSegmentoId] = useState(filtroSegmentoInicial ?? 'todos');
  const [seleccionada, setSeleccionada] = useState<CampanaAudiencia | null>(null);

  const segmentoFiltroActivo = segmentos.find((s) => s.id === filtroSegmentoInicial);

  const filtradas = useMemo(() => {
    return campanas.filter((c) => {
      const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = estado === 'todos' || c.estado === estado;
      const coincideSegmento = segmentoId === 'todos' || c.segmentosIds.includes(segmentoId);
      return coincideBusqueda && coincideEstado && coincideSegmento;
    });
  }, [campanas, busqueda, estado, segmentoId]);

  return (
    <div className="space-y-4">
      {segmentoFiltroActivo && segmentoId === filtroSegmentoInicial && (
        <div className="flex items-center justify-between rounded-lg bg-brand-800/5 px-3 py-2 text-xs text-brand-800">
          <span>
            Filtrando campañas relacionadas con el segmento <strong>{segmentoFiltroActivo.nombre}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              setSegmentoId('todos');
              onLimpiarFiltroSegmento();
            }}
            className="flex items-center gap-1 font-medium hover:underline"
          >
            <X size={12} /> Quitar filtro
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchInput placeholder="Buscar campaña..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="sm:w-56" />
        <FilterSelect
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          options={[
            { value: 'todos', label: 'Todos los estados' },
            { value: 'Borrador', label: 'Borrador' },
            { value: 'Activa', label: 'Activa' },
            { value: 'Finalizada', label: 'Finalizada' },
          ]}
        />
        <FilterSelect
          value={segmentoId}
          onChange={(e) => {
            setSegmentoId(e.target.value);
            if (e.target.value !== filtroSegmentoInicial) onLimpiarFiltroSegmento();
          }}
          options={[{ value: 'todos', label: 'Todos los segmentos' }, ...segmentos.map((s) => ({ value: s.id, label: s.nombre }))]}
        />
      </div>

      {filtradas.length === 0 ? (
        <EmptyState icono={Megaphone} titulo="No hay campañas que coincidan" descripcion="Ajusta los filtros para ver otras campañas de audiencia." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Campaña</th>
                <th className="px-4 py-3 font-medium">Patrocinador</th>
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 font-medium">Periodo</th>
                <th className="px-4 py-3 font-medium">Alcance</th>
                <th className="px-4 py-3 font-medium">Interacciones</th>
                <th className="px-4 py-3 font-medium">Conversiones</th>
                <th className="px-4 py-3 font-medium">Tasa conv.</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((campana) => {
                const patrocinador = campana.patrocinadorId ? getMarca(campana.patrocinadorId) : undefined;
                const tasaConversion = campana.alcance > 0 ? (campana.conversiones / campana.alcance) * 100 : 0;
                return (
                  <tr key={campana.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-900">{campana.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{patrocinador?.nombre ?? 'Sin definir'}</td>
                    <td className="px-4 py-3 text-gray-600">{campana.canalTexto}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatFecha(campana.periodoInicio)} – {formatFecha(campana.periodoFin)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatNumero(campana.alcance)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatNumero(campana.interacciones)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatNumero(campana.conversiones)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatPorcentaje(tasaConversion, 1)}</td>
                    <td className="px-4 py-3">
                      <Badge estado={campana.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <Button tamano="sm" variante="secundario" onClick={() => setSeleccionada(campana)}>
                        Ver detalle
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CampanaDetalleModal campana={seleccionada} onCerrar={() => setSeleccionada(null)} />
    </div>
  );
}
