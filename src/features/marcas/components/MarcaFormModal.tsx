import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useMarcas } from '../store';
import { useToast } from '@/hooks/useToast';
import { authHeaders } from '@/lib/auth';
import { Download, Trash2, Eye } from 'lucide-react';

interface MarcaFormModalProps {
  abierto: boolean;
  onCerrar: () => void;
  marcaId?: string | null;
}

interface Sector {
  id: string;
  nombre: string;
}

export function MarcaFormModal({ abierto, onCerrar, marcaId }: MarcaFormModalProps) {
  const { crearMarca, actualizarMarca, getMarcaPorId } = useMarcas();
  const { mostrarToast } = useToast();
  const [guardando, setGuardando] = useState(false);
  const [rutArchivo, setRutArchivo] = useState<File | null>(null);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [formulario, setFormulario] = useState({
    nombre: '',
    tipoIdentificacion: 'NIT',
    identificacion: '',
    rutNombre: '',
    sectorId: '',
    personaContacto1: '',
    telefonoContacto1: '',
    correoContacto1: '',
    cargoContacto1: '',
    personaContacto2: '',
    telefonoContacto2: '',
    correoContacto2: '',
    cargoContacto2: '',
    personaContacto3: '',
    telefonoContacto3: '',
    correoContacto3: '',
    cargoContacto3: '',
  });

  useEffect(() => {
    if (abierto) {
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
    }
  }, [abierto]);

  useEffect(() => {
    if (abierto && marcaId) {
      const marca = getMarcaPorId(marcaId);
      if (marca) {
        setFormulario({
          nombre: marca.nombre,
          tipoIdentificacion: marca.tipoIdentificacion,
          identificacion: marca.identificacion,
          rutNombre: marca.rutNombre || '',
          sectorId: marca.sectorId || '',
          personaContacto1: marca.personaContacto1 || '',
          telefonoContacto1: marca.telefonoContacto1 || '',
          correoContacto1: marca.correoContacto1 || '',
          cargoContacto1: marca.cargoContacto1 || '',
          personaContacto2: marca.personaContacto2 || '',
          telefonoContacto2: marca.telefonoContacto2 || '',
          correoContacto2: marca.correoContacto2 || '',
          cargoContacto2: marca.cargoContacto2 || '',
          personaContacto3: marca.personaContacto3 || '',
          telefonoContacto3: marca.telefonoContacto3 || '',
          correoContacto3: marca.correoContacto3 || '',
          cargoContacto3: marca.cargoContacto3 || '',
        });
        setRutArchivo(null);
      }
    } else if (abierto && !marcaId) {
      setFormulario({
        nombre: '',
        tipoIdentificacion: 'NIT',
        identificacion: '',
        rutNombre: '',
        sectorId: '',
        personaContacto1: '',
        telefonoContacto1: '',
        correoContacto1: '',
        cargoContacto1: '',
        personaContacto2: '',
        telefonoContacto2: '',
        correoContacto2: '',
        cargoContacto2: '',
        personaContacto3: '',
        telefonoContacto3: '',
        correoContacto3: '',
        cargoContacto3: '',
      });
      setRutArchivo(null);
    }
  }, [abierto, marcaId, getMarcaPorId]);

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRutArchivo(file);
    }
  };

  const handleGuardar = async () => {
    if (!formulario.nombre.trim()) {
      mostrarToast('El nombre de la marca es requerido.');
      return;
    }
    if (!formulario.identificacion.trim()) {
      mostrarToast('La identificación es requerida.');
      return;
    }

    setGuardando(true);
    try {
      const datosParaEnviar: any = { ...formulario };
      if (rutArchivo) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Error al leer el archivo'));
          reader.readAsDataURL(rutArchivo);
        });
        datosParaEnviar.rutUrl = base64;
        datosParaEnviar.rutNombre = rutArchivo.name;
      }

      if (marcaId) {
        await actualizarMarca(marcaId, datosParaEnviar);
        mostrarToast('Marca actualizada correctamente.');
      } else {
        await crearMarca(datosParaEnviar);
        mostrarToast('Marca creada correctamente.');
      }
      onCerrar();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al guardar marca:', errorMsg, error);
      mostrarToast(errorMsg || (marcaId ? 'Error al actualizar la marca.' : 'Error al crear la marca.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={marcaId ? 'Editar Marca' : 'Nueva Marca'}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={handleCambio}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
              placeholder="Nombre de la marca"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sector</label>
            <select
              name="sectorId"
              value={formulario.sectorId}
              onChange={handleCambio}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
            >
              <option value="">Seleccionar sector...</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Identificación *</label>
            <select
              name="tipoIdentificacion"
              value={formulario.tipoIdentificacion}
              onChange={handleCambio}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
            >
              <option>NIT</option>
              <option>Cédula</option>
              <option>Pasaporte</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Identificación *</label>
            <input
              type="text"
              name="identificacion"
              value={formulario.identificacion}
              onChange={handleCambio}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
              placeholder="Número de identificación"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">RUT (PDF)</label>
            <div className="mt-1 flex gap-2">
              <input
                type="file"
                accept=".pdf"
                onChange={handleRutChange}
                className="block flex-1 text-sm text-gray-500 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
              />
              {formulario.rutNombre && !rutArchivo && marcaId && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const headers = new Headers();
                      const auth = authHeaders();
                      Object.entries(auth).forEach(([key, value]) => {
                        if (value) headers.set(key, value);
                      });
                      const response = await fetch(`/api/marcas/${marcaId}/rut`, { headers });
                      if (!response.ok) {
                        mostrarToast('Error al descargar el archivo');
                        return;
                      }
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = formulario.rutNombre || 'rut.pdf';
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (error) {
                      mostrarToast('Error al descargar el archivo');
                    }
                  }}
                  className="rounded-lg bg-brand-100 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-200"
                  title="Descargar RUT"
                >
                  <Download size={14} />
                </button>
              )}
              {formulario.rutNombre && rutArchivo && (
                <button
                  type="button"
                  onClick={() => {
                    setRutArchivo(null);
                    setFormulario((prev) => ({ ...prev, rutNombre: '' }));
                  }}
                  className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                  title="Eliminar archivo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {rutArchivo && <p className="mt-1 text-xs text-green-600">✓ Nuevo archivo: {rutArchivo.name}</p>}
            {formulario.rutNombre && !rutArchivo && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-600">✓ Archivo: {formulario.rutNombre}</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const headers = new Headers();
                      const auth = authHeaders();
                      Object.entries(auth).forEach(([key, value]) => {
                        if (value) headers.set(key, value);
                      });
                      const response = await fetch(`/api/marcas/${marcaId}/rut`, { headers });
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
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Contacto 1</h4>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                name="personaContacto1"
                value={formulario.personaContacto1}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cargo</label>
              <input
                type="text"
                name="cargoContacto1"
                value={formulario.cargoContacto1}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Cargo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                name="telefonoContacto1"
                value={formulario.telefonoContacto1}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Teléfono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                name="correoContacto1"
                value={formulario.correoContacto1}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Correo"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Contacto 2</h4>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                name="personaContacto2"
                value={formulario.personaContacto2}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cargo</label>
              <input
                type="text"
                name="cargoContacto2"
                value={formulario.cargoContacto2}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Cargo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                name="telefonoContacto2"
                value={formulario.telefonoContacto2}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Teléfono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                name="correoContacto2"
                value={formulario.correoContacto2}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Correo"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Contacto 3</h4>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                name="personaContacto3"
                value={formulario.personaContacto3}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cargo</label>
              <input
                type="text"
                name="cargoContacto3"
                value={formulario.cargoContacto3}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Cargo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                name="telefonoContacto3"
                value={formulario.telefonoContacto3}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Teléfono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                name="correoContacto3"
                value={formulario.correoContacto3}
                onChange={handleCambio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
                placeholder="Correo"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-200 pt-4">
          <button
            onClick={onCerrar}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={guardando}
          >
            Cancelar
          </button>
          <Button
            variante="primario"
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1"
          >
            {guardando ? 'Guardando...' : marcaId ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
