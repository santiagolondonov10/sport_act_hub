import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type TipoToast = 'exito' | 'error' | 'info';

interface Toast {
  id: string;
  mensaje: string;
  tipo: TipoToast;
}

interface ToastContextValue {
  mostrarToast: (mensaje: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconos: Record<TipoToast, typeof CheckCircle2> = {
  exito: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

const estilos: Record<TipoToast, string> = {
  exito: 'border-success-500/30 bg-success-50 text-success-700',
  error: 'border-danger-500/30 bg-danger-50 text-danger-700',
  info: 'border-info-500/30 bg-info-50 text-info-700',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrarToast = useCallback((mensaje: string, tipo: TipoToast = 'exito') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const cerrarToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => {
          const Icono = iconos[toast.tipo];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${estilos[toast.tipo]}`}
            >
              <Icono size={16} />
              <span>{toast.mensaje}</span>
              <button
                type="button"
                onClick={() => cerrarToast(toast.id)}
                aria-label="Cerrar notificación"
                className="ml-2 text-current/60 hover:text-current"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de un ToastProvider');
  return context;
}
