import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileBarChart2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { getAcuerdo, getMarca, reportes } from '@/data';
import { getCumplimientoPorAcuerdo } from '@/lib/selectors';
import { formatCOP, formatFecha, formatPorcentaje } from '@/lib/format';

export function ReportesListPage() {
  const [busqueda, setBusqueda] = useState('');

  const filas = useMemo(() => {
    return reportes
      .map((reporte) => {
        const acuerdo = getAcuerdo(reporte.acuerdoId);
        const marca = acuerdo ? getMarca(acuerdo.marcaId) : undefined;
        return { reporte, acuerdo, marca };
      })
      .filter(({ marca, acuerdo }) => {
        const texto = `${marca?.nombre ?? ''} ${acuerdo?.nombre ?? ''}`.toLowerCase();
        return texto.includes(busqueda.toLowerCase());
      });
  }, [busqueda]);

  return (
    <div>
      <PageHeader titulo="Reportes" descripcion="Informes ejecutivos de resultados para cada patrocinador." />

      <div className="mb-4">
        <SearchInput
          placeholder="Buscar por marca o acuerdo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="sm:w-64"
        />
      </div>

      {filas.length === 0 ? (
        <EmptyState icono={FileBarChart2} titulo="No hay reportes que coincidan" descripcion="Ajusta la búsqueda para encontrar el reporte de un patrocinador." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filas.map(({ reporte, acuerdo, marca }) => {
            const cumplimiento = acuerdo ? getCumplimientoPorAcuerdo(acuerdo.id) : 0;
            return (
              <Link
                key={reporte.id}
                to={`/reportes/${reporte.acuerdoId}`}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{marca?.nombre}</p>
                    <p className="text-xs text-gray-500">{acuerdo?.nombre}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800/10 text-brand-800">
                    <FileBarChart2 size={16} />
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatFecha(reporte.periodoInicio)} – {formatFecha(reporte.periodoFin)}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                  <span className="text-gray-500">Cumplimiento</span>
                  <span className="font-semibold text-gray-900">{formatPorcentaje(cumplimiento)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Valor mediático</span>
                  <span className="font-semibold text-success-700">{formatCOP(reporte.valorMediaticoEstimadoCOP)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
