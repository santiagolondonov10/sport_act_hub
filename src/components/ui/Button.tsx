import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro';
type Tamano = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  icono?: ReactNode;
  children: ReactNode;
}

const variantes: Record<Variante, string> = {
  primario: 'bg-brand-800 text-white hover:bg-brand-900 focus-visible:outline-brand-800',
  secundario:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:outline-brand-800',
  fantasma: 'text-gray-600 hover:bg-gray-100 focus-visible:outline-brand-800',
  peligro: 'bg-danger-500 text-white hover:bg-danger-700 focus-visible:outline-danger-500',
};

const tamanos: Record<Tamano, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
};

export function Button({
  variante = 'secundario',
  tamano = 'md',
  icono,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variante]} ${tamanos[tamano]} ${className}`}
      {...rest}
    >
      {icono}
      {children}
    </button>
  );
}
