import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField, SelectField } from '@/components/ui/Field';
import { Download, Trash2 } from 'lucide-react';
import { segmentosAudiencia } from '@/data';
import { authHeaders } from '@/lib/auth';
import {
  CAPACIDADES_SEGMENTACION,
  ESTADOS_ACTIVO,
  INDICADORES_AUDIENCIA,
  TIPOS_AUDIENCIA,
} from '@/types';
import type { Activo, CapacidadSegmentacion, TipoAudiencia } from '@/types';

interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface ActivoFormModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (valores: Omit<Activo, 'id' | 'acuerdosAsociadosIds'>, archivo?: File) => void;
  activoInicial?: Activo;
}

const COLORES_DISPONIBLES = ['#0a4269', '#16587f', '#256f97', '#12a150', '#a8d400', '#d68a00', '#be123c', '#7c3aed'];


function formatearNumero(valor: string): string {
  const num = valor.replace(/\D/g, '');
  return num ? num.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
}

function extraerNumero(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function ActivoFormModal({ abierto, onCerrar, onGuardar, activoInicial }: ActivoFormModalProps) {
  const esEdicion = Boolean(activoInicial);

  const [nombre, setNombre] = useState(activoInicial?.nombre ?? '');
  const [categoriaId, setCategoriaId] = useState(activoInicial?.categoriaId ?? '');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [canal, setCanal] = useState(activoInicial?.canal ?? '');
  const [descripcion, setDescripcion] = useState(activoInicial?.descripcion ?? '');
  const [valoracionCOP, setValoracionCOP] = useState(String(activoInicial?.valoracionCOP ?? ''));
  const [inventarioTotal, setInventarioTotal] = useState(String(activoInicial?.inventarioTotal ?? '1'));
  const [inventarioDisponible, setInventarioDisponible] = useState(
    String(activoInicial?.inventarioDisponible ?? '1'),
  );
  const [alcanceEstimado, setAlcanceEstimado] = useState(activoInicial?.alcanceEstimado ?? '');
  const [estado, setEstado] = useState(activoInicial?.estado ?? ESTADOS_ACTIVO[0]);
  const [derechos, setDerechos] = useState((activoInicial?.derechosIncluidos ?? []).join(', '));

  const [incluyeAudiencia, setIncluyeAudiencia] = useState(Boolean(activoInicial?.audiencia));
  const [segmentosRelacionadosIds, setSegmentosRelacionadosIds] = useState<string[]>(
    activoInicial?.audiencia?.segmentosRelacionadosIds ?? [],
  );
  const [canalActivacion, setCanalActivacion] = useState(activoInicial?.audiencia?.canalActivacion ?? '');
  const [tipoAudiencia, setTipoAudiencia] = useState<TipoAudiencia>(activoInicial?.audiencia?.tipoAudiencia ?? 'Propia');
  const [alcanceEstimadoAudiencia, setAlcanceEstimadoAudiencia] = useState(
    String(activoInicial?.audiencia?.alcanceEstimado ?? ''),
  );
  const [capacidadSegmentacion, setCapacidadSegmentacion] = useState<CapacidadSegmentacion>(
    activoInicial?.audiencia?.capacidadSegmentacion ?? 'Media',
  );
  const [indicadoresDisponibles, setIndicadoresDisponibles] = useState<string[]>(
    activoInicial?.audiencia?.indicadoresDisponibles ?? [],
  );
  const [frecuenciaMaxima, setFrecuenciaMaxima] = useState(activoInicial?.audiencia?.frecuenciaMaxima ?? '');
  const [restricciones, setRestricciones] = useState(activoInicial?.audiencia?.restricciones ?? '');
  const [requiereGO, setRequiereGO] = useState(activoInicial?.audiencia?.requiereGO ?? false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string>('');
  const [documentos, setDocumentos] = useState<{ nombre: string; base64: string }[]>([]);
  const [documentoCargado, setDocumentoCargado] = useState<File | null>(null);

  useEffect(() => {
    if (abierto) {
      const cargarCategorias = async () => {
        try {
          const headers = new Headers();
          const auth = authHeaders();
          Object.entries(auth).forEach(([key, value]) => {
            if (value) headers.set(key, value);
          });
          const response = await fetch(`/api/activo-categorias`, { headers });
          if (response.ok) {
            const data = await response.json();
            setCategorias(data);
            if (!categoriaId && data.length > 0) {
              setCategoriaId(data[0].id);
            }
          }
        } catch (error) {
          console.error('Error loading categorías:', error);
        }
      };
      cargarCategorias();

      // Cargar documentos existentes si estamos editando
      if (esEdicion && activoInicial?.documentosAdjuntos) {
        setDocumentos(activoInicial.documentosAdjuntos);
      }
    }
  }, [abierto, categoriaId, esEdicion, activoInicial]);

  function alternarSegmento(id: string) {
    setSegmentosRelacionadosIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function alternarIndicador(indicador: string) {
    setIndicadoresDisponibles((prev) =>
      prev.includes(indicador) ? prev.filter((i) => i !== indicador) : [...prev, indicador],
    );
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La foto no debe superar 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      setFotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewFoto(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleDocumentoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('El documento no debe superar 10MB');
        return;
      }
      setDocumentoCargado(file);
    }
  }

  async function agregarDocumento() {
    if (!documentoCargado) {
      alert('Selecciona un documento');
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(documentoCargado);
      });

      setDocumentos((prev) => [...prev, { nombre: documentoCargado.name, base64 }]);
      setDocumentoCargado(null);
    } catch (error) {
      alert('Error al cargar el documento');
    }
  }

  function eliminarDocumento(index: number) {
    setDocumentos((prev) => prev.filter((_, i) => i !== index));
  }

  function descargarDocumento(doc: { nombre: string; base64: string }) {
    const link = document.createElement('a');
    link.href = doc.base64;
    link.download = doc.nombre;
    link.click();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const datosParaEnviar: any = {
      nombre,
      categoriaId,
      canal,
      descripcion,
      valoracionCOP: Number(valoracionCOP) || 0,
      inventarioTotal: Number(inventarioTotal) || 1,
      inventarioDisponible: Number(inventarioDisponible) || 0,
      alcanceEstimado,
      estado,
      derechosIncluidos: derechos
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
      imagenColor: activoInicial?.imagenColor ?? COLORES_DISPONIBLES[Math.floor(Math.random() * COLORES_DISPONIBLES.length)],
      audiencia: incluyeAudiencia
        ? {
            segmentosRelacionadosIds,
            canalActivacion,
            tipoAudiencia,
            alcanceEstimado: Number(alcanceEstimadoAudiencia) || 0,
            capacidadSegmentacion,
            indicadoresDisponibles,
            frecuenciaMaxima,
            restricciones,
            requiereGO,
            actualizadoEn: activoInicial?.audiencia?.actualizadoEn ?? new Date().toISOString().slice(0, 10),
          }
        : undefined,
    };

    // Handle photo if present
    if (fotoFile) {
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(fotoFile);
        });
        datosParaEnviar.fotoBase64 = base64;
        datosParaEnviar.fotoNombre = fotoFile.name;
      } catch (error) {
        console.error('Error reading photo:', error);
      }
    }

    // Always include documents (existing + new)
    datosParaEnviar.documentosAdjuntos = documentos;

    onGuardar(datosParaEnviar);
    onCerrar();
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={esEdicion ? 'Editar activo' : 'Nuevo activo'}
      descripcion={esEdicion ? 'Actualiza la información comercial del activo.' : 'Agrega un nuevo activo al catálogo comercial.'}
      ancho="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Nombre del activo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Categoría"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
            required
          />
          <TextField label="Canal o ubicación" value={canal} onChange={(e) => setCanal(e.target.value)} required />
        </div>
        <TextAreaField
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          required
        />

        <div className="rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto del activo</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-brand-50 file:text-brand-800
                  hover:file:bg-brand-100"
              />
              <p className="mt-1 text-xs text-gray-500">Máximo 5MB. Formatos: JPG, PNG, WebP</p>
            </div>
            {previewFoto && (
              <div className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                <img src={previewFoto} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Documentos adjuntos</label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="file"
                onChange={handleDocumentoChange}
                className="block flex-1 text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-brand-50 file:text-brand-800
                  hover:file:bg-brand-100"
              />
              <Button
                type="button"
                variante="secundario"
                tamano="sm"
                onClick={agregarDocumento}
                disabled={!documentoCargado}
              >
                Agregar
              </Button>
            </div>
            <p className="text-xs text-gray-500">Máximo 10MB por archivo (PDF, DOC, XLS, etc.)</p>

            {documentos.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded p-2 bg-gray-50">
                {documentos.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm text-gray-700 truncate flex-1">{doc.nombre}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => descargarDocumento(doc)}
                        className="p-1 text-blue-600 hover:text-blue-700"
                        title="Descargar"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarDocumento(index)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            label="Valoración (COP)"
            type="text"
            placeholder="0"
            value={formatearNumero(valoracionCOP)}
            onChange={(e) => setValoracionCOP(extraerNumero(e.target.value))}
            required
          />
          <TextField
            label="Inventario total"
            type="number"
            min={1}
            value={inventarioTotal}
            onChange={(e) => setInventarioTotal(e.target.value)}
            required
          />
          <TextField
            label="Inventario disponible"
            type="number"
            min={0}
            value={inventarioDisponible}
            onChange={(e) => setInventarioDisponible(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Alcance estimado"
            type="text"
            placeholder="Ej. 2500000"
            value={formatearNumero(alcanceEstimado)}
            onChange={(e) => setAlcanceEstimado(extraerNumero(e.target.value))}
            required
          />
          <SelectField
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value as typeof estado)}
            options={ESTADOS_ACTIVO.map((e) => ({ value: e, label: e }))}
          />
        </div>
        <TextField
          label="Derechos incluidos"
          value={derechos}
          onChange={(e) => setDerechos(e.target.value)}
          placeholder="Separados por coma. Ej. Exclusividad de categoría, Uso de imagen"
          hint="Se mostrarán como una lista en la vista de detalle."
        />

        <div className="rounded-lg border border-gray-200 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={incluyeAudiencia}
              onChange={(e) => setIncluyeAudiencia(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
            />
            Audiencia y capacidad de activación
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Información agregada proveniente de Sports Act GO. No incluye datos personales de aficionados.
          </p>

          {incluyeAudiencia && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700">Segmentos relacionados</p>
                <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-gray-200 p-2 sm:grid-cols-2">
                  {segmentosAudiencia.map((segmento) => (
                    <label key={segmento.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={segmentosRelacionadosIds.includes(segmento.id)}
                        onChange={() => alternarSegmento(segmento.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                      />
                      {segmento.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Canal de activación"
                  value={canalActivacion}
                  onChange={(e) => setCanalActivacion(e.target.value)}
                  placeholder="Ej. Email y landing pages"
                />
                <SelectField
                  label="Tipo de audiencia"
                  value={tipoAudiencia}
                  onChange={(e) => setTipoAudiencia(e.target.value as TipoAudiencia)}
                  options={TIPOS_AUDIENCIA.map((t) => ({ value: t, label: t }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Alcance estimado"
                  type="number"
                  min={0}
                  value={alcanceEstimadoAudiencia}
                  onChange={(e) => setAlcanceEstimadoAudiencia(e.target.value)}
                />
                <SelectField
                  label="Capacidad de segmentación"
                  value={capacidadSegmentacion}
                  onChange={(e) => setCapacidadSegmentacion(e.target.value as CapacidadSegmentacion)}
                  options={CAPACIDADES_SEGMENTACION.map((c) => ({ value: c, label: c }))}
                />
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700">Indicadores disponibles</p>
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 p-2">
                  {INDICADORES_AUDIENCIA.map((indicador) => {
                    const activo = indicadoresDisponibles.includes(indicador);
                    return (
                      <button
                        type="button"
                        key={indicador}
                        onClick={() => alternarIndicador(indicador)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          activo ? 'bg-brand-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {indicador}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Frecuencia máxima"
                  value={frecuenciaMaxima}
                  onChange={(e) => setFrecuenciaMaxima(e.target.value)}
                  placeholder="Ej. Hasta 4 activaciones por temporada"
                />
                <SelectField
                  label="Requiere Sports Act GO"
                  value={requiereGO ? 'si' : 'no'}
                  onChange={(e) => setRequiereGO(e.target.value === 'si')}
                  options={[
                    { value: 'si', label: 'Sí' },
                    { value: 'no', label: 'No' },
                  ]}
                />
              </div>

              <TextAreaField
                label="Restricciones"
                value={restricciones}
                onChange={(e) => setRestricciones(e.target.value)}
                rows={2}
                placeholder="Ej. Requiere aprobación previa de la pieza gráfica"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variante="primario">
            {esEdicion ? 'Guardar cambios' : 'Crear activo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
