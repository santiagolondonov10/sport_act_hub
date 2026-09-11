import { Link, useParams } from 'react-router-dom';
import { Download, Eye, FileBarChart2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCOP, formatFecha, formatNumeroCompacto, formatPorcentaje } from '@/lib/format';
import { getAcuerdo, getMarca, getCompromisosPorAcuerdo, getReportePorAcuerdo } from '@/data';
import { getCumplimientoPorAcuerdo } from '@/lib/selectors';
import { useEvidencias } from '@/features/evidencias/store';
import { useToast } from '@/hooks/useToast';
import { ReporteMetricasChart } from '../components/ReporteMetricasChart';

export function ReporteDetallePage() {
  const { acuerdoId } = useParams<{ acuerdoId: string }>();
  const { mostrarToast } = useToast();
  const { evidencias } = useEvidencias();

  const reporte = acuerdoId ? getReportePorAcuerdo(acuerdoId) : undefined;
  const acuerdo = acuerdoId ? getAcuerdo(acuerdoId) : undefined;

  if (!reporte || !acuerdo) {
    return (
      <EmptyState
        icono={FileBarChart2}
        titulo="Reporte no encontrado"
        descripcion="Aún no existe un reporte ejecutivo generado para este acuerdo."
        accion={
          <Link to="/reportes">
            <Button variante="primario">Volver a Reportes</Button>
          </Link>
        }
      />
    );
  }

  const marca = getMarca(acuerdo.marcaId);
  const compromisos = getCompromisosPorAcuerdo(acuerdo.id);
  const cumplidos = compromisos.filter((c) => c.estado === 'Cumplido').length;
  const pendientes = compromisos.length - cumplidos;
  const cumplimiento = getCumplimientoPorAcuerdo(acuerdo.id);
  const evidenciasDelAcuerdo = evidencias.filter((e) => e.acuerdoId === acuerdo.id);

  return (
    <div>
      <PageHeader
        titulo={`Reporte ejecutivo — ${marca?.nombre}`}
        breadcrumbs={[{ label: 'Reportes', to: '/reportes' }, { label: marca?.nombre ?? '' }]}
        accion={
          <Button
            variante="primario"
            icono={<Download size={15} />}
            onClick={() => mostrarToast('La exportación a PDF estará disponible al conectar el backend. Esta es una vista de demostración.', 'info')}
          >
            Exportar (demostración)
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="space-y-2 pt-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Periodo del informe: {formatFecha(reporte.periodoInicio)} – {formatFecha(reporte.periodoFin)}
          </p>
          <p className="text-sm leading-relaxed text-gray-700">{reporte.narrativa}</p>
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-gray-500">Cumplimiento</p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">{formatPorcentaje(cumplimiento)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-gray-500">Alcance</p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">{formatNumeroCompacto(reporte.alcanceTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-gray-500">Interacciones</p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">{formatNumeroCompacto(reporte.interacciones)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-gray-500">Valor mediático</p>
            <p className="mt-0.5 text-sm font-semibold text-success-700">{formatCOP(reporte.valorMediaticoEstimadoCOP)}</p>
            <p className="text-xs text-gray-400">de {formatCOP(acuerdo.valorCOP)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Alcance e impresiones mensuales" description="Evolución de métricas de exposición" />
          <CardContent>
            <ReporteMetricasChart datos={reporte.metricasMensuales} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Compromisos" description={`${compromisos.length} compromiso(s) del acuerdo`} />
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">Cumplidos</span>
                <span className="font-medium text-gray-900">{cumplidos}</span>
              </div>
              <ProgressBar valor={compromisos.length ? (cumplidos / compromisos.length) * 100 : 0} colorClase="bg-success-500" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">Pendientes / en curso</span>
                <span className="font-medium text-gray-900">{pendientes}</span>
              </div>
              <ProgressBar valor={compromisos.length ? (pendientes / compromisos.length) * 100 : 0} colorClase="bg-warning-500" />
            </div>
            <Link to={`/acuerdos/${acuerdo.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-800 hover:underline">
              <Eye size={14} /> Ver acuerdo completo
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Galería de evidencias" description={`${evidenciasDelAcuerdo.length} evidencia(s) asociadas a este acuerdo`} />
        <CardContent>
          {evidenciasDelAcuerdo.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay evidencias registradas para este acuerdo.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {evidenciasDelAcuerdo.map((evidencia) => (
                <div key={evidencia.id} className="overflow-hidden rounded-lg border border-gray-200">
                  <div
                    className="flex h-16 items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: `${evidencia.colorPreview}1a`, color: evidencia.colorPreview }}
                  >
                    {evidencia.tipo}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium text-gray-800">{evidencia.titulo}</p>
                    <Badge estado={evidencia.estado} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
