import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Target, Mail, Phone, User, Package, Download, FileText, Plus, AlertCircle, Edit2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ETAPAS_OPORTUNIDAD } from '@/types';
import type { Oportunidad } from '@/types';
import { formatCOP, formatFecha, formatFechaLarga } from '@/lib/format';
import { useOportunidades } from '../store';
import { useToast } from '@/hooks/useToast';
import { OportunidadFormModal } from '../components/OportunidadFormModal';
import { CrearAcuerdoModal } from '../components/CrearAcuerdoModal';
import { EditarAcuerdoModal } from '@/features/acuerdos/components/EditarAcuerdoModal';
import { authHeaders } from '@/lib/auth';
import { useMarcas } from '@/features/marcas/store';
import { useActivos } from '@/features/activos/store';
import { useAcuerdos } from '@/features/acuerdos/store';

export function OportunidadDetallePage() {
  const navigate = useNavigate();
  const { oportunidadId } = useParams<{ oportunidadId: string }>();
  const { getOportunidadPorId, actualizarOportunidad, moverEtapa, eliminarOportunidad } = useOportunidades();
  const { mostrarToast } = useToast();
  const { marcas } = useMarcas();
  const { activos } = useActivos();
  const { eliminarAcuerdo } = useAcuerdos();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalAcuerdoAbierto, setModalAcuerdoAbierto] = useState(false);
  const [modalEditarAcuerdoAbierto, setModalEditarAcuerdoAbierto] = useState(false);
  const [oportunidadCargada, setOportunidadCargada] = useState<Oportunidad | undefined>(undefined);
  const [cargando, setCargando] = useState(false);
  const [sectorNombre, setSectorNombre] = useState('');
  const [contratoArchivo, setContratoArchivo] = useState<File | null>(null);
  const [acuerdoRelacionado, setAcuerdoRelacionado] = useState<any | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [eliminandoAcuerdo, setEliminandoAcuerdo] = useState(false);

  // Primero intenta obtenerla del estado local
  let oportunidad = oportunidadId ? getOportunidadPorId(oportunidadId) : undefined;

  // Si no la encuentra localmente, la carga desde la API
  useEffect(() => {
    if (oportunidad) {
      setOportunidadCargada(oportunidad);
      return;
    }

    if (!oportunidadId) return;

    const cargarOportunidad = async () => {
      try {
        setCargando(true);
        const headers = new Headers();
        const auth = authHeaders();
        Object.entries(auth).forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });
        const response = await fetch(`/api/oportunidades/${oportunidadId}`, { headers });
        if (response.ok) {
          const data = await response.json();
          const oportunidadConActividad = {
            ...data,
            actividad: data.actividad || [],
          };
          setOportunidadCargada(oportunidadConActividad);
        }
      } catch (error) {
        console.error('Error loading oportunidad:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarOportunidad();
  }, [oportunidadId, oportunidad]);

  // Usar la oportunidad cargada si está disponible
  if (!oportunidad) {
    oportunidad = oportunidadCargada;
  }

  // Cargar sector de la marca
  useEffect(() => {
    if (!oportunidad?.marcaId) return;

    const marca = marcas.find((m) => m.id === oportunidad.marcaId);
    if (!marca) return;

    if (marca.sectorId) {
      const cargarSector = async () => {
        try {
          const headers = new Headers();
          const auth = authHeaders();
          Object.entries(auth).forEach(([key, value]) => {
            if (value) headers.set(key, value);
          });
          const response = await fetch(`/api/sectores/${marca.sectorId}`, { headers });
          if (response.ok) {
            const data = await response.json();
            setSectorNombre(data.nombre);
          }
        } catch (error) {
          console.error('Error loading sector:', error);
        }
      };
      cargarSector();
    }
  }, [oportunidad?.marcaId]);

  // Cargar acuerdo relacionado a la oportunidad
  useEffect(() => {
    if (!oportunidad?.id) return;

    const cargarAcuerdo = async () => {
      try {
        const headers = new Headers();
        const auth = authHeaders();
        Object.entries(auth).forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });
        const response = await fetch(`/api/oportunidades/${oportunidad.id}/acuerdo`, { headers });
        if (response.ok) {
          const data = await response.json();
          setAcuerdoRelacionado(data);
        }
      } catch (error) {
        console.error('Error loading acuerdo:', error);
      }
    };

    cargarAcuerdo();
  }, [oportunidad?.id]);

  if (!oportunidad) {
    if (cargando) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Cargando oportunidad...</p>
        </div>
      );
    }
    return (
      <EmptyState
        icono={Target}
        titulo="Oportunidad no encontrada"
        descripcion="Es posible que haya sido eliminada o el enlace sea incorrecto."
        accion={
          <Link to="/oportunidades">
            <Button variante="primario">Volver a Oportunidades</Button>
          </Link>
        }
      />
    );
  }

  const marca = marcas.find((m) => m.id === oportunidad.marcaId);

  function handleGuardar(valores: Omit<Oportunidad, 'id' | 'fechaCreacion' | 'actividad'>) {
    if (!oportunidad) return;
    actualizarOportunidad(oportunidad.id, valores);
    mostrarToast('Oportunidad actualizada correctamente.');
  }

  async function handleEliminar() {
    if (!oportunidad || !confirm('¿Estás seguro de que quieres eliminar esta oportunidad?')) return;
    setEliminando(true);
    try {
      await eliminarOportunidad(oportunidad.id);
      mostrarToast('Oportunidad eliminada correctamente.');
      navigate('/oportunidades');
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'Error al eliminar la oportunidad.');
      setEliminando(false);
    }
  }

  return (
    <div>
      <PageHeader
        titulo={marca?.nombre ?? 'Oportunidad'}
        breadcrumbs={[{ label: 'Oportunidades', to: '/oportunidades' }, { label: marca?.nombre ?? '' }]}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Estado de la oportunidad" action={<Badge estado={oportunidad.etapa} />} />
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="etapa-detalle" className="mb-1.5 block text-xs font-medium text-gray-500">
                  Cambiar etapa
                </label>
                <select
                  id="etapa-detalle"
                  value={oportunidad.etapa}
                  onChange={(e) => {
                    const nuevaEtapa = e.target.value as Oportunidad['etapa'];

                    // Validar antes de mover a Firmada
                    if (nuevaEtapa === 'Firmada') {
                      if (!oportunidad.contratosAdjuntos || oportunidad.contratosAdjuntos.length === 0) {
                        mostrarToast('Carga el contrato para mover a Firmada');
                        return;
                      }
                      if (!acuerdoRelacionado) {
                        mostrarToast('Carga los acuerdos para mover a firmada');
                        return;
                      }
                    }

                    moverEtapa(oportunidad.id, nuevaEtapa);
                    mostrarToast(`Etapa actualizada a "${nuevaEtapa}".`);
                  }}
                  className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-800/20 sm:w-auto"
                >
                  {ETAPAS_OPORTUNIDAD.map((etapa) => (
                    <option key={etapa} value={etapa}>
                      {etapa}
                    </option>
                  ))}
                </select>
              </div>

              {oportunidad.etapa === 'Perdida' && oportunidad.motivoPerdida && (
                <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  Motivo de pérdida: {oportunidad.motivoPerdida}
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Valor estimado</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCOP(oportunidad.valorEstimadoCOP)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Próximo paso</p>
                <p className="text-sm text-gray-700">{oportunidad.proximoPaso}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Activos propuestos" />
            <CardContent>
              {oportunidad.activosPropuestosIds.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no se han asociado activos a esta propuesta.</p>
              ) : (
                <ul className="space-y-2">
                  {oportunidad.activosPropuestosIds.map((activoId) => {
                    const activo = activos.find((a) => a.id === activoId);
                    if (!activo) return null;
                    return (
                      <li key={activoId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <span className="flex items-center gap-2 text-sm text-gray-700">
                          <Package size={14} className="text-gray-400" />
                          <Link to={`/activos/${activo.id}`} className="hover:text-brand-800 hover:underline">
                            {activo.nombre}
                          </Link>
                        </span>
                        <span className="text-xs text-gray-500">{formatCOP(Number(activo.valoracionCOP) || 0)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {oportunidad.etapa !== 'Prospección' && oportunidad.etapa !== 'Contactado' && (
            <>
              <Card>
                <CardHeader title="Contratos adjuntos" />
                <CardContent className="space-y-4">
                  {oportunidad.contratosAdjuntos && oportunidad.contratosAdjuntos.length > 0 ? (
                    <div className="space-y-2">
                      {oportunidad.contratosAdjuntos.map((contrato, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:border-brand-400 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={18} className="text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">{contrato.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={async () => {
                                try {
                                  const headers = new Headers();
                                  const auth = authHeaders();
                                  Object.entries(auth).forEach(([key, value]) => {
                                    if (value) headers.set(key, value);
                                  });
                                  const response = await fetch(`/api/oportunidades/${oportunidad.id}/contratos/${idx}`, { headers });
                                  if (!response.ok) {
                                    throw new Error('Error al descargar el contrato');
                                  }
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = contrato.nombre;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                } catch (error) {
                                  console.error('Error downloading contract:', error);
                                }
                              }}
                              className="text-gray-400 hover:text-brand-600 transition-colors p-1"
                              title="Descargar contrato"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('¿Estás seguro de que quieres eliminar este contrato?')) return;
                                try {
                                  const contratosActualizados = oportunidad.contratosAdjuntos!.filter((_, i) => i !== idx);
                                  await actualizarOportunidad(oportunidad.id, {
                                    contratosAdjuntos: contratosActualizados,
                                  });
                                  mostrarToast('Contrato eliminado correctamente.');
                                } catch (error) {
                                  mostrarToast(error instanceof Error ? error.message : 'Error al eliminar el contrato.');
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              title="Eliminar contrato"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-yellow-300 bg-yellow-50 p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm text-yellow-700">Se requiere cargar el contrato para mover esta oportunidad a "Firmada".</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cargar contrato</label>
                    <input
                      type="file"
                      onChange={async (e) => {
                        const archivo = e.target.files?.[0];
                        if (archivo && oportunidad) {
                          try {
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const base64 = reader.result as string;
                              const nuevoContrato = {
                                nombre: archivo.name,
                                base64,
                              };
                              const contratosActuales = oportunidad.contratosAdjuntos || [];
                              try {
                                await actualizarOportunidad(oportunidad.id, {
                                  contratosAdjuntos: [...contratosActuales, nuevoContrato],
                                });
                                setContratoArchivo(archivo);
                                mostrarToast('Contrato cargado correctamente.');
                              } catch (error) {
                                mostrarToast(error instanceof Error ? error.message : 'Error al cargar el contrato.');
                              }
                            };
                            reader.readAsDataURL(archivo);
                          } catch (error) {
                            mostrarToast(error instanceof Error ? error.message : 'Error al cargar el contrato.');
                          }
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                    />
                    {contratoArchivo && (
                      <p className="mt-2 text-xs text-gray-500">{contratoArchivo.name}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Documentos adjuntos" />
                <CardContent className="space-y-4">
                  {oportunidad.documentosAdjuntos && oportunidad.documentosAdjuntos.length > 0 ? (
                    <div className="space-y-2">
                      {oportunidad.documentosAdjuntos.map((documento, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:border-brand-400 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={18} className="text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">{documento.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={async () => {
                                try {
                                  const headers = new Headers();
                                  const auth = authHeaders();
                                  Object.entries(auth).forEach(([key, value]) => {
                                    if (value) headers.set(key, value);
                                  });
                                  const response = await fetch(`/api/oportunidades/${oportunidad.id}/documentos/${idx}`, { headers });
                                  if (!response.ok) {
                                    throw new Error('Error al descargar el documento');
                                  }
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = documento.nombre;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                } catch (error) {
                                  console.error('Error downloading document:', error);
                                }
                              }}
                              className="text-gray-400 hover:text-brand-600 transition-colors p-1"
                              title="Descargar documento"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) return;
                                try {
                                  const documentosActualizados = oportunidad.documentosAdjuntos!.filter((_, i) => i !== idx);
                                  await actualizarOportunidad(oportunidad.id, {
                                    documentosAdjuntos: documentosActualizados,
                                  });
                                  mostrarToast('Documento eliminado correctamente.');
                                } catch (error) {
                                  mostrarToast(error instanceof Error ? error.message : 'Error al eliminar el documento.');
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              title="Eliminar documento"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay documentos adjuntos.</p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cargar documento</label>
                    <input
                      type="file"
                      onChange={async (e) => {
                        const archivo = e.target.files?.[0];
                        if (archivo && oportunidad) {
                          try {
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const base64 = reader.result as string;
                              const nuevoDocumento = {
                                nombre: archivo.name,
                                base64,
                              };
                              const documentosActuales = oportunidad.documentosAdjuntos || [];
                              try {
                                await actualizarOportunidad(oportunidad.id, {
                                  documentosAdjuntos: [...documentosActuales, nuevoDocumento],
                                });
                                mostrarToast('Documento cargado correctamente.');
                              } catch (error) {
                                mostrarToast(error instanceof Error ? error.message : 'Error al cargar el documento.');
                              }
                            };
                            reader.readAsDataURL(archivo);
                          } catch (error) {
                            mostrarToast(error instanceof Error ? error.message : 'Error al cargar el documento.');
                          }
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Acuerdo" />
                <CardContent className="space-y-4">
                  {acuerdoRelacionado ? (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-green-50 px-3 py-2 border border-green-200">
                        <p className="text-sm font-medium text-green-900">Acuerdo creado</p>
                      </div>
                      <Link
                        to={`/acuerdos/${acuerdoRelacionado.id}`}
                        className="text-sm font-medium text-brand-800 hover:underline flex items-center gap-2"
                      >
                        Ver acuerdo: {acuerdoRelacionado.nombre}
                        <FileText size={14} />
                      </Link>
                      <div className="flex gap-2">
                        <Button
                          variante="secundario"
                          tamano="sm"
                          icono={<Edit2 size={14} />}
                          onClick={() => setModalEditarAcuerdoAbierto(true)}
                        >
                          Editar
                        </Button>
                        <Button
                          variante="peligro"
                          tamano="sm"
                          icono={<Trash2 size={14} />}
                          onClick={async () => {
                            if (!confirm('¿Estás seguro de que quieres eliminar este acuerdo?')) return;
                            setEliminandoAcuerdo(true);
                            try {
                              await eliminarAcuerdo(acuerdoRelacionado.id);
                              mostrarToast('Acuerdo eliminado correctamente.');
                              setAcuerdoRelacionado(null);
                            } catch (error) {
                              mostrarToast(error instanceof Error ? error.message : 'Error al eliminar el acuerdo.');
                            } finally {
                              setEliminandoAcuerdo(false);
                            }
                          }}
                          disabled={eliminandoAcuerdo}
                        >
                          {eliminandoAcuerdo ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-yellow-300 bg-yellow-50 p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm text-yellow-700">Se requiere crear un acuerdo para mover esta oportunidad a "Firmada".</p>
                      </div>
                    </div>
                  )}
                  {!acuerdoRelacionado && (
                    <Button
                      variante="secundario"
                      tamano="sm"
                      icono={<Plus size={14} />}
                      className="w-full"
                      onClick={() => setModalAcuerdoAbierto(true)}
                    >
                      Crear acuerdo
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader title="Actividad y seguimiento" />
            <CardContent>
              {Array.isArray(oportunidad.actividad) && oportunidad.actividad.length > 0 ? (
                <ul className="space-y-4 border-l border-gray-200 pl-4">
                  {[...oportunidad.actividad].reverse().map((a) => (
                    <li key={a.id} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-800" />
                      <p className="text-sm text-gray-800">{a.descripcion}</p>
                      <p className="text-xs text-gray-400">
                        {a.autor} · {formatFechaLarga(a.fecha)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No hay actividad registrada aún.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Marca" />
            <CardContent className="space-y-4">
              <div>
                <p className="text-base font-semibold text-gray-900">{marca?.nombre}</p>
                <p className="text-sm text-gray-500">{sectorNombre}</p>
              </div>

              {marca && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  {marca.personaContacto1 && (
                    <div className="flex items-start gap-2.5">
                      <User size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{marca.personaContacto1}</p>
                        {marca.cargoContacto1 && (
                          <p className="text-xs text-gray-500">{marca.cargoContacto1}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {marca.correoContacto1 && (
                    <div className="flex items-center gap-2.5">
                      <Mail size={16} className="text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-700 break-all">{marca.correoContacto1}</p>
                    </div>
                  )}
                  {marca.telefonoContacto1 && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={16} className="text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{marca.telefonoContacto1}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Responsable interno" />
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white bg-amber-500">
                  {(oportunidad.responsableInternoNombre || 'RI').substring(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-gray-900">{oportunidad.responsableInternoNombre || 'No especificado'}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Correo</span>
                  <span className="text-gray-700">{oportunidad.responsableInternoCorreo || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono</span>
                  <span className="text-gray-700">{oportunidad.responsableInternoTelefono || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Fechas" />
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Creada</span>
                <span className="text-gray-700">{formatFecha(oportunidad.fechaCreacion)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cierre estimado</span>
                <span className="text-gray-700">{formatFecha(oportunidad.fechaEstimadaCierre)}</span>
              </div>
            </CardContent>
          </Card>

          {acuerdoRelacionado && (
            <Card>
              <CardHeader title="Acuerdo generado" />
              <CardContent>
                <Link
                  to={`/acuerdos/${acuerdoRelacionado.id}`}
                  className="text-sm font-medium text-brand-800 hover:underline"
                >
                  {acuerdoRelacionado.nombre}
                </Link>
                <p className="mt-1 text-xs text-gray-500">Esta oportunidad ya originó un acuerdo comercial.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <OportunidadFormModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={handleGuardar}
        oportunidadInicial={oportunidad}
      />

      {oportunidad && (
        <>
          <CrearAcuerdoModal
            abierto={modalAcuerdoAbierto}
            onCerrar={() => setModalAcuerdoAbierto(false)}
            oportunidadId={oportunidad.id}
            marcaId={oportunidad.marcaId}
            activosPropuestosIds={oportunidad.activosPropuestosIds}
            onAcuerdoCreado={() => {
              // Recargar acuerdo después de crearlo
              if (oportunidad?.id) {
                const cargarAcuerdo = async () => {
                  try {
                    const headers = new Headers();
                    const auth = authHeaders();
                    Object.entries(auth).forEach(([key, value]) => {
                      if (value) headers.set(key, value);
                    });
                    const response = await fetch(`/api/oportunidades/${oportunidad.id}/acuerdo`, { headers });
                    if (response.ok) {
                      const data = await response.json();
                      setAcuerdoRelacionado(data);
                      mostrarToast('Acuerdo creado correctamente.');
                    }
                  } catch (error) {
                    console.error('Error loading acuerdo:', error);
                  }
                };
                cargarAcuerdo();
              }
            }}
          />

          {acuerdoRelacionado && (
            <EditarAcuerdoModal
              abierto={modalEditarAcuerdoAbierto}
              onCerrar={() => setModalEditarAcuerdoAbierto(false)}
              acuerdo={acuerdoRelacionado}
              onAcuerdoActualizado={(acuerdoActualizado) => {
                setAcuerdoRelacionado(acuerdoActualizado);
                mostrarToast('Acuerdo actualizado correctamente.');
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
