import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { changePassword, getSessionUser, authHeaders } from '@/lib/auth';

interface AccountSettingsModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

type Step = 'view' | 'changePassword' | 'success';

interface Compania {
  id: string;
  nombre: string;
  logo_url?: string | null;
}


export function AccountSettingsModal({ abierto, onCerrar }: AccountSettingsModalProps) {
  const sessionUser = getSessionUser();
  const [step, setStep] = useState<Step>('view');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compania, setCompania] = useState<Compania | null>(null);
  const [loadingCompania, setLoadingCompania] = useState(false);

  useEffect(() => {
    if (abierto && sessionUser?.companiaId) {
      setLoadingCompania(true);
      const headers = new Headers();
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
      fetch(`/api/admin/companias/${sessionUser.companiaId}`, { headers })
        .then((res) => res.json())
        .then((data: Compania) => setCompania(data))
        .catch(() => setCompania(null))
        .finally(() => setLoadingCompania(false));
    }
  }, [abierto, sessionUser?.companiaId]);

  function handleCerrar() {
    setStep('view');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onCerrar();
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setStep('success');
      setTimeout(() => {
        handleCerrar();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={handleCerrar} titulo="Configuración de cuenta" ancho="md">
      {step === 'view' && (
        <div className="space-y-6">
          {/* Avatar / Logo de Compañía */}
          <div className="flex justify-center">
            {loadingCompania ? (
              <div className="h-16 w-16 animate-pulse rounded-lg bg-gray-200" />
            ) : compania?.logo_url ? (
              <img
                src={compania.logo_url}
                alt={compania.nombre}
                className="h-16 w-16 rounded-lg object-contain bg-gray-50 p-2 border border-gray-200"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-100">
                <Building2 size={32} className="text-brand-800" />
              </div>
            )}
          </div>

          {/* Información de la Cuenta */}
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Información de la cuenta</p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500">Usuario</p>
                <p className="text-sm font-medium text-gray-900">{sessionUser?.username ?? 'No disponible'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Correo electrónico</p>
                <p className="text-sm font-medium text-gray-900">{sessionUser?.email ?? 'No disponible'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tipo de suscripción</p>
                <p className="text-sm font-medium text-gray-900">{sessionUser?.subscriptionType ?? 'No disponible'}</p>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">Compañía</p>
                {loadingCompania ? (
                  <div className="mt-1 h-4 w-32 animate-pulse rounded bg-gray-200" />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{compania?.nombre ?? 'Sin compañía asignada'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variante="fantasma" onClick={handleCerrar}>
              Cerrar
            </Button>
            <Button
              type="button"
              variante="primario"
              onClick={() => {
                setStep('changePassword');
                setError('');
              }}
            >
              Cambiar contraseña
            </Button>
          </div>
        </div>
      )}

      {step === 'changePassword' && (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="relative">
            <label htmlFor="current-password" className="text-sm font-medium text-gray-700">
              Contraseña actual
            </label>
            <div className="relative mt-1.5">
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-brand-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="new-password" className="text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <div className="relative mt-1.5">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-brand-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
              Confirmar nueva contraseña
            </label>
            <div className="relative mt-1.5">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-brand-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-danger-500/30 bg-danger-50 p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger-700" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button
              type="button"
              variante="fantasma"
              onClick={() => {
                setStep('view');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
              }}
              disabled={loading}
            >
              Atrás
            </Button>
            <Button type="submit" variante="primario" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
              {loading ? 'Cambiando...' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
      )}

      {step === 'success' && (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
            <CheckCircle2 size={24} className="text-success-700" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">Contraseña actualizada</p>
            <p className="mt-1 text-sm text-gray-500">Tu contraseña ha sido cambiada correctamente.</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
