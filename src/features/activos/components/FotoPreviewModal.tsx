import { X, Download } from 'lucide-react';

interface FotoPreviewModalProps {
  abierto: boolean;
  onCerrar: () => void;
  activoId: string;
  fotoId: string;
  nombreArchivo: string;
}


export function FotoPreviewModal({ abierto, onCerrar, activoId, fotoId, nombreArchivo }: FotoPreviewModalProps) {
  if (!abierto) return null;

  const fotoUrl = `/api/activos/${activoId}/fotos/${fotoId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Vista previa de foto</h3>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center bg-gray-50 p-8">
          <img
            src={fotoUrl}
            alt={nombreArchivo}
            className="max-h-96 max-w-full rounded-lg object-contain shadow-sm"
          />
          <p className="mt-4 text-sm text-gray-600">{nombreArchivo}</p>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onCerrar}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <a
            href={fotoUrl}
            download={nombreArchivo}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 transition-colors"
          >
            <Download size={16} />
            Descargar
          </a>
        </div>
      </div>
    </div>
  );
}
