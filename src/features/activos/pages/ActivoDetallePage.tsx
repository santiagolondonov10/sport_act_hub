import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Package, MapPin, Users, Boxes, UsersRound, Image as ImageIcon, Download, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCOP, formatFecha, formatNumero } from '@/lib/format';
import { authHeaders } from '@/lib/auth';
import { acuerdos, marcas, segmentosAudiencia } from '@/data';
import { getInsigniasAudiencia } from '@/lib/activoAudiencia';
import { useActivos } from '../store';
import { useToast } from '@/hooks/useToast';
import { ActivoFormModal } from '../components/ActivoFormModal';
import { FotoPreviewModal } from '../components/FotoPreviewModal';
import type { Activo } from '@/types';


export function ActivoDetallePage() {
  const { activoId } = useParams<{ activoId: string }>();
  const { getActivoPorId, actualizarActivo, eliminarActivo } = useActivos();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [previewFotoAbierto, setPreviewFotoAbierto] = useState(false);
  const [fotoPreviewSeleccionada, setFotoPreviewSeleccionada] = useState<{ id: string; nombre: string } | null>(null);

  const activo = activoId ? getActivoPorId(activoId) : undefined;

  if (!activo) {
    return (
      <EmptyState
        icono={Package}
        titulo="Activo no encontrado"
        descripcion="Es posible que el activo haya sido eliminado o el enlace sea incorrecto."
        accion={
          <Link to="/activos">
            <Button variante="primario">Volver a Activos</Button>
          </Link>
        }
      />
    );
  }

  const acuerdosRelacionados = acuerdos.filter((a) => activo.acuerdosAsociadosIds.includes(a.id));
  const insigniasAudiencia = getInsigniasAudiencia(activo);

  async function handleGuardar(valores: Omit<Activo, 'id' | 'acuerdosAsociadosIds'>) {
    if (!activo) return;
    try {
      await actualizarActivo(activo.id, valores);
      mostrarToast('Activo actualizado correctamente.');
      setModalAbierto(false);
    } catch (error) {
      mostrarToast('Error al actualizar el activo.');
    }
  }

  async function handleEliminar() {
    if (!activo || !confirm('¿Estás seguro de que quieres eliminar este activo?')) return;
    setEliminando(true);
    try {
      await eliminarActivo(activo.id);
      mostrarToast('Activo eliminado correctamente.');
      navigate('/activos');
    } catch (error) {
      mostrarToast('Error al eliminar el activo.');
      setEliminando(false);
    }
  }

  return (
    <div>
      <PageHeader
        titulo={activo.nombre}
        breadcrumbs={[{ label: 'Activos', to: '/activos' }, { label: activo.nombre }]}
        accion={
          <div className="flex gap-2">
            <Button variante="secundario" icono={<Pencil size={15} />} onClick={() => setModalAbierto(true)}>
              Editar
            </Button>
            <Button
              variante="peligro"
              icono={<Trash2 size={15} />}
              onClick={handleEliminar}
              disabled={eliminando}
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        }
      />

      {insigniasAudiencia.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {insigniasAudiencia.map((insignia) => (
            <span
              key={insignia}
              className="inline-flex items-center gap-1.5 rounded-full bg-info-50 px-2.5 py-1 text-xs font-medium text-info-700"
            >
              <UsersRound size={12} />
              {insignia}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Información general" action={<Badge estado={activo.estado} />} />
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{activo.descripcion}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Canal o ubicación</p>
                    <p className="text-sm font-medium text-gray-900">{activo.canal}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users size={16} className="mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Alcance estimado</p>
                    <p className="text-sm font-medium text-gray-900">{activo.alcanceEstimado}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Boxes size={16} className="mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Inventario</p>
                    <p className="text-sm font-medium text-gray-900">
                      {activo.inventarioDisponible} disponibles de {activo.inventarioTotal}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package size={16} className="mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Categoría</p>
                    <p className="text-sm font-medium text-gray-900">{activo.categoriaNombre || 'Sin categoría'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Derechos incluidos" />
            <CardContent>
              {activo.derechosIncluidos.length === 0 ? (
                <p className="text-sm text-gray-500">No se han definido derechos específicos para este activo.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {activo.derechosIncluidos.map((derecho) => (
                    <li key={derecho} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
                      {derecho}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {activo.audiencia && (
            <Card>
              <CardHeader
                title="Audiencia y capacidad de activación"
                description="Información agregada proveniente de Sports Act GO"
              />
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Tipo de audiencia</p>
                    <Badge estado={activo.audiencia.tipoAudiencia} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Canal de activación</p>
                    <p className="text-sm font-medium text-gray-900">{activo.audiencia.canalActivacion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Alcance estimado</p>
                    <p className="text-sm font-medium text-gray-900">{formatNumero(activo.audiencia.alcanceEstimado)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Capacidad de segmentación</p>
                    <p className="text-sm font-medium text-gray-900">{activo.audiencia.capacidadSegmentacion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Frecuencia máxima</p>
                    <p className="text-sm font-medium text-gray-900">{activo.audiencia.frecuenciaMaxima}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Requiere Sports Act GO</p>
                    <p className="text-sm font-medium text-gray-900">{activo.audiencia.requiereGO ? 'Sí' : 'No'}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs text-gray-500">Indicadores disponibles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activo.audiencia.indicadoresDisponibles.map((indicador) => (
                      <span key={indicador} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                        {indicador}
                      </span>
                    ))}
                  </div>
                </div>

                {activo.audiencia.segmentosRelacionadosIds.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs text-gray-500">Segmentos relacionados</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activo.audiencia.segmentosRelacionadosIds.map((segId) => {
                        const segmento = segmentosAudiencia.find((s) => s.id === segId);
                        return segmento ? (
                          <Link
                            key={segId}
                            to="/audiencias"
                            className="rounded-full bg-info-50 px-2.5 py-1 text-xs text-info-700 hover:underline"
                          >
                            {segmento.nombre}
                          </Link>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {activo.audiencia.restricciones && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600">Restricciones:</span> {activo.audiencia.restricciones}
                  </p>
                )}

                <p className="text-xs text-gray-400">Actualizado el {formatFecha(activo.audiencia.actualizadoEn)}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title="Historial de asociaciones" description="Acuerdos donde se ha incluido este activo" />
            <CardContent>
              {acuerdosRelacionados.length === 0 ? (
                <p className="text-sm text-gray-500">Este activo aún no ha sido incluido en ningún acuerdo.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {acuerdosRelacionados.map((a) => {
                    const marca = marcas.find((m) => m.id === a.marcaId);
                    return (
                      <li key={a.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <Link to={`/acuerdos/${a.id}`} className="text-sm font-medium text-gray-900 hover:text-brand-800 hover:underline">
                            {a.nombre}
                          </Link>
                          <p className="text-xs text-gray-500">{marca?.nombre}</p>
                        </div>
                        <Badge estado={a.estado} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {activo.fotos && activo.fotos.length > 0 && (
            <Card>
              <CardHeader title="Foto del activo" />
              <CardContent className="flex flex-col gap-3">
                {activo.fotos.map((foto) => (
                  <button
                    key={foto.id}
                    onClick={() => {
                      setFotoPreviewSeleccionada({ id: foto.id, nombre: foto.nombreArchivo });
                      setPreviewFotoAbierto(true);
                    }}
                    className="group relative overflow-hidden rounded-lg border border-gray-200 hover:border-brand-400 transition-colors"
                  >
                    <img
                      src={`/api/activos/${activoId}/fotos/${foto.id}`}
                      alt={foto.nombreArchivo}
                      className="h-48 w-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                      <p className="text-xs font-medium text-white/0 group-hover:text-white/100 transition-all">
                        Click para ampliar
                      </p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {(!activo.fotos || activo.fotos.length === 0) && (
            <Card>
              <CardHeader title="Foto del activo" />
              <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
                <div className="rounded-lg bg-gray-100 p-4 text-gray-400">
                  <ImageIcon size={32} />
                </div>
                <p className="text-sm text-gray-600">Sin foto cargada</p>
                <Button
                  variante="secundario"
                  tamano="sm"
                  onClick={() => setModalAbierto(true)}
                >
                  Agregar foto
                </Button>
              </CardContent>
            </Card>
          )}

          {activo.documentosAdjuntos && activo.documentosAdjuntos.length > 0 && (
            <Card>
              <CardHeader title="Documentos adjuntos" />
              <CardContent className="flex flex-col gap-2">
                {activo.documentosAdjuntos.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:border-brand-400 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">{doc.nombre}</span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const headers = new Headers();
                          const auth = authHeaders();
                          Object.entries(auth).forEach(([key, value]) => {
                            if (value) headers.set(key, value);
                          });
                          const response = await fetch(`/api/activos/${activoId}/documentos/${idx}`, { headers });
                          if (!response.ok) {
                            throw new Error('Error al descargar el documento');
                          }
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = doc.nombre;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (error) {
                          console.error('Error downloading document:', error);
                        }
                      }}
                      className="flex-shrink-0 text-gray-400 hover:text-brand-600 transition-colors"
                      title="Descargar documento"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title="Valoración comercial" />
            <CardContent>
              <p className="text-2xl font-semibold text-gray-900">{formatCOP(activo.valoracionCOP)}</p>
              <p className="mt-1 text-xs text-gray-500">Valor de referencia para negociación</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ActivoFormModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={handleGuardar}
        activoInicial={activo}
      />

      {fotoPreviewSeleccionada && activoId && (
        <FotoPreviewModal
          abierto={previewFotoAbierto}
          onCerrar={() => {
            setPreviewFotoAbierto(false);
            setFotoPreviewSeleccionada(null);
          }}
          activoId={activoId}
          fotoId={fotoPreviewSeleccionada.id}
          nombreArchivo={fotoPreviewSeleccionada.nombre}
        />
      )}
    </div>
  );
}
