import { Link } from 'react-router-dom';
import { FileBarChart2, FileSignature, FolderCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getAcuerdo, getActivo, getMarca, getReportePorAcuerdo } from '@/data';
import { useEvidencias } from '@/features/evidencias/store';
import { formatFecha, formatNumero } from '@/lib/format';
import type { CampanaAudiencia } from '@/types';

export function CampanaDetalleModal({ campana, onCerrar }: { campana: CampanaAudiencia | null; onCerrar: () => void }) {
  const { evidencias } = useEvidencias();

  if (!campana) return null;

  const patrocinador = campana.patrocinadorId ? getMarca(campana.patrocinadorId) : undefined;
  const activo = campana.activoId ? getActivo(campana.activoId) : undefined;
  const acuerdo = campana.acuerdoId ? getAcuerdo(campana.acuerdoId) : undefined;
  const reporte = campana.acuerdoId ? getReportePorAcuerdo(campana.acuerdoId) : undefined;
  const evidenciasRelacionadas = evidencias.filter((e) => campana.evidenciasIds.includes(e.id));

  const indicadores = Array.from(new Set([...Object.keys(campana.metaIndicadores), ...Object.keys(campana.resultadoIndicadores)]));

  return (
    <Modal abierto={Boolean(campana)} onCerrar={onCerrar} titulo={campana.nombre} descripcion={campana.canalTexto} ancho="xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge estado={campana.estado} />
          <span className="text-xs text-gray-500">
            {formatFecha(campana.periodoInicio)} – {formatFecha(campana.periodoFin)}
          </span>
        </div>

        <div>
          <p className="text-xs text-gray-500">Objetivo</p>
          <p className="text-sm text-gray-700">{campana.objetivo}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">Patrocinador</p>
            <p className="font-medium text-gray-900">{patrocinador?.nombre ?? 'Sin definir'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Activo contratado</p>
            {activo ? (
              <Link to={`/activos/${activo.id}`} onClick={onCerrar} className="font-medium text-brand-800 hover:underline">
                {activo.nombre}
              </Link>
            ) : (
              <p className="font-medium text-gray-900">Sin definir</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Acuerdo relacionado</p>
            {acuerdo ? (
              <Link to={`/acuerdos/${acuerdo.id}`} onClick={onCerrar} className="font-medium text-brand-800 hover:underline">
                {acuerdo.nombre}
              </Link>
            ) : (
              <p className="font-medium text-gray-900">Sin definir</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Alcance</p>
            <p className="font-semibold text-gray-900">{formatNumero(campana.alcance)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Interacciones</p>
            <p className="font-semibold text-gray-900">{formatNumero(campana.interacciones)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Registros</p>
            <p className="font-semibold text-gray-900">{formatNumero(campana.registros)}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Meta vs. resultado</p>
          <div className="space-y-3">
            {indicadores.map((indicador) => {
              const meta = campana.metaIndicadores[indicador] ?? 0;
              const resultado = campana.resultadoIndicadores[indicador] ?? 0;
              const porcentaje = meta > 0 ? Math.min(150, Math.round((resultado / meta) * 100)) : 0;
              return (
                <div key={indicador}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-600">{indicador}</span>
                    <span className="text-gray-500">
                      {formatNumero(resultado)} de {formatNumero(meta)} ({porcentaje}%)
                    </span>
                  </div>
                  <ProgressBar valor={Math.min(100, porcentaje)} colorClase={porcentaje >= 100 ? 'bg-success-500' : 'bg-warning-500'} />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Evidencias relacionadas</p>
          {evidenciasRelacionadas.length === 0 ? (
            <p className="text-sm text-gray-500">Sin evidencias registradas para esta campaña todavía.</p>
          ) : (
            <ul className="space-y-1.5">
              {evidenciasRelacionadas.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                  <span className="text-gray-700">{e.titulo}</span>
                  <Badge estado={e.estado} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg bg-brand-800/5 p-3">
          <p className="text-xs font-medium text-brand-800">Recomendación para renovación</p>
          <p className="mt-1 text-sm text-gray-700">{campana.recomendacionRenovacion}</p>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          {acuerdo && (
            <Link to={`/acuerdos/${acuerdo.id}`} onClick={onCerrar} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              <FileSignature size={13} /> Ver acuerdo
            </Link>
          )}
          <Link to="/evidencias" onClick={onCerrar} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <FolderCheck size={13} /> Ver evidencias
          </Link>
          {reporte && (
            <Link to={`/reportes/${reporte.acuerdoId}`} onClick={onCerrar} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              <FileBarChart2 size={13} /> Ver reporte y métricas
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}
