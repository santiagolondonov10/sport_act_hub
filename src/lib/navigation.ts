import {
  LayoutDashboard,
  Building2,
  UsersRound,
  Package,
  Target,
  FileSignature,
  ListChecks,
  FolderCheck,
  FileBarChart2,
  ShieldCheck,
  Settings2,
  Store,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Visión ejecutiva de la operación comercial y de cumplimiento.',
  },
  {
    to: '/marketplace',
    label: 'Marketplace',
    icon: Store,
    description: 'Oportunidades de inversión en propiedades y eventos deportivos.',
  },
  {
    to: '/marcas',
    label: 'Marcas',
    icon: Building2,
    description: 'Directorio de marcas y patrocinadores potenciales.',
  },
  {
    to: '/audiencias',
    label: 'Audiencias',
    icon: UsersRound,
    description: 'Información agregada sobre audiencias, canales y capacidades de activación.',
  },
  {
    to: '/oportunidades',
    label: 'Oportunidades',
    icon: Target,
    description: 'Pipeline comercial de negociaciones con marcas.',
  },
  {
    to: '/acuerdos',
    label: 'Acuerdos',
    icon: FileSignature,
    description: 'Patrocinios cerrados, vigencia y estado de renovación.',
  },
  {
    to: '/activos',
    label: 'Activos',
    icon: Package,
    description: 'Catálogo de activos comerciales disponibles para patrocinio.',
  },
  {
    to: '/compromisos',
    label: 'Compromisos',
    icon: ListChecks,
    description: 'Gestión operativa de los entregables prometidos a cada patrocinador.',
  },
  {
    to: '/evidencias',
    label: 'Evidencias',
    icon: FolderCheck,
    description: 'Repositorio de pruebas de cumplimiento de cada compromiso.',
  },
  {
    to: '/reportes',
    label: 'Reportes',
    icon: FileBarChart2,
    description: 'Informes ejecutivos de resultados para cada patrocinador.',
  },
  {
    to: '/reportes-admin',
    label: 'Reportes Admin',
    icon: ShieldCheck,
    description: 'Listados administrativos de suscripciones, compañías y usuarios.',
  },
  {
    to: '/parametrizacion',
    label: 'Parametrización',
    icon: Settings2,
    description: 'Configuración de suscripciones y permisos de la plataforma.',
  },
];

export function getNavItemForPath(pathname: string): NavItem {
  const coincidencia = navItems
    .filter((item) => item.to === '/' ? pathname === '/' : pathname.startsWith(item.to))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return coincidencia ?? navItems[0];
}
