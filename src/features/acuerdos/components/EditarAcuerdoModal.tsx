import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Acuerdo } from '@/types/acuerdo';
import { useToast } from '@/hooks/useToast';
import { useMarcas } from '@/features/marcas/store';
import { useAcuerdos } from '../store';
import { formatCOP } from '@/lib/format';

interface EditarAcuerdoModalProps {
  abierto: boolean;
  onCerrar: () => void;
  acuerdo: Acuerdo;
  onAcuerdoActualizado?: (acuerdo: Acuerdo) => void;
}

export function EditarAcuerdoModal({ abierto, onCerrar, acuerdo, onAcuerdoActualizado }: EditarAcuerdoModalProps) {
  const { mostrarToast } = useToast();
  const { marcas } = useMarcas();
  const { actualizarAcuerdo } = useAcuerdos();
  const [guardando, setGuardando] = useState(false);
  const [activosSeleccionados, setActivosSeleccionados] = useState<string[]>(acuerdo.activosIncluidosIds || []);

  const [formularioAcuerdo, setFormularioAcuerdo] = useState({
    nombre: acuerdo.nombre,
    responsableId: acuerdo.responsableId,
    responsableCorreo: '',
    responsableTelefono: '',
    valorCOP: acuerdo.valorCOP,
    fechaInicio: acuerdo.fechaInicio,
    fechaFin: acuerdo.fechaFin,
    estado: acuerdo.estado,
    notasRenovacion: acuerdo.notasRenovacion,
    interesRenovacion: acuerdo.interesRenovacion,
  });

  useEffect(() => {
    if (abierto) {
      setActivosSeleccionados(acuerdo.activosIncluidosIds || []);
      setFormularioAcuerdo({
        nombre: acuerdo.nombre,
        responsableId: acuerdo.responsableId,
        responsableCorreo: '',
        responsableTelefono: '',
        valorCOP: acuerdo.valorCOP,
        fechaInicio: acuerdo.fechaInicio,
        fechaFin: acuerdo.fechaFin,
        estado: acuerdo.estado,
        notasRenovacion: acuerdo.notasRenovacion,
        interesRenovacion: acuerdo.interesRenovacion,
      });
    }
  }, [abierto, acuerdo]);

  const handleCambioAcuerdo = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'valorCOP') {
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

    setGuardando(true);
    try {
      const acuerdoActualizado = {
        nombre: formularioAcuerdo.nombre,
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

      await actualizarAcuerdo(acuerdo.id, acuerdoActualizado);
      mostrarToast('Acuerdo actualizado correctamente.');
      onAcuerdoActualizado?.({ ...acuerdo, ...acuerdoActualizado });
      onCerrar();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      mostrarToast(errorMsg);
    } finally {
      setGuardando(false);
    }
  };

  const marca = marcas.find((m) => m.id === acuerdo.marcaId);

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Editar Acuerdo" ancho="lg">
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

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variante="secundario" tamano="md" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button variante="primario" tamano="md" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
