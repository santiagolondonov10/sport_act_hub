import { Link, Navigate } from 'react-router-dom';
import { Building2, ChevronRight, Settings2, Tags, UserCog, Package } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { getSessionUser } from '@/lib/auth';

const configurationTiles = [
  { to: '/parametrizacion/suscripciones', title: 'Suscripciones', description: 'Configura los planes, precios, limites y caracteristicas disponibles.', icon: Settings2, tone: 'bg-accent-100 text-brand-800' },
  { to: '/parametrizacion/companias', title: 'Companias', description: 'Administra companias patrocinadoras y sus contactos comerciales.', icon: Building2, tone: 'bg-info-50 text-info-700' },
  { to: '/parametrizacion/sectores', title: 'Sectores', description: 'Configura el catalogo de sectores para clasificar companias.', icon: Tags, tone: 'bg-warning-50 text-warning-700' },
  { to: '/parametrizacion/categorias-activos', title: 'Categorías de Activos', description: 'Define los tipos de activos comerciales disponibles para patrocinio.', icon: Package, tone: 'bg-success-50 text-success-700' },
  { to: '/parametrizacion/usuarios', title: 'Gestión de usuarios', description: 'Crea usuarios y administra su suscripción y compañía asignada.', icon: UserCog, tone: 'bg-brand-100 text-brand-800' },
];

export function ParametrizacionPage() {
  if (getSessionUser()?.subscriptionType !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <PageHeader titulo="Parametrizacion" descripcion="Selecciona una configuracion para administrar sus valores." etiqueta="Administracion" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {configurationTiles.map(({ to, title, description, icon: Icon, tone }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full p-5 transition-colors hover:border-brand-500 hover:bg-brand-800/[0.02]">
              <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon size={21} aria-hidden="true" /></div>
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-base font-semibold text-gray-900">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-500">{description}</p></div>
                <ChevronRight size={18} className="mt-0.5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-700" aria-hidden="true" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
