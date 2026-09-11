import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface Breadcrumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  titulo: string;
  descripcion?: string;
  breadcrumbs?: Breadcrumb[];
  accion?: ReactNode;
  /** Etiqueta discreta junto al título, p. ej. "Datos de demostración". */
  etiqueta?: string;
}

export function PageHeader({ titulo, descripcion, breadcrumbs, accion, etiqueta }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight size={12} />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-brand-800 hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-700">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">{titulo}</h2>
          {etiqueta && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {etiqueta}
            </span>
          )}
        </div>
        {descripcion && <p className="mt-1 text-sm text-gray-500">{descripcion}</p>}
      </div>
      {accion && <div className="flex shrink-0 items-center gap-2">{accion}</div>}
    </div>
  );
}
