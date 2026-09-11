import { Link } from 'react-router-dom';
import { UsersRound } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ESTADOS_COMPROMISO } from '@/types';
import type { Compromiso, EstadoCompromiso } from '@/types';
import { formatFechaLarga, formatNumero, diasHasta } from '@/lib/format';
import { canalesAudiencia, campanasAudiencia, segmentosAudiencia } from '@/data';
import { useAcuerdos } from '@/features/acuerdos/store';
import { useMarcas } from '@/features/marcas/store';

interface CompromisoDetalleModalProps {
  compromiso: Compromiso | null;
  onCerrar: () => void;
  onCambiarEstado: (id: string, estado: EstadoCompromiso) => void;
}

export function CompromisoDetalleModal({ compromiso, onCerrar, onCambiarEstado }: CompromisoDetalleModalProps) {
  if (!compromiso) return null;

  const { acuerdos } = useAcuerdos();
  const { marcas } = useMarcas();

  const acuerdo = acuerdos.find((a) => a.id === compromiso.acuerdoId);
  const marca = compromiso.marcaId ? marcas.find((m) => m.id === compromiso.marcaId) : undefined;
  const dias = diasHasta(compromiso.fechaLimite);
  const segmento = segmentosAudiencia.find((s) => s.id === compromiso.segmentoAudienciaId);
  const canalAudiencia = canalesAudiencia.find((c) => c.id === compromiso.canalAudienciaId);
  const campana = campanasAudiencia.find((c) => c.id === compromiso.campanaAudienciaId);
  const tieneVinculoAudiencia = Boolean(segmento || canalAudiencia || campana || compromiso.indicadorComprometido);

  return (
    <Modal abierto={Boolean(compromiso)} onCerrar={onCerrar} titulo={compromiso.entregable} descripcion={acuerdo?.nombre}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge estado={compromiso.estado} />
          <Badge estado={compromiso.prioridad} />
          <span className="text-xs text-gray-500">{compromiso.categoria}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Marca</p>
            <p className="font-medium text-gray-900">{marca?.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Acuerdo</p>
            {acuerdo && (
              <Link to={`/acuerdos/${acuerdo.id}`} className="font-medium text-brand-800 hover:underline">
                {acuerdo.nombre}
              </Link>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Responsable</p>
            <p className="font-medium text-gray-900">{compromiso.responsableId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Fecha límite</p>
            <p className="font-medium text-gray-900">
              {formatFechaLarga(compromiso.fechaLimite)}
              {compromiso.estado !== 'Cumplido' && (
                <span className={`ml-1 ${dias < 0 ? 'text-danger-600' : dias <= 7 ? 'text-warning-600' : 'text-gray-400'}`}>
                  ({dias < 0 ? `vencido hace ${Math.abs(dias)} día(s)` : `en ${dias} día(s)`})
                </span>
              )}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-gray-500">Progreso</p>
          <div className="flex items-center gap-2">
            <ProgressBar valor={compromiso.progreso} className="flex-1" />
            <span className="text-sm font-medium text-gray-700">{compromiso.progreso}%</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500">Observaciones</p>
          <p className="text-sm text-gray-700">{compromiso.observaciones}</p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-600">
            0 de {compromiso.evidenciasRequeridas} evidencia(s) requerida(s) registrada(s)
          </span>
          <Link to="/evidencias" className="font-medium text-brand-800 hover:underline">
            Ver evidencias
          </Link>
        </div>

        {tieneVinculoAudiencia && (
          <div className="rounded-lg border border-info-500/20 bg-info-50 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-info-700">
              <UsersRound size={13} /> Vínculo con audiencia y alcance
            </p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {segmento && (
                <div>
                  <dt className="text-gray-500">Segmento</dt>
                  <dd className="font-medium text-gray-700">{segmento.nombre}</dd>
                </div>
              )}
              {canalAudiencia && (
                <div>
                  <dt className="text-gray-500">Canal</dt>
                  <dd className="font-medium text-gray-700">{canalAudiencia.nombre}</dd>
                </div>
              )}
              {campana && (
                <div>
                  <dt className="text-gray-500">Campaña</dt>
                  <dd className="font-medium text-gray-700">{campana.nombre}</dd>
                </div>
              )}
              {compromiso.indicadorComprometido && (
                <div>
                  <dt className="text-gray-500">Indicador comprometido</dt>
                  <dd className="font-medium text-gray-700">
                    {compromiso.indicadorComprometido}
                    {compromiso.metaIndicador !== undefined ? ` · meta ${formatNumero(compromiso.metaIndicador)}` : ''}
                  </dd>
                </div>
              )}
              {compromiso.periodoIndicador && (
                <div>
                  <dt className="text-gray-500">Periodo</dt>
                  <dd className="font-medium text-gray-700">{compromiso.periodoIndicador}</dd>
                </div>
              )}
            </dl>
            <Link to="/audiencias" className="mt-2 inline-block text-xs font-medium text-info-700 hover:underline">
              Ver en Audiencias y alcance
            </Link>
          </div>
        )}

        <div>
          <label htmlFor="cambiar-estado" className="mb-1.5 block text-sm font-medium text-gray-700">
            Cambiar estado
          </label>
          <select
            id="cambiar-estado"
            value={compromiso.estado}
            onChange={(e) => onCambiarEstado(compromiso.id, e.target.value as EstadoCompromiso)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-800/20"
          >
            {ESTADOS_COMPROMISO.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
