import { Link } from 'react-router-dom';
import { Check, ExternalLink, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatFechaLarga } from '@/lib/format';
import { campanasAudiencia, getAcuerdo, getMarca, getResponsable } from '@/data';
import type { Evidencia, EstadoEvidencia } from '@/types';

interface EvidenciaDetalleModalProps {
  evidencia: Evidencia | null;
  onCerrar: () => void;
  onCambiarEstado: (id: string, estado: EstadoEvidencia) => void;
}

export function EvidenciaDetalleModal({ evidencia, onCerrar, onCambiarEstado }: EvidenciaDetalleModalProps) {
  if (!evidencia) return null;

  const acuerdo = getAcuerdo(evidencia.acuerdoId);
  const marca = acuerdo ? getMarca(acuerdo.marcaId) : undefined;
  const responsable = getResponsable(evidencia.responsableId);
  const campana = campanasAudiencia.find((c) => c.id === evidencia.campanaAudienciaId);

  return (
    <Modal abierto={Boolean(evidencia)} onCerrar={onCerrar} titulo={evidencia.titulo} descripcion={`${evidencia.tipo} · ${marca?.nombre}`}>
      <div className="space-y-4">
        <div
          className="flex h-32 items-center justify-center rounded-lg text-sm font-medium"
          style={{ backgroundColor: `${evidencia.colorPreview}1a`, color: evidencia.colorPreview }}
        >
          Vista previa de demostración
        </div>

        <Badge estado={evidencia.estado} />

        <p className="text-sm text-gray-700">{evidencia.descripcion}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Fecha de ejecución</p>
            <p className="font-medium text-gray-900">{formatFechaLarga(evidencia.fechaEjecucion)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Ubicación / canal</p>
            <p className="font-medium text-gray-900">{evidencia.ubicacionCanal}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Responsable</p>
            <p className="font-medium text-gray-900">{responsable?.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Acuerdo</p>
            {acuerdo && (
              <Link to={`/acuerdos/${acuerdo.id}`} className="font-medium text-brand-800 hover:underline">
                {acuerdo.nombre}
              </Link>
            )}
          </div>
        </div>

        {campana && (
          <Link to="/audiencias" className="block rounded-lg bg-info-50 px-3 py-2 text-xs font-medium text-info-700 hover:underline">
            Campaña de audiencia relacionada: {campana.nombre}
          </Link>
        )}

        {evidencia.url && (
          <a
            href={evidencia.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-800 hover:underline"
          >
            <ExternalLink size={14} /> Abrir enlace de referencia
          </a>
        )}

        {evidencia.estado === 'En revisión' && (
          <div className="flex gap-2 border-t border-gray-100 pt-4">
            <Button
              variante="primario"
              icono={<Check size={15} />}
              onClick={() => onCambiarEstado(evidencia.id, 'Aprobada')}
              className="flex-1"
            >
              Aprobar
            </Button>
            <Button
              variante="peligro"
              icono={<X size={15} />}
              onClick={() => onCambiarEstado(evidencia.id, 'Rechazada')}
              className="flex-1"
            >
              Rechazar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
