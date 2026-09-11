import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, FileSignature, Mail, Phone, RefreshCcw, User, Pencil, Trash2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCOP, formatFecha } from '@/lib/format';
import { getResponsable, getReportePorAcuerdo } from '@/data';
import { getCumplimientoPorAcuerdo } from '@/lib/selectors';
import { useToast } from '@/hooks/useToast';
import { useAcuerdos } from '../store';
import { useMarcas } from '@/features/marcas/store';
import { useActivos } from '@/features/activos/store';
import { useCompromisos } from '@/features/compromisos/store';
import { EditarAcuerdoModal } from '../components/EditarAcuerdoModal';
import { CompromisoFormModal } from '@/features/compromisos/components/CompromisoFormModal';

export function AcuerdoDetallePage() {
  const navigate = useNavigate();
  const { acuerdoId } = useParams<{ acuerdoId: string }>();
  const { mostrarToast } = useToast();
  const [renovacionSolicitada, setRenovacionSolicitada] = useState(false);
  const { acuerdos, eliminarAcuerdo } = useAcuerdos();
  const { marcas } = useMarcas();
  const { activos } = useActivos();
  const { compromisos, crearCompromiso, actualizarCompromiso, eliminarCompromiso } = useCompromisos();
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [modalCompromisoAbierto, setModalCompromisoAbierto] = useState(false);
  const [compromisoEditando, setCompromisoEditando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const acuerdo = acuerdoId ? acuerdos.find((a) => a.id === acuerdoId) : undefined;

  if (!acuerdo) {
    return (
      <EmptyState
        icono={FileSignature}
        titulo="Acuerdo no encontrado"
        descripcion="Es posible que haya sido eliminado o el enlace sea incorrecto."
        accion={
          <Link to="/acuerdos">
            <Button variante="primario">Volver a Acuerdos</Button>
          </Link>
        }
      />
    );
  }

  const marca = acuerdo ? marcas.find((m) => m.id === acuerdo.marcaId) : undefined;
  const responsable = acuerdo ? getResponsable(acuerdo.responsableId) : undefined;
  const compromisosAcuerdo = acuerdo ? compromisos.filter((c) => c.acuerdoId === acuerdo.id) : [];
  const cumplimiento = acuerdo ? getCumplimientoPorAcuerdo(acuerdo.id) : 0;
  const reporte = acuerdo ? getReportePorAcuerdo(acuerdo.id) : undefined;

  function handleSolicitarRenovacion() {
    setRenovacionSolicitada(true);
    mostrarToast('Seguimiento de renovación registrado para este acuerdo.');
  }

  return (
    <div>
      <PageHeader
        titulo={acuerdo.nombre}
        breadcrumbs={[{ label: 'Acuerdos', to: '/acuerdos' }, { label: acuerdo.nombre }]}
        accion={
          <div className="flex gap-2">
            {reporte && (
              <Link to={`/reportes/${acuerdo.id}`}>
                <Button variante="secundario">Ver reporte ejecutivo</Button>
              </Link>
            )}
            <Button
              variante="secundario"
              icono={<Pencil size={15} />}
              onClick={() => setModalEditarAbierto(true)}
            >
              Editar
            </Button>
            <Button
              variante="peligro"
              icono={<Trash2 size={15} />}
              onClick={async () => {
                if (!confirm('¿Estás seguro de que quieres eliminar este acuerdo?')) return;
                setEliminando(true);
                try {
                  await eliminarAcuerdo(acuerdo.id);
                  mostrarToast('Acuerdo eliminado correctamente.');
                  navigate('/acuerdos');
                } catch (error) {
                  mostrarToast(error instanceof Error ? error.message : 'Error al eliminar el acuerdo.');
                  setEliminando(false);
                }
              }}
              disabled={eliminando}
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Resumen del acuerdo" action={<Badge estado={acuerdo.estado} />} />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Valor del acuerdo</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCOP(acuerdo.valorCOP)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vigencia</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatFecha(acuerdo.fechaInicio)} – {formatFecha(acuerdo.fechaFin)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Cumplimiento</p>
                  <div className="flex items-center gap-2">
                    <ProgressBar valor={cumplimiento} className="w-24" />
                    <span className="text-sm font-medium text-gray-700">{cumplimiento}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Activos incluidos" />
            <CardContent>
              {(acuerdo.activosIncluidosIds ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">Este acuerdo no tiene activos asociados.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(acuerdo.activosIncluidosIds ?? []).map((activoId) => {
                    const activo = activos.find((a) => a.id === activoId);
                    if (!activo) return null;
                    return (
                      <li key={activoId} className="rounded-lg bg-gray-50 px-3 py-2">
                        <Link to={`/activos/${activo.id}`} className="text-sm font-medium text-gray-800 hover:text-brand-800 hover:underline">
                          {activo.nombre}
                        </Link>
                        <p className="text-xs text-gray-500">{activo.categoriaNombre || 'Sin categoría'}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Compromisos relacionados"
              description={`${compromisosAcuerdo.length} compromiso(s) asociados a este acuerdo`}
              action={
                <Button
                  variante="secundario"
                  icono={<Plus size={14} />}
                  onClick={() => {
                    setCompromisoEditando(null);
                    setModalCompromisoAbierto(true);
                  }}
                  className="text-xs"
                >
                  Crear
                </Button>
              }
            />
            <CardContent>
              {compromisosAcuerdo.length === 0 ? (
                <p className="text-sm text-gray-500">Este acuerdo aún no tiene compromisos definidos.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {compromisosAcuerdo.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{c.entregable}</p>
                        <p className="text-xs text-gray-500">Vence {formatFecha(c.fechaLimite)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge estado={c.estado} />
                        <button
                          type="button"
                          onClick={() => {
                            setCompromisoEditando(c.id);
                            setModalCompromisoAbierto(true);
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('¿Estás seguro de que quieres eliminar este compromiso?')) return;
                            try {
                              await eliminarCompromiso(c.id);
                              mostrarToast('Compromiso eliminado correctamente.');
                            } catch (error) {
                              mostrarToast(error instanceof Error ? error.message : 'Error al eliminar el compromiso.');
                            }
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-danger-600"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Patrocinador" />
            <CardContent className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">{marca?.nombre}</p>
              <p className="text-xs text-gray-500">{marca?.sectorId}</p>
              {marca?.personaContacto1 && (
                <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" /> {marca.personaContacto1}
                  </p>
                  {marca.correoContacto1 && (
                    <p className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" /> {marca.correoContacto1}
                    </p>
                  )}
                  {marca.telefonoContacto1 && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" /> {marca.telefonoContacto1}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Responsable interno" />
            <CardContent className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: responsable?.avatarColor }}
              >
                {responsable?.iniciales}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{responsable?.nombre}</p>
                <p className="text-xs text-gray-500">{responsable?.cargo}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Renovación" />
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Interés</span>
                <span className="font-medium text-gray-800">{acuerdo.interesRenovacion}</span>
              </div>
              <p className="text-sm text-gray-600">{acuerdo.notasRenovacion}</p>
              {renovacionSolicitada ? (
                <p className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">
                  <CheckCircle2 size={16} /> Seguimiento de renovación en curso.
                </p>
              ) : (
                (acuerdo.estado === 'Activo' || acuerdo.estado === 'Próximo a vencer') && (
                  <Button variante="secundario" icono={<RefreshCcw size={14} />} onClick={handleSolicitarRenovacion} className="w-full">
                    Iniciar seguimiento de renovación
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {acuerdo && (
        <>
          <EditarAcuerdoModal
            abierto={modalEditarAbierto}
            onCerrar={() => setModalEditarAbierto(false)}
            acuerdo={acuerdo}
          />
          <CompromisoFormModal
            abierto={modalCompromisoAbierto}
            onCerrar={() => {
              setModalCompromisoAbierto(false);
              setCompromisoEditando(null);
            }}
            acuerdoId={acuerdo.id}
            compromisoInicial={compromisoEditando ? compromisos.find((c) => c.id === compromisoEditando) : undefined}
            onGuardar={async (valores) => {
              try {
                if (compromisoEditando) {
                  await actualizarCompromiso(compromisoEditando, valores);
                  mostrarToast('Compromiso actualizado correctamente.');
                } else {
                  await crearCompromiso(valores);
                  mostrarToast('Compromiso creado correctamente.');
                }
              } catch (error) {
                mostrarToast(error instanceof Error ? error.message : 'Error al guardar el compromiso.');
              }
            }}
          />
        </>
      )}
    </div>
  );
}
