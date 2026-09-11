import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField, SelectField } from '@/components/ui/Field';
import { TIPOS_EVIDENCIA } from '@/types';
import type { Evidencia, TipoEvidencia } from '@/types';
import { useCompromisos } from '@/features/compromisos/store';
import { useAcuerdos } from '@/features/acuerdos/store';

const COLORES = ['#0a4269', '#16587f', '#256f97', '#12a150', '#a8d400', '#d68a00', '#7c3aed'];

interface EvidenciaFormModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (valores: Omit<Evidencia, 'id' | 'estado'>) => void;
  evidenciaInicial?: Evidencia;
}

export function EvidenciaFormModal({ abierto, onCerrar, onGuardar, evidenciaInicial }: EvidenciaFormModalProps) {
  const { compromisos } = useCompromisos();
  const { acuerdos } = useAcuerdos();

  const [compromisoId, setCompromisoId] = useState('');
  const [tipo, setTipo] = useState<TipoEvidencia>('Fotografía');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaEjecucion, setFechaEjecucion] = useState('');
  const [ubicacionCanal, setUbicacionCanal] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [archivosExistentes, setArchivosExistentes] = useState<Array<{ nombre: string; tipo: string; datos: string }>>([]);

  useEffect(() => {
    if (abierto && evidenciaInicial) {
      setCompromisoId(evidenciaInicial.compromisoId);
      setTipo(evidenciaInicial.tipo);
      setTitulo(evidenciaInicial.titulo);
      setDescripcion(evidenciaInicial.descripcion);
      setFechaEjecucion(evidenciaInicial.fechaEjecucion);
      setUbicacionCanal(evidenciaInicial.ubicacionCanal);
      setArchivos([]);
      setArchivosExistentes(evidenciaInicial.archivos || []);
    } else if (abierto) {
      setCompromisoId('');
      setTipo('Fotografía');
      setTitulo('');
      setDescripcion('');
      setFechaEjecucion('');
      setUbicacionCanal('');
      setArchivos([]);
      setArchivosExistentes([]);
    }
  }, [abierto, evidenciaInicial]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const compromiso = compromisos.find((c) => c.id === compromisoId);
    if (!compromiso) {
      alert('Por favor selecciona un compromiso');
      return;
    }

    // Validar archivos
    if (archivos.length > 0) {
      for (const archivo of archivos) {
        if (archivo.size > 20 * 1024 * 1024) {
          alert(`El archivo "${archivo.name}" excede los 20MB`);
          return;
        }
      }
    }

    // Convertir archivos nuevos a base64
    const archivosBase64: Array<{ nombre: string; tipo: string; datos: string }> = [];
    for (const archivo of archivos) {
      const datos = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(archivo);
      });
      archivosBase64.push({
        nombre: archivo.name,
        tipo: archivo.type,
        datos,
      });
    }

    // Combinar archivos existentes con nuevos (solo si estamos editando)
    const todosLosArchivos = esEdicion ? [...archivosExistentes, ...archivosBase64] : archivosBase64;

    onGuardar({
      compromisoId,
      acuerdoId: compromiso.acuerdoId,
      tipo,
      titulo,
      descripcion,
      fechaEjecucion,
      ubicacionCanal,
      responsableId: compromiso.responsableId,
      colorPreview: evidenciaInicial?.colorPreview || COLORES[Math.floor(Math.random() * COLORES.length)],
      archivos: todosLosArchivos,
    });
    onCerrar();
  }

  const esEdicion = Boolean(evidenciaInicial);

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={esEdicion ? 'Editar evidencia' : 'Registrar evidencia'}
      descripcion={esEdicion ? 'Actualiza los datos de la evidencia.' : 'Documenta el cumplimiento de un compromiso con una nueva evidencia.'}
      ancho="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Compromiso relacionado"
          value={compromisoId}
          onChange={(e) => setCompromisoId(e.target.value)}
          disabled={esEdicion}
          options={[
            { value: '', label: 'Selecciona un compromiso' },
            ...compromisos.map((c) => {
              const acuerdo = acuerdos.find((a) => a.id === c.acuerdoId);
              return { value: c.id, label: `${c.entregable} — ${acuerdo?.nombre ?? ''}` };
            }),
          ]}
          required
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
        <TextField
          label="Ubicación o canal"
          value={ubicacionCanal}
          onChange={(e) => setUbicacionCanal(e.target.value)}
          placeholder="Ej. Instagram, Cancha principal"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cargar archivos (máx. 20MB cada uno)</label>
          <input
            type="file"
            multiple
            onChange={(e) => setArchivos((prev) => [...prev, ...Array.from(e.target.files || [])])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          {(archivosExistentes.length > 0 || archivos.length > 0) && (
            <div className="mt-3 space-y-2">
              {archivosExistentes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Archivos existentes ({archivosExistentes.length}):</p>
                  <ul className="space-y-1">
                    {archivosExistentes.map((a, i) => (
                      <li key={`existing-${i}`} className="flex items-center text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                        <span className="truncate">✓ {a.nombre}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {archivos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Nuevo(s) archivo(s) ({archivos.length}):</p>
                  <ul className="space-y-1">
                    {archivos.map((f, i) => (
                      <li key={`new-${i}`} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="truncate">• {f.name} ({(f.size / 1024 / 1024).toFixed(2)}MB)</span>
                        <button
                          type="button"
                          onClick={() => setArchivos((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-2 text-danger-600 hover:text-danger-700 font-medium"
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variante="primario">
            {esEdicion ? 'Guardar cambios' : 'Registrar evidencia'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
