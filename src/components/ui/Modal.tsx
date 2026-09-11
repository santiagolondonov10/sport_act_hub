import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  ancho?: 'md' | 'lg' | 'xl';
}

const anchos = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ abierto, onCerrar, titulo, descripcion, children, ancho = 'lg' }: ModalProps) {
  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onCerrar} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className={`relative z-10 max-h-[90vh] w-full ${anchos[ancho]} overflow-y-auto rounded-xl bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 id="modal-titulo" className="text-base font-semibold text-gray-900">
              {titulo}
            </h2>
            {descripcion && <p className="mt-0.5 text-sm text-gray-500">{descripcion}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
