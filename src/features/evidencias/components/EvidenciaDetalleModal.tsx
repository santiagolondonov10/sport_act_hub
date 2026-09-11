import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Download, Edit2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatFechaLarga } from '@/lib/format';
import { useAcuerdos } from '@/features/acuerdos/store';
import { useMarcas } from '@/features/marcas/store';
import { useCompromisos } from '@/features/compromisos/store';
import type { Evidencia, EstadoEvidencia } from '@/types';

interface EvidenciaDetalleModalProps {
  evidencia: Evidencia | null;
  onCerrar: () => void;
  onCambiarEstado: (id: string, estado: EstadoEvidencia) => void;
  onEditar?: (evidencia: Evidencia) => void;
}

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function EvidenciaDetalleModal({ evidencia, onCerrar, onCambiarEstado, onEditar }: EvidenciaDetalleModalProps) {
  const [imagenAmpliada, setImagenAmpliada] = useState<{ nombre: string; tipo: string; datos: string } | null>(null);

  if (!evidencia) return null;

  const { acuerdos } = useAcuerdos();
  const { marcas } = useMarcas();
  const { compromisos } = useCompromisos();

  const compromiso = compromisos.find((c) => c.id === evidencia.compromisoId);
  const acuerdo = acuerdos.find((a) => a.id === evidencia.acuerdoId);
  const marca = acuerdo ? marcas.find((m) => m.id === acuerdo.marcaId) : undefined;
  const primeraImagen = evidencia.archivos?.find((a) => TIPOS_IMAGEN.includes(a.tipo));
  const puedeEditar = evidencia.estado === 'En revisión';

  return (
    <>
      <Modal abierto={Boolean(evidencia) && !imagenAmpliada} onCerrar={onCerrar} titulo={evidencia.titulo} descripcion={`${evidencia.tipo} · ${marca?.nombre}`}>
        <div className="space-y-4">
          <div
            className="h-48 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: `${evidencia.colorPreview}1a` }}
            onClick={() => primeraImagen && setImagenAmpliada(primeraImagen)}
          >
            {primeraImagen ? (
              <img
                src={`data:${primeraImagen.tipo};base64,${primeraImagen.datos}`}
                alt={primeraImagen.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium" style={{ color: evidencia.colorPreview }}>
                Sin vista previa de imagen
              </div>
            )}
          </div>

        <Badge estado={evidencia.estado} />

        <p className="text-sm text-gray-700">{evidencia.descripcion}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Fecha de ejecución</p>
            <p className="font-medium text-gray-900">{formatFechaLarga(evidencia.fechaEjecucion)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Ubicación / canal</p>
            <p className="font-medium text-gray-900">{evidencia.ubicacionCanal}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Responsable</p>
            <p className="font-medium text-gray-900">{evidencia.responsableId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Acuerdo</p>
            {acuerdo ? (
              <Link to={`/acuerdos/${acuerdo.id}`} className="font-medium text-brand-800 hover:underline">
                {acuerdo.nombre}
              </Link>
            ) : (
              <p className="font-medium text-gray-900">-</p>
            )}
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Compromiso</p>
            <p className="font-medium text-gray-900">{compromiso?.entregable || '-'}</p>
          </div>
        </div>

        {evidencia.archivos && evidencia.archivos.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Archivos adjuntos ({evidencia.archivos.length})</p>
            <ul className="space-y-2">
              {evidencia.archivos.map((archivo, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-xs bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <span className="truncate text-gray-700">{archivo.nombre}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `data:${archivo.tipo};base64,${archivo.datos}`;
                      link.download = archivo.nombre;
                      link.click();
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    title="Descargar"
                  >
                    <Download size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {puedeEditar && onEditar && (
          <Button
            variante="secundario"
            icono={<Edit2 size={15} />}
            onClick={() => {
              onEditar(evidencia);
              onCerrar();
            }}
            className="w-full"
          >
            Editar evidencia
          </Button>
        )}

        {!puedeEditar && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800">
              Esta evidencia ya no puede ser editada. Crea una nueva si necesitas hacer cambios.
            </p>
          </div>
        )}

        {evidencia.estado === 'En revisión' && (
          <div className="flex gap-2 border-t border-gray-100 pt-4">
            <Button
              variante="primario"
              icono={<Check size={15} />}
              onClick={() => onCambiarEstado(evidencia.id, 'Aprobada')}
              className="flex-1"
            >
              Aprobar
            </Button>
            <Button
              variante="peligro"
              icono={<X size={15} />}
              onClick={() => onCambiarEstado(evidencia.id, 'Rechazada')}
              className="flex-1"
            >
              Rechazar
            </Button>
          </div>
        )}
      </div>
    </Modal>

      {imagenAmpliada && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setImagenAmpliada(null)}
        >
          <div className="max-w-4xl max-h-screen flex flex-col gap-4">
            <img
              src={`data:${imagenAmpliada.tipo};base64,${imagenAmpliada.datos}`}
              alt={imagenAmpliada.nombre}
              className="max-h-[80vh] w-auto mx-auto object-contain"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-white">{imagenAmpliada.nombre}</p>
              <Button
                variante="secundario"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `data:${imagenAmpliada.tipo};base64,${imagenAmpliada.datos}`;
                  link.download = imagenAmpliada.nombre;
                  link.click();
                }}
                className="text-white"
              >
                Descargar
              </Button>
            </div>
            <button
              onClick={() => setImagenAmpliada(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
