import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/shared/PageHeader';
import { useCompromisos } from '../store';
import { useAcuerdos } from '@/features/acuerdos/store';
import { useMarcas } from '@/features/marcas/store';
import { useEvidencias } from '@/features/evidencias/store';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Link } from 'react-router-dom';
import { formatFechaLarga, diasHasta } from '@/lib/format';
import { canalesAudiencia, campanasAudiencia, segmentosAudiencia } from '@/data';

export function CompromisosDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { compromisos } = useCompromisos();
  const { acuerdos } = useAcuerdos();
  const { marcas } = useMarcas();
  const { evidencias } = useEvidencias();

  const compromiso = compromisos.find((c) => c.id === id);

  if (!compromiso) {
    return (
      <div className="space-y-4">
        <Button
          variante="secundario"
          icono={<ArrowLeft size={16} />}
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">Compromiso no encontrado</p>
        </div>
      </div>
    );
  }

  const acuerdo = acuerdos.find((a) => a.id === compromiso.acuerdoId);
  const marca = compromiso.marcaId ? marcas.find((m) => m.id === compromiso.marcaId) : undefined;
  const dias = diasHasta(compromiso.fechaLimite);
  const segmento = segmentosAudiencia.find((s) => s.id === compromiso.segmentoAudienciaId);
  const canalAudiencia = canalesAudiencia.find((c) => c.id === compromiso.canalAudienciaId);
  const campana = campanasAudiencia.find((c) => c.id === compromiso.campanaAudienciaId);

  const evidenciasRegistradas = evidencias.filter(
    (e) => e.compromisoId === compromiso.id && (e.estado === 'En revisión' || e.estado === 'Aprobada')
  ).length;

  const porcentajeCumplimiento = evidenciasRegistradas > 0 ? Math.min(Math.round((evidenciasRegistradas / 3) * 100), 100) : 0;

  return (
    <div className="space-y-6">
      <Button
        variante="secundario"
        icono={<ArrowLeft size={16} />}
        onClick={() => navigate(-1)}
      >
        Volver
      </Button>

      <PageHeader
        titulo={compromiso.entregable}
        descripcion={acuerdo?.nombre || 'Sin acuerdo asociado'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge estado={compromiso.estado} />
              <Badge estado={compromiso.prioridad} />
              <span className="text-xs text-gray-500">{compromiso.categoria}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Marca</p>
                <p className="font-medium text-gray-900">{marca?.nombre || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Acuerdo</p>
                {acuerdo ? (
                  <Link to={`/acuerdos/${acuerdo.id}`} className="font-medium text-brand-800 hover:underline">
                    {acuerdo.nombre}
                  </Link>
                ) : (
                  <p className="font-medium text-gray-900">-</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Responsable</p>
                <p className="font-medium text-gray-900">{compromiso.responsableId || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Fecha límite</p>
                <p className="font-medium text-gray-900">
                  {formatFechaLarga(compromiso.fechaLimite)}
                  {compromiso.estado !== 'Cumplido' && (
                    <span className={`ml-1 text-xs ${dias < 0 ? 'text-danger-600' : dias <= 7 ? 'text-warning-600' : 'text-gray-400'}`}>
                      ({dias < 0 ? `vencido hace ${Math.abs(dias)} día(s)` : `en ${dias} día(s)`})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {compromiso.observaciones && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Observaciones</p>
                <p className="text-sm text-gray-700">{compromiso.observaciones}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Vínculo con Audiencia</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {segmento && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Segmento</p>
                  <p className="font-medium text-gray-900">{segmento.nombre}</p>
                </div>
              )}
              {canalAudiencia && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Canal</p>
                  <p className="font-medium text-gray-900">{canalAudiencia.nombre}</p>
                </div>
              )}
              {campana && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Campaña</p>
                  <p className="font-medium text-gray-900">{campana.nombre}</p>
                </div>
              )}
              {compromiso.indicadorComprometido && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Indicador</p>
                  <p className="font-medium text-gray-900">{compromiso.indicadorComprometido}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Progreso</h3>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Evidencias registradas</span>
                <span className="font-medium text-gray-900">{evidenciasRegistradas}</span>
              </div>
              <ProgressBar valor={porcentajeCumplimiento} />
              <p className="text-xs text-gray-500 mt-2">{porcentajeCumplimiento}% de cumplimiento</p>
            </div>

            {evidenciasRegistradas > 0 && (
              <Link
                to={`/evidencias?compromiso=${compromiso.id}`}
                className="block w-full text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium text-sm transition-colors"
              >
                Ver evidencias ({evidenciasRegistradas})
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
