import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField, SelectField } from '@/components/ui/Field';
import { compromisos, getAcuerdo } from '@/data';
import { TIPOS_EVIDENCIA } from '@/types';
import type { Evidencia, TipoEvidencia } from '@/types';

const COLORES = ['#0a4269', '#16587f', '#256f97', '#12a150', '#a8d400', '#d68a00', '#7c3aed'];

interface EvidenciaFormModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (valores: Omit<Evidencia, 'id' | 'estado'>) => void;
}

export function EvidenciaFormModal({ abierto, onCerrar, onGuardar }: EvidenciaFormModalProps) {
  const [compromisoId, setCompromisoId] = useState(compromisos[0]?.id ?? '');
  const [tipo, setTipo] = useState<TipoEvidencia>('Fotografía');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaEjecucion, setFechaEjecucion] = useState('');
  const [ubicacionCanal, setUbicacionCanal] = useState('');
  const [url, setUrl] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const compromiso = compromisos.find((c) => c.id === compromisoId);
    if (!compromiso) return;

    onGuardar({
      compromisoId,
      acuerdoId: compromiso.acuerdoId,
      tipo,
      titulo,
      descripcion,
      fechaEjecucion,
      ubicacionCanal,
      responsableId: compromiso.responsableId,
      colorPreview: COLORES[Math.floor(Math.random() * COLORES.length)],
      url: url || undefined,
    });
    onCerrar();
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Registrar evidencia"
      descripcion="Documenta el cumplimiento de un compromiso con una nueva evidencia."
      ancho="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Compromiso relacionado"
          value={compromisoId}
          onChange={(e) => setCompromisoId(e.target.value)}
          options={compromisos.map((c) => {
            const acuerdo = getAcuerdo(c.acuerdoId);
            return { value: c.id, label: `${c.entregable} — ${acuerdo?.nombre ?? ''}` };
          })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Tipo de evidencia"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoEvidencia)}
            options={TIPOS_EVIDENCIA.map((t) => ({ value: t, label: t }))}
          />
          <TextField
            label="Fecha de ejecución"
            type="date"
            value={fechaEjecucion}
            onChange={(e) => setFechaEjecucion(e.target.value)}
            required
          />
        </div>
        <TextField label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        <TextAreaField
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Ubicación o canal"
            value={ubicacionCanal}
            onChange={(e) => setUbicacionCanal(e.target.value)}
            placeholder="Ej. Instagram, Cancha principal"
            required
          />
          <TextField
            label="Enlace (opcional)"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variante="primario">
            Registrar evidencia
          </Button>
        </div>
      </form>
    </Modal>
  );
}
