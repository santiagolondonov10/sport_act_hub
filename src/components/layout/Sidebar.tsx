import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { X, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { navItems } from '@/lib/navigation';
import { getSessionUser, authHeaders } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';
import { useSidebar } from '@/lib/SidebarContext';
import logoSportsAct from '@/assets/logo-sports-act.png';

interface SidebarProps {
  abiertoEnMovil: boolean;
  onCerrar: () => void;
}

interface Compania {
  id: string;
  nombre: string;
  logo_url?: string | null;
}


export function Sidebar({ abiertoEnMovil, onCerrar }: SidebarProps) {
  const sessionUser = getSessionUser();
  const { t } = useLanguage();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [compania, setCompania] = useState<Compania | null>(null);

  useEffect(() => {
    if (sessionUser?.companiaId) {
      const headers = new Headers();
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      fetch(`/api/admin/companias/${sessionUser.companiaId}`, { headers })
        .then((res) => res.json())
        .then((data: Compania) => setCompania(data))
        .catch(() => setCompania(null));
    }
  }, [sessionUser?.companiaId]);
  const pathToMenuOption: Record<string, { path: string; order: number }> = {};
  sessionUser?.menuOptions?.forEach((option) => {
    pathToMenuOption[option.path] = { path: option.path, order: option.sortOrder ?? 0 };
  });

  const visibleNavItems = sessionUser?.menuOptions?.length
    ? navItems
        .filter((item) => sessionUser.menuOptions.some((mo) => mo.path === item.to))
        .sort((a, b) => {
          const orderA = pathToMenuOption[a.to]?.order ?? 999;
          const orderB = pathToMenuOption[b.to]?.order ?? 999;
          return orderA - orderB;
        })
    : navItems;

  const getNavLabel = (to: string): string => {
    const labelKeys: Record<string, string> = {
      '/': 'sidebar.dashboard',
      '/marcas': 'sidebar.marcas',
      '/audiencias': 'sidebar.audiencias',
      '/activos': 'sidebar.activos',
      '/oportunidades': 'sidebar.oportunidades',
      '/marketplace': 'sidebar.marketplace',
      '/acuerdos': 'sidebar.acuerdos',
      '/compromisos': 'sidebar.compromisos',
      '/evidencias': 'sidebar.evidencias',
      '/reportes': 'sidebar.reportes',
      '/reportes-admin': 'sidebar.reportesAdmin',
      '/parametrizacion': 'sidebar.parametrizacion',
    };
    return t(labelKeys[to] ?? 'sidebar.dashboard');
  };

  return (
    <>
      {abiertoEnMovil && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={onCerrar}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col bg-brand-800 transition-all duration-200 ease-in-out lg:sticky lg:top-0 lg:h-svh lg:translate-x-0 ${
          abiertoEnMovil ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <img src={logoSportsAct} alt="Sports Act" className="h-9 w-auto" />
            {compania?.logo_url && (
              <img
                src={compania.logo_url}
                alt={compania.nombre}
                className="h-9 w-auto object-contain"
              />
            )}
            {sessionUser?.companiaId && !compania?.logo_url && (
              <div className="flex h-9 w-9 items-center justify-center rounded bg-white/5">
                <Building2 size={18} className="text-white/40" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="rounded p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
              title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar menú"
              className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navegación principal">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCerrar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
              title={isCollapsed ? getNavLabel(item.to) : undefined}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                      isActive ? 'bg-accent-500' : 'bg-transparent'
                    }`}
                    aria-hidden="true"
                  />
                  <item.icon size={18} className="shrink-0" />
                  {!isCollapsed && <span>{getNavLabel(item.to)}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          {!isCollapsed && <p className="text-xs text-white/50">Sports Act Business Hub</p>}
        </div>
      </aside>
    </>
  );
}
