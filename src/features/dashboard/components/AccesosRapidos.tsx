import { Link } from 'react-router-dom';
import { Package, Target, FolderCheck, FileBarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Acceso {
  to: string;
  label: string;
  descripcion: string;
  icon: LucideIcon;
}

const accesos: Acceso[] = [
  { to: '/activos', label: 'Gestionar activos', descripcion: 'Ver disponibilidad e inventario', icon: Package },
  { to: '/oportunidades', label: 'Ver pipeline', descripcion: 'Seguimiento de negociaciones', icon: Target },
  { to: '/evidencias', label: 'Registrar evidencia', descripcion: 'Subir prueba de cumplimiento', icon: FolderCheck },
  { to: '/reportes', label: 'Ver reportes', descripcion: 'Resultados por patrocinador', icon: FileBarChart2 },
];

export function AccesosRapidos() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {accesos.map((acceso) => (
        <Link
          key={acceso.to}
          to={acceso.to}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-800/30 hover:bg-brand-800/5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-800/10 text-brand-800">
            <acceso.icon size={18} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-gray-900">{acceso.label}</span>
            <span className="block truncate text-xs text-gray-500">{acceso.descripcion}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
