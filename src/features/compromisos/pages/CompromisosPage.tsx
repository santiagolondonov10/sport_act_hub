import { useMemo, useState } from 'react';
import { AlarmClock, CheckCircle2, ClipboardList, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useLanguage } from '@/lib/LanguageContext';
import { ESTADOS_COMPROMISO } from '@/types';
import type { Compromiso, EstadoCompromiso, Prioridad } from '@/types';
import { formatFecha, diasHasta } from '@/lib/format';
import { responsables } from '@/data';
import { useCompromisos } from '../store';
import { useMarcas } from '@/features/marcas/store';
import { useToast } from '@/hooks/useToast';
import { CompromisoDetalleModal } from '../components/CompromisoDetalleModal';

const PRIORIDADES: Prioridad[] = ['Baja', 'Media', 'Alta', 'Urgente'];

export function CompromisosPage() {
  const { t } = useLanguage();
  const { compromisos, cambiarEstado } = useCompromisos();
  const { marcas } = useMarcas();
  const { mostrarToast } = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');
  const [prioridad, setPrioridad] = useState('todas');
  const [responsableId, setResponsableId] = useState('todos');
  const [seleccionado, setSeleccionado] = useState<Compromiso | null>(null);

  const filtrados = useMemo(() => {
    return compromisos.filter((c) => {
      const coincideBusqueda = c.entregable.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = estado === 'todos' || c.estado === estado;
      const coincidePrioridad = prioridad === 'todas' || c.prioridad === prioridad;
      const coincideResponsable = responsableId === 'todos' || c.responsableId === responsableId;
      return coincideBusqueda && coincideEstado && coincidePrioridad && coincideResponsable;
    });
  }, [compromisos, busqueda, estado, prioridad, responsableId]);

  const pendientes = compromisos.filter((c) => c.estado === 'Pendiente' || c.estado === 'En curso').length;
  const vencidos = compromisos.filter((c) => c.estado === 'Vencido').length;
  const cumplidos = compromisos.filter((c) => c.estado === 'Cumplido').length;

  function handleCambiarEstado(id: string, nuevoEstado: EstadoCompromiso) {
    cambiarEstado(id, nuevoEstado);
    mostrarToast(t('message.compromisoActualizado').replace('{nuevoEstado}', nuevoEstado));
    setSeleccionado((prev) => (prev && prev.id === id ? { ...prev, estado: nuevoEstado } : prev));
  }

  return (
    <div>
      <PageHeader
        titulo={t('compromisos.title')}
        descripcion={t('compromisos.entregas')}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard etiqueta={t('dashboard.totalCompromisos')} valor={String(compromisos.length)} icono={ClipboardList} tono="marca" />
        <StatCard etiqueta={t('dashboard.pendientesEnCurso')} valor={String(pendientes)} icono={AlarmClock} tono="advertencia" />
        <StatCard etiqueta={t('dashboard.vencidos')} valor={String(vencidos)} icono={TriangleAlert} tono={vencidos > 0 ? 'peligro' : 'neutro'} />
        <StatCard etiqueta={t('dashboard.cumplidos')} valor={String(cumplidos)} icono={CheckCircle2} tono="exito" />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchInput
          placeholder={t('search.entregable')}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="sm:w-56"
        />
        <FilterSelect
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          options={[{ value: 'todos', label: t('filter.todosLosEstados') }, ...ESTADOS_COMPROMISO.map((e) => ({ value: e, label: e }))]}
        />
        <FilterSelect
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value)}
          options={[{ value: 'todas', label: t('filter.todasLasPrioridades') }, ...PRIORIDADES.map((p) => ({ value: p, label: p }))]}
        />
        <FilterSelect
          value={responsableId}
          onChange={(e) => setResponsableId(e.target.value)}
          options={[{ value: 'todos', label: t('filter.todosLosResponsables') }, ...responsables.map((r) => ({ value: r.id, label: r.nombre }))]}
        />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState icono={ClipboardList} titulo={t('empty.noCompromisos')} descripcion={t('empty.ajustaFiltros')} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">{t('table.entregable')}</th>
                <th className="px-4 py-3 font-medium">{t('table.marca')}</th>
                <th className="px-4 py-3 font-medium">{t('table.responsable')}</th>
                <th className="px-4 py-3 font-medium">{t('table.fechaLimite')}</th>
                <th className="px-4 py-3 font-medium">{t('table.prioridad')}</th>
                <th className="px-4 py-3 font-medium">{t('table.progreso')}</th>
                <th className="px-4 py-3 font-medium">{t('table.estado')}</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => {
                const marca = c.marcaId ? marcas.find((m) => m.id === c.marcaId) : undefined;
                const dias = diasHasta(c.fechaLimite);
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSeleccionado(c)}
                    className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="truncate font-medium text-gray-900">{c.entregable}</p>
                      <p className="truncate text-xs text-gray-500">{c.categoria}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{marca?.nombre || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.responsableId || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{formatFecha(c.fechaLimite)}</span>
                      {c.estado !== 'Cumplido' && (
                        <span className={`ml-1.5 text-xs ${dias < 0 ? 'text-danger-600' : dias <= 7 ? 'text-warning-600' : 'text-gray-400'}`}>
                          ({dias < 0 ? `vencido ${Math.abs(dias)}d` : `${dias}d`})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge estado={c.prioridad} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar valor={c.progreso} className="w-20" />
                        <span className="text-xs text-gray-500">{c.progreso}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge estado={c.estado} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CompromisoDetalleModal
        compromiso={seleccionado}
        onCerrar={() => setSeleccionado(null)}
        onCambiarEstado={handleCambiarEstado}
      />
    </div>
  );
}
