import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SelectField, TextAreaField } from '@/components/ui/Field';
import { activos, canalesAudiencia } from '@/data';
import { formatFecha, formatNumero, formatPorcentaje } from '@/lib/format';
import { ESTADOS_AUDIENCIA } from '@/types';
import type { CampanaAudiencia, CapacidadActivacion, EstadoAudiencia, SegmentoAudiencia } from '@/types';
import { useAudiencias } from '../store';
import { useToast } from '@/hooks/useToast';

interface SegmentoDetalleModalProps {
  segmento: SegmentoAudiencia | null;
  onCerrar: () => void;
  capacidades: CapacidadActivacion[];
  campanas: CampanaAudiencia[];
  onVerCampanas: (segmentoId: string) => void;
}

export function SegmentoDetalleModal({ segmento, onCerrar, capacidades, campanas, onVerCampanas }: SegmentoDetalleModalProps) {
  const { actualizarSegmento } = useAudiencias();
  const { mostrarToast } = useToast();

  const [editando, setEditando] = useState(false);
  const [descripcionEdit, setDescripcionEdit] = useState('');
  const [estadoEdit, setEstadoEdit] = useState<EstadoAudiencia>('Activable');
  const [activoParaVincular, setActivoParaVincular] = useState('');

  if (!segmento) return null;

  function iniciarEdicion() {
    if (!segmento) return;
    setDescripcionEdit(segmento.descripcion);
    setEstadoEdit(segmento.estado);
    setEditando(true);
  }

  function guardarEdicion() {
    if (!segmento) return;
    actualizarSegmento(segmento.id, { descripcion: descripcionEdit, estado: estadoEdit });
    mostrarToast('Información agregada del segmento actualizada.');
    setEditando(false);
  }

  function vincularActivo() {
    if (!segmento || !activoParaVincular) return;
    if (segmento.activosRelacionadosIds.includes(activoParaVincular)) {
      mostrarToast('Ese activo ya está vinculado a este segmento.', 'info');
      return;
    }
    actualizarSegmento(segmento.id, {
      activosRelacionadosIds: [...segmento.activosRelacionadosIds, activoParaVincular],
    });
    mostrarToast('Activo vinculado al segmento.');
    setActivoParaVincular('');
  }

  const activosDisponiblesParaVincular = activos.filter((a) => !segmento.activosRelacionadosIds.includes(a.id));
  const capacidadesDelSegmento = capacidades.filter((c) => segmento.capacidadesActivacionIds.includes(c.id));
  const campanasDelSegmento = campanas.filter((c) => segmento.campanasAnterioresIds.includes(c.id));

  return (
    <Modal abierto={Boolean(segmento)} onCerrar={onCerrar} titulo={segmento.nombre} descripcion={segmento.tipoAudienciaLabel} ancho="xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge estado={segmento.estado} />
          <Badge estado={segmento.tipoDato} />
          <span className="text-xs text-gray-500">Fuente: {segmento.fuenteDato}</span>
        </div>

        {editando ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <TextAreaField
              label="Descripción (información agregada)"
              value={descripcionEdit}
              onChange={(e) => setDescripcionEdit(e.target.value)}
              rows={3}
            />
            <SelectField
              label="Estado"
              value={estadoEdit}
              onChange={(e) => setEstadoEdit(e.target.value as EstadoAudiencia)}
              options={ESTADOS_AUDIENCIA.map((e) => ({ value: e, label: e }))}
            />
            <div className="flex justify-end gap-2">
              <Button variante="secundario" tamano="sm" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
              <Button variante="primario" tamano="sm" onClick={guardarEdicion}>
                Guardar cambios
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700">{segmento.descripcion}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">Tamaño</p>
            <p className="font-medium text-gray-900">{formatNumero(segmento.tamano)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Evolución</p>
            <p className="font-medium text-success-700">+{formatPorcentaje(segmento.crecimiento, 1)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{segmento.indicadorDestacadoEtiqueta}</p>
            <p className="font-medium text-gray-900">{segmento.indicadorDestacadoValor}</p>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Características generales</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
            {segmento.caracteristicas.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Intereses</p>
          <div className="flex flex-wrap gap-1.5">
            {segmento.intereses.map((interes) => (
              <span key={interes} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                {interes}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Canales disponibles</p>
          <div className="flex flex-wrap gap-1.5">
            {segmento.canalesDisponibles.map((canalId) => {
              const canal = canalesAudiencia.find((c) => c.id === canalId);
              return canal ? (
                <span key={canalId} className="rounded-full bg-info-50 px-2.5 py-1 text-xs text-info-700">
                  {canal.nombre}
                </span>
              ) : null;
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Indicadores históricos disponibles</p>
          <div className="flex flex-wrap gap-1.5">
            {segmento.indicadoresDisponibles.map((indicador) => (
              <span key={indicador} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                {indicador}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Capacidades de activación</p>
          {capacidadesDelSegmento.length === 0 ? (
            <p className="text-sm text-gray-500">Sin capacidades de activación vinculadas todavía.</p>
          ) : (
            <ul className="space-y-1.5">
              {capacidadesDelSegmento.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                  <span className="text-gray-700">{c.nombre}</span>
                  <Badge estado={c.estado} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Activos comerciales relacionados</p>
          {segmento.activosRelacionadosIds.length === 0 ? (
            <p className="mb-2 text-sm text-gray-500">Este segmento aún no tiene activos vinculados.</p>
          ) : (
            <ul className="mb-2 space-y-1.5">
              {segmento.activosRelacionadosIds.map((id) => {
                const activo = activos.find((a) => a.id === id);
                if (!activo) return null;
                return (
                  <li key={id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                    <Link to={`/activos/${activo.id}`} onClick={onCerrar} className="text-gray-700 hover:text-brand-800 hover:underline">
                      {activo.nombre}
                    </Link>
                    <Badge estado={activo.estado} />
                  </li>
                );
              })}
            </ul>
          )}
          {activosDisponiblesParaVincular.length > 0 && (
            <div className="flex gap-2">
              <select
                value={activoParaVincular}
                onChange={(e) => setActivoParaVincular(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-800 focus:outline-none"
              >
                <option value="">Selecciona un activo para vincular...</option>
                {activosDisponiblesParaVincular.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
              <Button tamano="sm" variante="secundario" icono={<Plus size={13} />} onClick={vincularActivo} disabled={!activoParaVincular}>
                Vincular
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span>Actualizado el {formatFecha(segmento.actualizadoEn)}</span>
          <span>Fuente: {segmento.fuenteDato}</span>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          {!editando && (
            <Button variante="secundario" icono={<Pencil size={14} />} onClick={iniciarEdicion}>
              Editar información agregada
            </Button>
          )}
          <Button
            variante="secundario"
            onClick={() => {
              onVerCampanas(segmento.id);
              onCerrar();
            }}
          >
            Ver campañas {campanasDelSegmento.length > 0 ? `(${campanasDelSegmento.length})` : ''}
          </Button>
          <Button variante="fantasma" onClick={onCerrar} className="ml-auto">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
