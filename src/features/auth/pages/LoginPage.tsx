import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Mail, ShieldCheck, Globe, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { hasSession, login } from '@/lib/auth';
import { PasswordResetModal } from '../components/PasswordResetModal';
import { useLanguage, type Language } from '@/lib/LanguageContext';
import logo from '@/assets/logo-sports-act.png';

export function LoginPage() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  if (hasSession()) return <Navigate to="/" replace />;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(identifier, password);
      navigate('/', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No fue posible iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  }


  return (
    <main className="min-h-svh bg-brand-950 px-5 py-8 text-white sm:px-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-16">
      <div className="absolute left-5 top-8 flex items-center gap-2 sm:left-8 lg:left-16">
        <Globe size={16} className="text-slate-400" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="rounded-lg border border-slate-700 bg-brand-900 px-3 py-1 text-sm text-slate-300 focus:border-accent-500 focus:outline-none"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      <section className="mx-auto flex w-full max-w-xl flex-col justify-between lg:py-8">
        <img src={logo} alt="Sports Act" className="h-10 w-auto self-start object-contain brightness-0 invert" />
        <div className="hidden max-w-lg lg:block">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-accent-500">{t('login.businessHub')}</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-tight text-white xl:text-6xl">
            {t('login.mainHeading')}
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-slate-300">
            {t('login.mainDescription')}
          </p>
          <div className="mt-12 grid max-w-md grid-cols-2 gap-3">
            <div className="border-l border-accent-500/70 pl-4">
              <strong className="block text-2xl text-white">360°</strong>
              <span className="text-sm text-slate-400">{t('login.operationLabel')}</span>
            </div>
            <div className="border-l border-slate-700 pl-4">
              <strong className="block text-2xl text-white">En vivo</strong>
              <span className="text-sm text-slate-400">{t('login.liveLabel')}</span>
            </div>
          </div>
        </div>
        <p className="hidden text-xs text-slate-500 lg:block">© 2026 Sports Act Business Hub</p>
      </section>

      <section className="mx-auto mt-12 w-full max-w-md lg:mt-0 lg:flex lg:items-center">
        <div className="w-full rounded-2xl bg-white p-7 text-gray-900 shadow-2xl shadow-black/20 sm:p-9">
          <div className="mb-8 flex flex-col items-center">
            <img src={logo} alt="Sports Act" className="mb-6 h-12 w-auto object-contain" />
            <div className="text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">{t('login.secureAccess')}</p>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-950">{t('login.title')}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{t('login.subtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <TextField
              label={t('login.emailLabel')}
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder={t('login.emailPlaceholder')}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">{t('login.passwordLabel')}</label>
                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-900"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-brand-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <div role="alert" className="rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2.5 text-sm text-danger-700">
                {error}
              </div>
            )}
            <Button
              type="submit"
              variante="primario"
              tamano="md"
              disabled={enviando}
              className="w-full py-2.5"
              icono={enviando ? <ShieldCheck size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
            >
              {enviando ? t('login.validating') : t('login.submitButton')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('login.noAccount')}{' '}
            <Link to="/registro" className="font-semibold text-brand-700 hover:text-brand-900">{t('login.createAccount')}</Link>
          </p>

          <PasswordResetModal abierto={resetModalOpen} onCerrar={() => setResetModalOpen(false)} />

          <div className="mt-7 border-t border-gray-100 pt-5 text-xs leading-5 text-gray-500">
            <div className="flex items-center gap-2 font-medium text-gray-700"><KeyRound size={14} aria-hidden="true" /> {t('login.demoAccess')}</div>
            <p className="mt-1">admin@sportsacthub.local · Admin123!</p>
          </div>
        </div>
      </section>

      <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-500 lg:hidden">
        <Mail size={13} aria-hidden="true" /> {t('login.platformDescription')}
      </div>
    </main>
  );
}
