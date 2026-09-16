import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Download, Eye, Settings, Download as DownloadIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMarcas } from '../store';
import { useToast } from '@/hooks/useToast';
import { MarcaFormModal } from '../components/MarcaFormModal';
import { authHeaders } from '@/lib/auth';

interface Sector {
  id: string;
  nombre: string;
}

interface ColumnasVisibles {
  nombre: boolean;
  sector: boolean;
  identificacion: boolean;
  contacto1: boolean;
  cargo1: boolean;
  telefono1: boolean;
  correo1: boolean;
  contacto2: boolean;
  cargo2: boolean;
  telefono2: boolean;
  correo2: boolean;
  contacto3: boolean;
  cargo3: boolean;
  telefono3: boolean;
  correo3: boolean;
  rut: boolean;
}

const columnasDefault: ColumnasVisibles = {
  nombre: true,
  sector: true,
  identificacion: true,
  contacto1: true,
  cargo1: true,
  telefono1: true,
  correo1: true,
  contacto2: true,
  cargo2: true,
  telefono2: true,
  correo2: true,
  contacto3: true,
  cargo3: true,
  telefono3: true,
  correo3: true,
  rut: true,
};

export function MarcasListPage() {
  const { marcas, eliminarMarca, crearMarca } = useMarcas();
  const { mostrarToast } = useToast();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [marcaParaEditar, setMarcaParaEditar] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [modalColumnasAbierto, setModalColumnasAbierto] = useState(false);
  const [columnasVisibles, setColumnasVisibles] = useState<ColumnasVisibles>(columnasDefault);
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [marcasGlobales, setMarcasGlobales] = useState<any[]>([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<any | null>(null);
  const [importando, setImportando] = useState(false);
  const [busquedaMarcas, setBusquedaMarcas] = useState('');

  // Cargar configuración de columnas desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('marcas_columnas_visibles');
      if (saved) {
        const parsed = JSON.parse(saved);
        setColumnasVisibles({ ...columnasDefault, ...parsed });
      }
    } catch (error) {
      console.error('Error loading column config:', error);
    }
  }, []);

  // Guardar configuración de columnas en localStorage
  const handleToggleColumna = (columna: keyof ColumnasVisibles) => {
    const nuevasColumnas = { ...columnasVisibles, [columna]: !columnasVisibles[columna] };
    setColumnasVisibles(nuevasColumnas);
    localStorage.setItem('marcas_columnas_visibles', JSON.stringify(nuevasColumnas));
  };

  useEffect(() => {
    const cargarSectores = async () => {
      try {
        const response = await fetch(`/api/sectores`);
        if (response.ok) {
          const data = await response.json();
          setSectores(data);
        }
      } catch (error) {
        console.error('Error loading sectores:', error);
      }
    };
    cargarSectores();
  }, []);

  const getNombreSector = (sectorId?: string | null) => {
    if (!sectorId) return '-';
    const sector = sectores.find((s) => s.id === sectorId);
    return sector?.nombre || '-';
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta marca?')) return;
    setEliminando(id);
    try {
      await eliminarMarca(id);
      mostrarToast('Marca eliminada correctamente.');
    } catch (error) {
      mostrarToast('Error al eliminar la marca.');
    } finally {
      setEliminando(null);
    }
  };

  const handleAbrirModal = (id?: string) => {
    if (id) {
      setMarcaParaEditar(id);
    } else {
      setMarcaParaEditar(null);
    }
    setModalAbierto(true);
  };

  const handleAbrirModalImportar = async () => {
    setModalImportarAbierto(true);
    setBusquedaMarcas('');
    try {
      const headers = new Headers();
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      const response = await fetch('/api/marcas/todas', { headers });
      if (response.ok) {
        const data = await response.json();
        setMarcasGlobales(data);
      } else {
        mostrarToast('Error al cargar las marcas globales.');
      }
    } catch (error) {
      mostrarToast('Error al cargar las marcas globales.');
    }
  };

  const handleImportarMarca = async () => {
    if (!marcaSeleccionada) return;
    setImportando(true);
    try {
      await crearMarca({
        nombre: marcaSeleccionada.nombre,
        sectorId: marcaSeleccionada.sectorId,
        tipoIdentificacion: marcaSeleccionada.tipoIdentificacion,
        identificacion: marcaSeleccionada.identificacion,
        rutNombre: marcaSeleccionada.rutNombre,
      });
      mostrarToast('Marca importada correctamente.');
      setModalImportarAbierto(false);
      setMarcaSeleccionada(null);
      setMarcasGlobales([]);
    } catch (error) {
      mostrarToast('Error al importar la marca.');
    } finally {
      setImportando(false);
    }
  };

  return (
    <div>
      <PageHeader
        titulo="Marcas"
        descripcion="Directorio de marcas y patrocinadores potenciales."
        accion={
          <div className="flex gap-2">
            <Button variante="secundario" icono={<DownloadIcon size={16} />} onClick={handleAbrirModalImportar}>
              Consultar marcas creadas
            </Button>
            <Button variante="primario" icono={<Plus size={16} />} onClick={() => handleAbrirModal()}>
              Nueva Marca
            </Button>
          </div>
        }
      />

      {marcas.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setModalColumnasAbierto(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            title="Configurar columnas"
          >
            <Settings size={16} />
            Columnas
          </button>
        </div>
      )}

      {marcas.length === 0 ? (
        <EmptyState
          icono={Plus}
          titulo="Sin marcas registradas"
          descripcion="Comienza añadiendo la primera marca a tu directorio."
          accion={
            <Button variante="primario" icono={<Plus size={16} />} onClick={() => handleAbrirModal()}>
              Crear Marca
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[1400px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                {columnasVisibles.nombre && <th className="px-4 py-3 font-medium">Nombre</th>}
                {columnasVisibles.sector && <th className="px-4 py-3 font-medium">Sector</th>}
                {columnasVisibles.identificacion && <th className="px-4 py-3 font-medium">Identificación</th>}
                {columnasVisibles.contacto1 && <th className="px-4 py-3 font-medium">Contacto 1</th>}
                {columnasVisibles.cargo1 && <th className="px-4 py-3 font-medium">Cargo 1</th>}
                {columnasVisibles.telefono1 && <th className="px-4 py-3 font-medium">Teléfono 1</th>}
                {columnasVisibles.correo1 && <th className="px-4 py-3 font-medium">Correo 1</th>}
                {columnasVisibles.contacto2 && <th className="px-4 py-3 font-medium">Contacto 2</th>}
                {columnasVisibles.cargo2 && <th className="px-4 py-3 font-medium">Cargo 2</th>}
                {columnasVisibles.telefono2 && <th className="px-4 py-3 font-medium">Teléfono 2</th>}
                {columnasVisibles.correo2 && <th className="px-4 py-3 font-medium">Correo 2</th>}
                {columnasVisibles.contacto3 && <th className="px-4 py-3 font-medium">Contacto 3</th>}
                {columnasVisibles.cargo3 && <th className="px-4 py-3 font-medium">Cargo 3</th>}
                {columnasVisibles.telefono3 && <th className="px-4 py-3 font-medium">Teléfono 3</th>}
                {columnasVisibles.correo3 && <th className="px-4 py-3 font-medium">Correo 3</th>}
                {columnasVisibles.rut && <th className="px-4 py-3 font-medium">RUT</th>}
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {marcas.map((marca) => (
                <tr key={marca.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  {columnasVisibles.nombre && (
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{marca.nombre}</p>
                    </td>
                  )}
                  {columnasVisibles.sector && <td className="px-4 py-3 text-sm text-gray-600">{getNombreSector(marca.sectorId)}</td>}
                  {columnasVisibles.identificacion && (
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {marca.tipoIdentificacion}: {marca.identificacion}
                    </td>
                  )}
                  {columnasVisibles.contacto1 && <td className="px-4 py-3 text-sm text-gray-600">{marca.personaContacto1 || '-'}</td>}
                  {columnasVisibles.cargo1 && <td className="px-4 py-3 text-sm text-gray-600">{marca.cargoContacto1 || '-'}</td>}
                  {columnasVisibles.telefono1 && <td className="px-4 py-3 text-sm text-gray-600">{marca.telefonoContacto1 || '-'}</td>}
                  {columnasVisibles.correo1 && <td className="px-4 py-3 text-sm text-gray-600 truncate">{marca.correoContacto1 || '-'}</td>}
                  {columnasVisibles.contacto2 && <td className="px-4 py-3 text-sm text-gray-600">{marca.personaContacto2 || '-'}</td>}
                  {columnasVisibles.cargo2 && <td className="px-4 py-3 text-sm text-gray-600">{marca.cargoContacto2 || '-'}</td>}
                  {columnasVisibles.telefono2 && <td className="px-4 py-3 text-sm text-gray-600">{marca.telefonoContacto2 || '-'}</td>}
                  {columnasVisibles.correo2 && <td className="px-4 py-3 text-sm text-gray-600 truncate">{marca.correoContacto2 || '-'}</td>}
                  {columnasVisibles.contacto3 && <td className="px-4 py-3 text-sm text-gray-600">{marca.personaContacto3 || '-'}</td>}
                  {columnasVisibles.cargo3 && <td className="px-4 py-3 text-sm text-gray-600">{marca.cargoContacto3 || '-'}</td>}
                  {columnasVisibles.telefono3 && <td className="px-4 py-3 text-sm text-gray-600">{marca.telefonoContacto3 || '-'}</td>}
                  {columnasVisibles.correo3 && <td className="px-4 py-3 text-sm text-gray-600 truncate">{marca.correoContacto3 || '-'}</td>}
                  {columnasVisibles.rut && (
                    <td className="px-4 py-3">
                    {marca.rutNombre ? (
                      <div className="flex gap-1">
                        <button
                          onClick={async () => {
                            try {
                              const headers = new Headers();
                              const auth = authHeaders();
                              Object.entries(auth).forEach(([key, value]) => {
                                if (value) headers.set(key, value);
                              });
                              const response = await fetch(`/api/marcas/${marca.id}/rut`, { headers });
                              if (!response.ok) {
                                mostrarToast('Error al visualizar el archivo');
                                return;
                              }
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              window.open(url, '_blank');
                              setTimeout(() => window.URL.revokeObjectURL(url), 100);
                            } catch (error) {
                              mostrarToast('Error al visualizar el archivo');
                            }
                          }}
                          className="text-brand-600 hover:text-brand-800 transition-colors"
                          title="Visualizar RUT"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const headers = new Headers();
                              const auth = authHeaders();
                              Object.entries(auth).forEach(([key, value]) => {
                                if (value) headers.set(key, value);
                              });
                              const response = await fetch(`/api/marcas/${marca.id}/rut`, { headers });
                              if (!response.ok) {
                                mostrarToast('Error al descargar el archivo');
                                return;
                              }
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = marca.rutNombre || 'rut.pdf';
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              mostrarToast('Error al descargar el archivo');
                            }
                          }}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                          title="Descargar RUT"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin archivo</span>
                    )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAbrirModal(marca.id)}
                        className="text-gray-600 hover:text-brand-800 transition-colors"
                        aria-label="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminar(marca.id)}
                        disabled={eliminando === marca.id}
                        className="text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de configuración de columnas */}
      {modalColumnasAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Configurar columnas visibles</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(columnasDefault).map(([columna]) => {
                const labels: Record<string, string> = {
                  nombre: 'Nombre',
                  sector: 'Sector',
                  identificacion: 'Identificación',
                  contacto1: 'Contacto 1',
                  cargo1: 'Cargo 1',
                  telefono1: 'Teléfono 1',
                  correo1: 'Correo 1',
                  contacto2: 'Contacto 2',
                  cargo2: 'Cargo 2',
                  telefono2: 'Teléfono 2',
                  correo2: 'Correo 2',
                  contacto3: 'Contacto 3',
                  cargo3: 'Cargo 3',
                  telefono3: 'Teléfono 3',
                  correo3: 'Correo 3',
                  rut: 'RUT',
                };

                return (
                  <label key={columna} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnasVisibles[columna as keyof ColumnasVisibles]}
                      onChange={() => handleToggleColumna(columna as keyof ColumnasVisibles)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">{labels[columna]}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setModalColumnasAbierto(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de importar marcas */}
      {modalImportarAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Importar marca</h3>
              <p className="mt-1 text-sm text-gray-600">Selecciona una marca de la base de datos global para importarla a tu compañía.</p>
            </div>

            <div className="p-6">
              {marcasGlobales.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No hay marcas disponibles.</p>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o identificación..."
                    value={busquedaMarcas}
                    onChange={(e) => setBusquedaMarcas(e.target.value)}
                    className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  />
                  <div className="max-h-96 space-y-1 overflow-y-auto">
                    {marcasGlobales
                      .filter(
                        (marca) =>
                          marca.nombre.toLowerCase().includes(busquedaMarcas.toLowerCase()) ||
                          marca.identificacion.toLowerCase().includes(busquedaMarcas.toLowerCase())
                      )
                      .map((marca) => (
                    <div
                      key={marca.id}
                      onClick={() => setMarcaSeleccionada(marcaSeleccionada?.id === marca.id ? null : marca)}
                      className={`rounded border px-3 py-2 cursor-pointer transition-colors flex items-center justify-between ${
                        marcaSeleccionada?.id === marca.id
                          ? 'border-brand-600 bg-brand-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{marca.nombre}</p>
                        <p className="text-xs text-gray-500">{marca.tipoIdentificacion} {marca.identificacion}</p>
                      </div>
                      <input
                        type="radio"
                        checked={marcaSeleccionada?.id === marca.id}
                        onChange={() => setMarcaSeleccionada(marca)}
                        className="h-4 w-4 text-brand-600 ml-2"
                      />
                    </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setModalImportarAbierto(false);
                  setMarcaSeleccionada(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <Button
                variante="primario"
                disabled={!marcaSeleccionada || importando}
                onClick={handleImportarMarca}
              >
                {importando ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <MarcaFormModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        marcaId={marcaParaEditar}
      />
    </div>
  );
}
