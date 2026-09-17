import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, Moon, Search, Sun } from 'lucide-react';
import { getNavItemForPath } from '@/lib/navigation';
import { getNotificaciones } from '@/lib/selectors';
import { formatFecha } from '@/lib/format';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useToast } from '@/hooks/useToast';
import { useLanguage, type Language } from '@/lib/LanguageContext';
import { useAdminCompanyCheck } from '@/hooks/useAdminCompanyCheck';
import { clearSession, getSessionUser } from '@/lib/auth';
import { apiCall } from '@/lib/api-client';
import { AccountSettingsModal } from './AccountSettingsModal';

interface HeaderProps {
  onAbrirMenu: () => void;
}

interface Compania {
  id: string;
  nombre: string;
  logo_url?: string;
}

export function Header({ onAbrirMenu }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const seccion = getNavItemForPath(location.pathname);
  const { mostrarToast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const [sessionUser, setSessionUser] = useState(() => getSessionUser());

  const [busqueda, setBusqueda] = useState('');
  const [notificaciones, setNotificaciones] = useState(() =>
    getNotificaciones().map((n) => ({ ...n, leida: false })),
  );
  const [notifAbiertas, setNotifAbiertas] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [temaOscuro, setTemaOscuro] = useState(() => window.localStorage.getItem('sports-act-theme') === 'dark');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [companiasSelectorAbierto, setCompaniasSelectorAbierto] = useState(false);
  const [companias, setCompanias] = useState<Compania[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const perfilRef = useRef<HTMLDivElement>(null);
  const companiaRef = useRef<HTMLDivElement>(null);
  useClickOutside(notifRef, () => setNotifAbiertas(false));
  useClickOutside(perfilRef, () => setPerfilAbierto(false));
  useClickOutside(companiaRef, () => setCompaniasSelectorAbierto(false));

  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const nombreUsuario = sessionUser?.username ?? sessionUser?.email ?? 'Usuario';
  const rolUsuario = `Suscripción ${sessionUser?.subscriptionType ?? 'FREE'}`;
  const inicialesUsuario = nombreUsuario.slice(0, 2).toUpperCase();
  const { isAdmin, isAdminWithoutCompany } = useAdminCompanyCheck();

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', temaOscuro);
    window.localStorage.setItem('sports-act-theme', temaOscuro ? 'dark' : 'light');
  }, [temaOscuro]);

  useEffect(() => {
    if (isAdmin && companiasSelectorAbierto && companias.length === 0) {
      fetchCompanias();
    }
  }, [companiasSelectorAbierto, isAdmin, sessionUser]);

  async function fetchCompanias() {
    try {
      const headers = new Headers();
      if (sessionUser?.email) {
        headers.set('x-user-id', sessionUser.email);
      } else if (sessionUser?.username) {
        headers.set('x-user-id', sessionUser.username);
      }
      const response = await apiCall('/api/companias', { headers });
      if (response.ok) {
        const data = await response.json();
        setCompanias(data);
      } else {
        console.error('Error fetching companias:', response.status);
      }
    } catch (error) {
      console.error('Error fetching companias:', error);
    }
  }

  function handleSelectCompania(compania: Compania) {
    if (sessionUser) {
      const updatedUser = {
        ...sessionUser,
        companiaId: compania.id,
        companiaNombre: compania.nombre,
        companiaLogo: compania.logo_url,
      };
      setSessionUser(updatedUser);
      window.localStorage.setItem('sports-act-auth-session', JSON.stringify(updatedUser));
      setCompaniasSelectorAbierto(false);
      mostrarToast(`Ahora trabajas con ${compania.nombre}`, 'exito');
      window.location.reload();
    }
  }

  function handleLanguageChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLanguage = event.target.value as Language;
    setLanguage(nextLanguage);
  }

  function handleBuscarSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!busqueda.trim()) return;
    mostrarToast(`Búsqueda de "${busqueda}" disponible dentro de cada módulo.`, 'info');
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
      <button
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menú de navegación"
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">{seccion.label}</h1>
        <p className="hidden truncate text-xs text-gray-500 sm:block">{seccion.description}</p>
      </div>

      <form onSubmit={handleBuscarSubmit} className="relative hidden w-64 md:block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={t('header.search')}
          className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-brand-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800/20"
        />
      </form>

      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setNotifAbiertas((v) => !v)}
          aria-label="Notificaciones"
          className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100"
        >
          <Bell size={19} />
          {noLeidas > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-semibold text-white">
              {noLeidas}
            </span>
          )}
        </button>
        {notifAbiertas && (
          <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{t('header.notifications')}</p>
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={() => setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))}
                  className="text-xs font-medium text-brand-800 hover:underline"
                >
                  {t('header.markAllAsRead')}
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notificaciones.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-gray-500">{t('header.noNotifications')}</li>
              )}
              {notificaciones.map((notif) => (
                <li key={notif.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setNotificaciones((prev) =>
                        prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n)),
                      )
                    }
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-gray-50 px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50 ${
                      notif.leida ? 'text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {!notif.leida && <span className="h-1.5 w-1.5 rounded-full bg-accent-600" aria-hidden="true" />}
                      {notif.mensaje}
                    </span>
                    <span className="text-xs text-gray-400">{formatFecha(notif.fecha)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <label className="flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark-control">
        <span className="sr-only">{t('header.language')}</span>
        <select value={language} onChange={handleLanguageChange} aria-label={t('header.language')} className="cursor-pointer border-0 bg-transparent pr-1 text-xs font-medium text-gray-600 outline-none">
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </label>

      <button
        type="button"
        onClick={() => setTemaOscuro((value) => !value)}
        aria-label={temaOscuro ? t('header.lightMode') : t('header.darkMode')}
        aria-pressed={temaOscuro}
        title={temaOscuro ? t('header.lightMode') : t('header.darkMode')}
        className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-50 dark-control"
      >
        {temaOscuro ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {isAdmin ? (
        <div className="relative" ref={companiaRef}>
          <button
            type="button"
            onClick={() => setCompaniasSelectorAbierto((v) => !v)}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 ${
              isAdminWithoutCompany
                ? 'border-danger-300 bg-danger-50 hover:bg-danger-100'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            {sessionUser?.companiaLogo && (
              <img src={sessionUser.companiaLogo} alt={sessionUser.companiaNombre || 'Compañía'} className="h-6 w-6 rounded object-cover" />
            )}
            <span className={`text-xs font-medium hidden sm:block max-w-32 truncate ${
              isAdminWithoutCompany ? 'text-danger-700' : 'text-gray-600'
            }`}>
              {sessionUser?.companiaNombre || '⚠️ Seleccionar compañía'}
            </span>
            <ChevronDown size={14} className={isAdminWithoutCompany ? 'text-danger-600' : 'text-gray-400'} />
          </button>
          {companiasSelectorAbierto && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg max-h-96 overflow-y-auto z-50">
              <div className="border-b border-gray-100 px-4 py-2">
                <p className="text-sm font-semibold text-gray-900">Seleccionar Compañía</p>
              </div>
              <ul>
                {companias.length === 0 ? (
                  <li className="px-4 py-3 text-center text-xs text-gray-500">Cargando compañías...</li>
                ) : (
                  companias.map((compania) => (
                    <li key={compania.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectCompania(compania)}
                        className={`flex w-full items-center gap-2 border-b border-gray-50 px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50 ${
                          sessionUser?.companiaId === compania.id ? 'bg-brand-50' : ''
                        }`}
                      >
                        {compania.logo_url && (
                          <img src={compania.logo_url} alt={compania.nombre} className="h-6 w-6 rounded object-cover flex-shrink-0" />
                        )}
                        <span className="flex-1 truncate">{compania.nombre}</span>
                        {sessionUser?.companiaId === compania.id && (
                          <span className="text-brand-800 font-medium">✓</span>
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      ) : sessionUser?.companiaLogo ? (
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5">
          <img src={sessionUser.companiaLogo} alt={sessionUser.companiaNombre || 'Compañía'} className="h-6 w-6 rounded object-cover" title={sessionUser.companiaNombre || undefined} />
          <span className="text-xs font-medium text-gray-600 hidden sm:block max-w-32 truncate">{sessionUser.companiaNombre}</span>
        </div>
      ) : null}

      <div className="relative" ref={perfilRef}>
        <button
          type="button"
          onClick={() => setPerfilAbierto((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 py-1 pl-1 pr-2 hover:bg-gray-50"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-800 text-xs font-semibold text-white">
            {inicialesUsuario}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block max-w-32 truncate text-xs font-medium text-gray-900">{nombreUsuario}</span>
            <span className="block text-[11px] text-gray-500">{rolUsuario}</span>
          </span>
          <ChevronDown size={14} className="hidden text-gray-400 sm:block" />
        </button>
        {perfilAbierto && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <div className="border-b border-gray-100 px-4 py-2">
              <p className="text-sm font-medium text-gray-900">{nombreUsuario}</p>
              <p className="truncate text-xs text-gray-500">{sessionUser?.email ?? 'Sin correo registrado'}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPerfilAbierto(false);
                setSettingsModalOpen(true);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('header.accountSettings')}
            </button>
            <button
              type="button"
              onClick={() => {
                clearSession();
                navigate('/login', { replace: true });
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('header.logout')}
            </button>
          </div>
        )}
      </div>

      <AccountSettingsModal abierto={settingsModalOpen} onCerrar={() => setSettingsModalOpen(false)} />
    </header>
  );
}
