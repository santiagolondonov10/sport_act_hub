import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSignature, TriangleAlert, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLanguage } from '@/lib/LanguageContext';
import { formatFecha } from '@/lib/format';
import { formatCurrency } from '@/lib/formatters';
import { getCumplimientoPorAcuerdo, getTiempoConsumidoPorAcuerdo } from '@/lib/selectors';
import type { EstadoAcuerdo } from '@/types';
import { useAcuerdos } from '../store';
import { useMarcas } from '@/features/marcas/store';
import { AlertaSemaforoAcuerdo } from '../components/AlertaSemaforoAcuerdo';

const ESTADOS: EstadoAcuerdo[] = ['Borrador', 'Activo', 'Próximo a vencer', 'Finalizado', 'Cancelado'];

export function AcuerdosListPage() {
  const { t } = useLanguage();
  const { acuerdos } = useAcuerdos();
  const { marcas } = useMarcas();
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');

  const filtrados = useMemo(() => {
    return acuerdos.filter((a) => {
      const marca = marcas.find((m) => m.id === a.marcaId);
      const coincideBusqueda =
        a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (marca?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
      const coincideEstado = estado === 'todos' || a.estado === estado;
      return coincideBusqueda && coincideEstado;
    });
  }, [acuerdos, marcas, busqueda, estado]);

  const valorTotalActivo = acuerdos
    .filter((a) => a.estado === 'Activo' || a.estado === 'Próximo a vencer')
    .reduce((total, a) => total + a.valorCOP, 0);
  const proximosAVencer = acuerdos.filter((a) => a.estado === 'Próximo a vencer').length;

  return (
    <div>
      <PageHeader titulo={t('acuerdos.title')} descripcion={t('acuerdos.patrocinios')} />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard etiqueta={t('dashboard.valorVigente')} valor={formatCurrency(valorTotalActivo)} icono={Wallet} tono="marca" />
        <StatCard etiqueta={t('dashboard.acuerdosTotales')} valor={String(acuerdos.length)} icono={FileSignature} tono="neutro" />
        <StatCard
          etiqueta={t('dashboard.proximosVencer')}
          valor={String(proximosAVencer)}
          icono={TriangleAlert}
          tono={proximosAVencer > 0 ? 'advertencia' : 'neutro'}
        />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput
          placeholder={t('search.acuerdoMarca')}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="sm:w-64"
        />
        <FilterSelect
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          options={[{ value: 'todos', label: t('filter.todosLosEstados') }, ...ESTADOS.map((e) => ({ value: e, label: e }))]}
        />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState icono={FileSignature} titulo={t('empty.noAcuerdos')} descripcion={t('empty.ajustaFiltros')} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">{t('table.acuerdo')}</th>
                <th className="px-4 py-3 font-medium">{t('table.marca')}</th>
                <th className="px-4 py-3 font-medium">{t('table.valor')}</th>
                <th className="px-4 py-3 font-medium">{t('table.vigencia')}</th>
                <th className="px-4 py-3 font-medium">Alerta</th>
                <th className="px-4 py-3 font-medium">{t('table.cumplimiento')}</th>
                <th className="px-4 py-3 font-medium">{t('table.estado')}</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((acuerdo) => {
                const marca = marcas.find((m) => m.id === acuerdo.marcaId);
                const cumplimiento = getCumplimientoPorAcuerdo(acuerdo.id);
                return (
                  <tr key={acuerdo.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <Link to={`/acuerdos/${acuerdo.id}`} className="font-medium text-gray-900 hover:text-brand-800 hover:underline">
                        {acuerdo.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{marca?.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(acuerdo.valorCOP)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatFecha(acuerdo.fechaInicio)} – {formatFecha(acuerdo.fechaFin)}
                    </td>
                    <td className="px-4 py-3">
                      <AlertaSemaforoAcuerdo tiempoConsumido={getTiempoConsumidoPorAcuerdo(acuerdo.fechaInicio, acuerdo.fechaFin)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar valor={cumplimiento} className="w-20" />
                        <span className="text-xs text-gray-500">{cumplimiento}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge estado={acuerdo.estado} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
