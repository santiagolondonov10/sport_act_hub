import { useState } from 'react';
import { ArrowRight, CheckCircle2, LockKeyhole, UserPlus } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { hasSession, register } from '@/lib/auth';
import logo from '@/assets/logo-sports-act.png';

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (hasSession()) return <Navigate to="/" replace />;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido (ej: tu@empresa.com).');
      return;
    }

    // Validar contraseña
    if (password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    try {
      await register(email, username, password);
      navigate('/', { replace: true });
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'No fue posible crear la cuenta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-svh bg-brand-950 px-5 py-8 text-white sm:px-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-16">
      <section className="mx-auto flex w-full max-w-xl flex-col justify-between lg:py-8">
        <img src={logo} alt="Sports Act" className="h-10 w-auto self-start object-contain brightness-0 invert" />
        <div className="hidden max-w-lg lg:block">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-accent-500">Business Hub</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-tight text-white xl:text-6xl">Tu operación deportiva, en un solo lugar.</h1>
          <p className="mt-7 max-w-md text-base leading-7 text-slate-300">Crea tu acceso para organizar patrocinios, compromisos y resultados con todo tu equipo.</p>
          <div className="mt-10 space-y-4 text-sm text-slate-300">
            <div className="flex items-center gap-3"><CheckCircle2 size={17} className="text-accent-500" /> Acceso con correo o usuario</div>
            <div className="flex items-center gap-3"><CheckCircle2 size={17} className="text-accent-500" /> Contraseña protegida con hash seguro</div>
            <div className="flex items-center gap-3"><CheckCircle2 size={17} className="text-accent-500" /> Cuenta válida por un año</div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 w-full max-w-md lg:mt-0 lg:flex lg:items-center">
        <div className="w-full rounded-2xl bg-white p-7 text-gray-900 shadow-2xl shadow-black/20 sm:p-9">
          <div className="mb-8">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-brand-800"><UserPlus size={21} aria-hidden="true" /></div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Nuevo acceso</p>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950">Crea tu cuenta</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">Configura tus datos para entrar al Business Hub.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField label="Correo electrónico" id="register-email" type="email" autoComplete="email" placeholder="tu@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <TextField label="Usuario" id="register-username" type="text" autoComplete="username" placeholder="tu_usuario" hint="Usa entre 3 y 32 caracteres, sin espacios." value={username} onChange={(event) => setUsername(event.target.value)} required />
            <TextField label="Contraseña" id="register-password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            <TextField label="Confirmar contraseña" id="register-confirmation" type="password" autoComplete="new-password" placeholder="Repite tu contraseña" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required />
            {error && <div role="alert" className="rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2.5 text-sm text-danger-700">{error}</div>}
            <Button type="submit" variante="primario" tamano="md" disabled={enviando} className="w-full py-2.5" icono={enviando ? <LockKeyhole size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}>
              {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900">Inicia sesión</Link></p>
        </div>
      </section>
    </main>
  );
}
