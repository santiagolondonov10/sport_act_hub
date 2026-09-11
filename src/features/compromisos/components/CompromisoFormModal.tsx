import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField, SelectField } from '@/components/ui/Field';
import { ESTADOS_COMPROMISO } from '@/types';
import type { Compromiso, CategoriaCompromiso } from '@/types';

const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente'] as const;
const CATEGORIAS: CategoriaCompromiso[] = [
  'Activación',
  'Contenido digital',
  'Hospitality',
  'Señalización',
  'Reportería',
  'Evento',
];

interface CompromisoFormModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (valores: Omit<Compromiso, 'id' | 'compania_id'> & { marcaId: string }) => void;
  acuerdoId: string;
  marcaId: string;
  compromisoInicial?: Compromiso;
}

export function CompromisoFormModal({ abierto, onCerrar, onGuardar, acuerdoId, marcaId, compromisoInicial }: CompromisoFormModalProps) {
  const esEdicion = Boolean(compromisoInicial);

  const [entregable, setEntregable] = useState(compromisoInicial?.entregable ?? '');
  const [categoria, setCategoria] = useState<CategoriaCompromiso>(compromisoInicial?.categoria ?? 'Activación');
  const [responsableId, setResponsableId] = useState(compromisoInicial?.responsableId ?? '');
  const [fechaLimite, setFechaLimite] = useState(compromisoInicial?.fechaLimite ?? '');
  const [prioridad, setPrioridad] = useState(compromisoInicial?.prioridad ?? 'Media');
  const [estado, setEstado] = useState(compromisoInicial?.estado ?? 'Pendiente');
  const [progreso, setProgreso] = useState(compromisoInicial?.progreso ?? 0);
  const [evidenciasRequeridas, setEvidenciasRequeridas] = useState<number | string>(compromisoInicial?.evidenciasRequeridas ?? '');
  const [observaciones, setObservaciones] = useState(compromisoInicial?.observaciones ?? '');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (abierto) {
      setEntregable(compromisoInicial?.entregable ?? '');
      setCategoria(compromisoInicial?.categoria ?? 'Activación');
      setResponsableId(compromisoInicial?.responsableId ?? '');
      setFechaLimite(compromisoInicial?.fechaLimite ?? '');
      setPrioridad(compromisoInicial?.prioridad ?? 'Media');
      setEstado(compromisoInicial?.estado ?? 'Pendiente');
      setProgreso(compromisoInicial?.progreso ?? 0);
      setEvidenciasRequeridas(compromisoInicial?.evidenciasRequeridas ?? '');
      setObservaciones(compromisoInicial?.observaciones ?? '');
    }
  }, [abierto, compromisoInicial]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!entregable || !entregable.trim()) {
      alert('Por favor describe el entregable');
      return;
    }
    if (!categoria) {
      alert('Por favor selecciona una categoría');
      return;
    }
    if (!responsableId || !responsableId.trim()) {
      alert('Por favor selecciona un responsable');
      return;
    }
    if (!fechaLimite) {
      alert('Por favor selecciona una fecha límite');
      return;
    }

    onGuardar({
      acuerdoId,
      marcaId,
      entregable,
      categoria,
      responsableId,
      fechaLimite,
      prioridad,
      estado,
      progreso: Number(progreso) || 0,
      evidenciasRequeridas: evidenciasRequeridas === '' ? 0 : Number(evidenciasRequeridas),
      observaciones,
      segmentoAudienciaId: null,
      canalAudienciaId: null,
      activoRelacionadoId: null,
      indicadorComprometido: null,
      metaIndicador: null,
      periodoIndicador: null,
    });
    onCerrar();
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={esEdicion ? 'Editar compromiso' : 'Nuevo compromiso'}
      descripcion="Registra las tareas y entregas pactadas con el patrocinador."
      ancho="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Entregable"
            value={entregable}
            onChange={(e) => setEntregable(e.target.value)}
            placeholder="Ej: Publicaciones en redes sociales"
            required
          />
          <SelectField
            label="Categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaCompromiso)}
            options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            label="Responsable"
            value={responsableId}
            onChange={(e) => setResponsableId(e.target.value)}
            placeholder="Nombre del responsable"
            required
          />
          <TextField
            label="Fecha límite"
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            required
          />
          <SelectField
            label="Prioridad"
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            options={PRIORIDADES.map((p) => ({ value: p, label: p }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SelectField
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value as typeof estado)}
            options={ESTADOS_COMPROMISO.map((e) => ({ value: e, label: e }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Progreso (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={progreso}
              onChange={(e) => setProgreso(Number(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Evidencias requeridas</label>
            <input
              type="number"
              min="0"
              value={evidenciasRequeridas}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setEvidenciasRequeridas('');
                } else {
                  const num = Number(val);
                  if (num >= 0) {
                    setEvidenciasRequeridas(num);
                  }
                }
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
        </div>

        <TextAreaField
          label="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variante="primario">
            {esEdicion ? 'Guardar cambios' : 'Crear compromiso'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
