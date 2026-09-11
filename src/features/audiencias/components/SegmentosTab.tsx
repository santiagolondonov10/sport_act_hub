import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumero, formatPorcentaje } from '@/lib/format';
import { ESTADOS_AUDIENCIA, TIPOS_AUDIENCIA } from '@/types';
import type { CampanaAudiencia, CapacidadActivacion, SegmentoAudiencia } from '@/types';
import { SegmentoDetalleModal } from './SegmentoDetalleModal';

interface SegmentosTabProps {
  segmentos: SegmentoAudiencia[];
  capacidades: CapacidadActivacion[];
  campanas: CampanaAudiencia[];
  onVerCampanas: (segmentoId: string) => void;
}

export function SegmentosTab({ segmentos, capacidades, campanas, onVerCampanas }: SegmentosTabProps) {
  const [busqueda, setBusqueda] = useState('');
  const [tipoAudiencia, setTipoAudiencia] = useState('todos');
  const [canal, setCanal] = useState('todos');
  const [estado, setEstado] = useState('todos');
  const [tipoDato, setTipoDato] = useState('todos');
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const seleccionado = segmentos.find((s) => s.id === seleccionadoId) ?? null;

  const canalesUnicos = useMemo(() => Array.from(new Set(segmentos.map((s) => s.canalPrincipal))), [segmentos]);
  const tiposAudienciaUnicos = useMemo(() => Array.from(new Set(segmentos.map((s) => s.tipoAudienciaLabel))), [segmentos]);

  const filtrados = segmentos.filter((s) => {
    const coincideBusqueda = s.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideTipoAudiencia = tipoAudiencia === 'todos' || s.tipoAudienciaLabel === tipoAudiencia;
    const coincideCanal = canal === 'todos' || s.canalPrincipal === canal;
    const coincideEstado = estado === 'todos' || s.estado === estado;
    const coincideTipoDato = tipoDato === 'todos' || s.tipoDato === tipoDato;
    return coincideBusqueda && coincideTipoAudiencia && coincideCanal && coincideEstado && coincideTipoDato;
  });

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Los segmentos pueden superponerse entre sí: la suma de sus tamaños no representa necesariamente personas únicas.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchInput placeholder="Buscar segmento..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="sm:w-56" />
        <FilterSelect
          value={tipoAudiencia}
          onChange={(e) => setTipoAudiencia(e.target.value)}
          options={[{ value: 'todos', label: 'Todos los tipos de audiencia' }, ...tiposAudienciaUnicos.map((t) => ({ value: t, label: t }))]}
        />
        <FilterSelect
          value={canal}
          onChange={(e) => setCanal(e.target.value)}
          options={[{ value: 'todos', label: 'Todos los canales' }, ...canalesUnicos.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          value={tipoDato}
          onChange={(e) => setTipoDato(e.target.value)}
          options={[{ value: 'todos', label: 'Todos los tipos de dato' }, ...TIPOS_AUDIENCIA.map((t) => ({ value: t, label: t }))]}
        />
        <FilterSelect
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          options={[{ value: 'todos', label: 'Todos los estados' }, ...ESTADOS_AUDIENCIA.map((e) => ({ value: e, label: e }))]}
        />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState icono={Users} titulo="No hay segmentos que coincidan" descripcion="Ajusta los filtros para ver otros segmentos de audiencia." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Segmento</th>
                <th className="px-4 py-3 font-medium">Tipo de audiencia</th>
                <th className="px-4 py-3 font-medium">Tamaño</th>
                <th className="px-4 py-3 font-medium">Crecimiento</th>
                <th className="px-4 py-3 font-medium">Canal principal</th>
                <th className="px-4 py-3 font-medium">Indicador destacado</th>
                <th className="px-4 py-3 font-medium">Tipo de dato</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Activos</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((segmento) => (
                <tr key={segmento.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-medium text-gray-900">{segmento.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{segmento.tipoAudienciaLabel}</td>
                  <td className="px-4 py-3 text-gray-600">{formatNumero(segmento.tamano)}</td>
                  <td className="px-4 py-3 text-success-700">+{formatPorcentaje(segmento.crecimiento, 1)}</td>
                  <td className="px-4 py-3 text-gray-600">{segmento.canalPrincipal}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {segmento.indicadorDestacadoEtiqueta}: <span className="font-medium">{segmento.indicadorDestacadoValor}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge estado={segmento.tipoDato} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge estado={segmento.estado} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{segmento.activosRelacionadosIds.length}</td>
                  <td className="px-4 py-3">
                    <Button tamano="sm" variante="secundario" onClick={() => setSeleccionadoId(segmento.id)}>
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SegmentoDetalleModal
        segmento={seleccionado}
        onCerrar={() => setSeleccionadoId(null)}
        capacidades={capacidades}
        campanas={campanas}
        onVerCampanas={onVerCampanas}
      />
    </div>
  );
}
