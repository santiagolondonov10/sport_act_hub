import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import type { Acuerdo } from '@/types/acuerdo';
import type { Compromiso, CategoriaCompromiso } from '@/types';
import { authHeaders } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import { useMarcas } from '@/features/marcas/store';
import { useActivos } from '@/features/activos/store';
import { useAcuerdos } from '@/features/acuerdos/store';
import { useCompromisos } from '@/features/compromisos/store';
import { formatCOP } from '@/lib/format';

const CATEGORIAS: CategoriaCompromiso[] = ['Activación', 'Contenido digital', 'Hospitality', 'Señalización', 'Reportería', 'Evento'];

interface CrearAcuerdoModalProps {
  abierto: boolean;
  onCerrar: () => void;
  oportunidadId: string;
  marcaId: string;
  activosPropuestosIds?: string[];
  onAcuerdoCreado?: (acuerdo: Acuerdo) => void;
}

interface CompromisoTemp extends Omit<Compromiso, 'id' | 'acuerdoId'> {
  tempId: string;
}

export function CrearAcuerdoModal({ abierto, onCerrar, oportunidadId, marcaId, activosPropuestosIds = [], onAcuerdoCreado }: CrearAcuerdoModalProps) {
  const { mostrarToast } = useToast();
  const { marcas } = useMarcas();
  const { activos } = useActivos();
  const { recargarAcuerdos } = useAcuerdos();
  const { recargarCompromisos } = useCompromisos();
  const [guardando, setGuardando] = useState(false);
  const [tab, setTab] = useState<'acuerdo' | 'compromisos'>('acuerdo');
  const [activosSeleccionados, setActivosSeleccionados] = useState<string[]>([]);

  const [formularioAcuerdo, setFormularioAcuerdo] = useState({
    nombre: '',
    responsableId: '',
    responsableCorreo: '',
    responsableTelefono: '',
    valorCOP: 0,
    fechaInicio: '',
    fechaFin: '',
    estado: 'Borrador' as const,
    notasRenovacion: '',
    interesRenovacion: 'Sin definir' as const,
  });

  const [compromisos, setCompromisos] = useState<CompromisoTemp[]>([]);
  const [nuevoCompromiso, setNuevoCompromiso] = useState({
    entregable: '',
    categoria: 'Activación' as CategoriaCompromiso,
    responsableId: '',
    fechaLimite: '',
    prioridad: 'Media' as const,
  });

  const handleCambioAcuerdo = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'valorCOP') {
      // Eliminar caracteres no numéricos excepto el punto (que es separador visual)
      const soloNumeros = value.replace(/\D/g, '');
      setFormularioAcuerdo((prev) => ({
        ...prev,
        [name]: soloNumeros ? Number(soloNumeros) : 0,
      }));
    } else {
      setFormularioAcuerdo((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCambioCompromiso = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoCompromiso((prev) => ({ ...prev, [name]: value }));
  };

  const agregarCompromiso = () => {
    if (!nuevoCompromiso.entregable.trim()) {
      mostrarToast('El entregable es requerido.');
      return;
    }
    if (!nuevoCompromiso.fechaLimite) {
      mostrarToast('La fecha límite es requerida.');
      return;
    }

    const compromiso: CompromisoTemp = {
      tempId: `temp-${Date.now()}`,
      entregable: nuevoCompromiso.entregable,
      categoria: nuevoCompromiso.categoria,
      responsableId: nuevoCompromiso.responsableId,
      fechaLimite: nuevoCompromiso.fechaLimite,
      prioridad: nuevoCompromiso.prioridad,
      estado: 'Pendiente',
      progreso: 0,
      evidenciasRequeridas: 0,
      observaciones: '',
    };

    setCompromisos((prev) => [...prev, compromiso]);
    setNuevoCompromiso({
      entregable: '',
      categoria: 'Activación',
      responsableId: '',
      fechaLimite: '',
      prioridad: 'Media',
    });
  };

  const eliminarCompromiso = (tempId: string) => {
    setCompromisos((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  const handleGuardar = async () => {
    if (!formularioAcuerdo.nombre.trim()) {
      mostrarToast('El nombre del acuerdo es requerido.');
      return;
    }
    if (!formularioAcuerdo.responsableId.trim()) {
      mostrarToast('El responsable es requerido.');
      return;
    }
    if (!formularioAcuerdo.fechaInicio) {
      mostrarToast('La fecha de inicio es requerida.');
      return;
    }
    if (!formularioAcuerdo.fechaFin) {
      mostrarToast('La fecha de fin es requerida.');
      return;
    }
    if (compromisos.length === 0) {
      mostrarToast('Debes crear al menos un compromiso para guardar el acuerdo.');
      return;
    }

    setGuardando(true);
    try {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });

      // Crear acuerdo
      const acuerdoPayload = {
        nombre: formularioAcuerdo.nombre,
        marcaId,
        oportunidadOrigenId: oportunidadId,
        responsableId: formularioAcuerdo.responsableId,
        responsableCorreo: formularioAcuerdo.responsableCorreo,
        responsableTelefono: formularioAcuerdo.responsableTelefono,
        valorCOP: formularioAcuerdo.valorCOP,
        fechaInicio: formularioAcuerdo.fechaInicio,
        fechaFin: formularioAcuerdo.fechaFin,
        estado: formularioAcuerdo.estado,
        notasRenovacion: formularioAcuerdo.notasRenovacion,
        interesRenovacion: formularioAcuerdo.interesRenovacion,
        activosIncluidosIds: activosSeleccionados,
      };

      const responseAcuerdo = await fetch('/api/acuerdos', {
        method: 'POST',
        headers,
        body: JSON.stringify(acuerdoPayload),
      });

      if (!responseAcuerdo.ok) {
        const error = await responseAcuerdo.json().catch(() => ({ error: 'Error al crear acuerdo' }));
        throw new Error(error.error || 'No fue posible crear el acuerdo.');
      }

      const acuerdo = await responseAcuerdo.json();

      // Crear compromisos
      for (const compromiso of compromisos) {
        const compromisoPayload = {
          acuerdoId: acuerdo.id,
          entregable: compromiso.entregable,
          categoria: compromiso.categoria,
          responsableId: compromiso.responsableId,
          fechaLimite: compromiso.fechaLimite,
          prioridad: compromiso.prioridad,
          estado: 'Pendiente',
          progreso: 0,
          evidenciasRequeridas: 0,
          observaciones: '',
        };

        const responseCompromiso = await fetch('/api/compromisos', {
          method: 'POST',
          headers,
          body: JSON.stringify(compromisoPayload),
        });

        if (!responseCompromiso.ok) {
          const errorData = await responseCompromiso.json().catch(() => ({ error: 'Error desconocido' }));
          console.error('Error creando compromiso:', errorData);
          mostrarToast(`Error creando compromiso: ${errorData.error}`);
        }
      }

      mostrarToast('Acuerdo y compromisos creados correctamente.');
      await recargarAcuerdos();
      await recargarCompromisos();
      onAcuerdoCreado?.(acuerdo);
      onCerrar();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      mostrarToast(errorMsg);
    } finally {
      setGuardando(false);
    }
  };

  const marca = marcas.find((m) => m.id === marcaId);

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Crear Acuerdo">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setTab('acuerdo')}
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'acuerdo'
                ? 'border-b-2 border-brand-800 text-brand-800'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Acuerdo
          </button>
          <button
            onClick={() => setTab('compromisos')}
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'compromisos'
                ? 'border-b-2 border-brand-800 text-brand-800'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Compromisos ({compromisos.length})
          </button>
        </div>

        {/* Tab: Acuerdo */}
        {tab === 'acuerdo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Marca</label>
              <input
                type="text"
                disabled
                value={marca?.nombre || ''}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Acuerdo *</label>
              <input
                type="text"
                name="nombre"
                value={formularioAcuerdo.nombre}
                onChange={handleCambioAcuerdo}
                placeholder="Nombre del acuerdo"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Responsable *</label>
                <input
                  type="text"
                  name="responsableId"
                  value={formularioAcuerdo.responsableId}
                  onChange={handleCambioAcuerdo}
                  placeholder="Nombre del responsable"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Correo responsable</label>
                <input
                  type="email"
                  name="responsableCorreo"
                  value={formularioAcuerdo.responsableCorreo}
                  onChange={handleCambioAcuerdo}
                  placeholder="correo@example.com"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono responsable</label>
                <input
                  type="tel"
                  name="responsableTelefono"
                  value={formularioAcuerdo.responsableTelefono}
                  onChange={handleCambioAcuerdo}
                  placeholder="+57 1 234 5678"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  name="estado"
                  value={formularioAcuerdo.estado}
                  onChange={handleCambioAcuerdo}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                >
                  <option value="Borrador">Borrador</option>
                  <option value="Activo">Activo</option>
                  <option value="Próximo a vencer">Próximo a vencer</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Valor (COP) *</label>
              <input
                type="text"
                name="valorCOP"
                value={formularioAcuerdo.valorCOP > 0 ? formatCOP(formularioAcuerdo.valorCOP) : ''}
                onChange={handleCambioAcuerdo}
                placeholder="0"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
              />
            </div>

            {activosPropuestosIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activos incluidos en el acuerdo</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {activosPropuestosIds.map((activoId) => {
                    const activo = activos.find((a) => a.id === activoId);
                    if (!activo) return null;
                    const estaSeleccionado = activosSeleccionados.includes(activoId);
                    return (
                      <label key={activoId} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setActivosSeleccionados((prev) => [...prev, activoId]);
                            } else {
                              setActivosSeleccionados((prev) => prev.filter((id) => id !== activoId));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activo.nombre}</p>
                          <p className="text-xs text-gray-500">{formatCOP(Number(activo.valoracionCOP) || 0)}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha Inicio *</label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={formularioAcuerdo.fechaInicio}
                  onChange={handleCambioAcuerdo}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha Fin *</label>
                <input
                  type="date"
                  name="fechaFin"
                  value={formularioAcuerdo.fechaFin}
                  onChange={handleCambioAcuerdo}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Interés de Renovación</label>
              <select
                name="interesRenovacion"
                value={formularioAcuerdo.interesRenovacion}
                onChange={handleCambioAcuerdo}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
              >
                <option value="Sin definir">Sin definir</option>
                <option value="Bajo">Bajo</option>
                <option value="Medio">Medio</option>
                <option value="Alto">Alto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notas de Renovación</label>
              <textarea
                name="notasRenovacion"
                value={formularioAcuerdo.notasRenovacion}
                onChange={handleCambioAcuerdo}
                placeholder="Notas sobre renovación del acuerdo..."
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Tab: Compromisos */}
        {tab === 'compromisos' && (
          <div className="space-y-4">
            {compromisos.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {compromisos.map((compromiso) => (
                  <div key={compromiso.tempId} className="flex items-start justify-between rounded-lg bg-gray-50 p-3 border">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{compromiso.entregable}</p>
                      <p className="text-xs text-gray-500">
                        {compromiso.categoria} • {compromiso.fechaLimite}
                      </p>
                    </div>
                    <button
                      onClick={() => eliminarCompromiso(compromiso.tempId)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium text-gray-900">Agregar Compromiso</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700">Entregable *</label>
                <input
                  type="text"
                  name="entregable"
                  value={nuevoCompromiso.entregable}
                  onChange={handleCambioCompromiso}
                  placeholder="Descripción del entregable"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <select
                    name="categoria"
                    value={nuevoCompromiso.categoria}
                    onChange={handleCambioCompromiso}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                  <select
                    name="prioridad"
                    value={nuevoCompromiso.prioridad}
                    onChange={handleCambioCompromiso}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Responsable</label>
                <input
                  type="text"
                  name="responsableId"
                  value={nuevoCompromiso.responsableId}
                  onChange={handleCambioCompromiso}
                  placeholder="Responsable del compromiso"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha Límite *</label>
                <input
                  type="date"
                  name="fechaLimite"
                  value={nuevoCompromiso.fechaLimite}
                  onChange={handleCambioCompromiso}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                />
              </div>

              <Button
                variante="secundario"
                tamano="sm"
                icono={<Plus size={14} />}
                className="w-full"
                onClick={agregarCompromiso}
              >
                Agregar Compromiso
              </Button>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variante="secundario" tamano="md" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button variante="primario" tamano="md" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Creando...' : 'Crear Acuerdo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
