import { useState } from 'react';
import { KeyRound, Mail, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { resetPassword } from '@/lib/auth';
import { apiCall } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { useLanguage } from '@/lib/LanguageContext';

interface PasswordResetModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

type Step = 'request' | 'show-password' | 'reset' | 'success';

export function PasswordResetModal({ abierto, onCerrar }: PasswordResetModalProps) {
  const { mostrarToast } = useToast();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleReset() {
    setStep('request');
    setIdentifier('');
    setResetToken('');
    setTemporaryPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }

  function handleCerrar() {
    handleReset();
    onCerrar();
  }

  async function handleRequestReset(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiCall('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error');

      setResetToken(data.resetToken);
      setTemporaryPassword(data.temporaryPassword);
      setStep('show-password');
      mostrarToast(t('passwordReset.successMessage2'), 'exito');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(temporaryPassword);
    mostrarToast('Contraseña temporal copiada', 'exito');
  }

  function proceedToReset() {
    setStep('reset');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('error.contrasenaNoCoincide'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('error.contrasenaPocaLongitud'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(identifier, resetToken, newPassword);
      setStep('success');
      setTimeout(() => {
        handleCerrar();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={handleCerrar} titulo={t('passwordReset.title')} ancho="md">
      {step === 'request' && (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('passwordReset.description')}
          </p>
          <TextField
            label={t('passwordReset.emailLabel')}
            type="text"
            placeholder={t('passwordReset.emailPlaceholder')}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
          />
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-danger-500/30 bg-danger-50 p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger-700" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variante="fantasma" onClick={handleCerrar}>
              {t('passwordReset.cancel')}
            </Button>
            <Button type="submit" variante="primario" disabled={loading || !identifier.trim()} icono={<Mail size={16} />}>
              {loading ? t('passwordReset.sending') : t('passwordReset.getCode')}
            </Button>
          </div>
        </form>
      )}

      {step === 'show-password' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-success-500/30 bg-success-50 p-3">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success-700" />
            <div>
              <p className="font-medium text-success-700">Se envió tu contraseña temporal</p>
              <p className="mt-1 text-sm text-success-600">Revisa tu correo y copia la contraseña temporal que aparece abajo:</p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Contraseña temporal:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-lg font-semibold text-gray-900 border border-gray-200">
                {temporaryPassword}
              </code>
              <button
                type="button"
                onClick={copyToClipboard}
                className="rounded p-2 hover:bg-gray-200"
                title="Copiar"
              >
                <Copy size={18} className="text-gray-600" />
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-warning-50 p-3 border border-warning-500/30">
            <p className="text-sm text-warning-700">
              <strong>Por seguridad:</strong> Debes ingresar a tu cuenta con esta contraseña temporal y cambiarla inmediatamente.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variante="fantasma" onClick={handleCerrar}>
              {t('common.close')}
            </Button>
            <Button type="button" variante="primario" onClick={proceedToReset} icono={<KeyRound size={16} />}>
              Cambiar contraseña ahora
            </Button>
          </div>
        </div>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="rounded-lg bg-info-50 p-3 text-sm text-info-700">
            <p className="font-medium">Ingresa tu nueva contraseña:</p>
          </div>
          <TextField
            label={t('passwordReset.newPasswordLabel')}
            type="password"
            placeholder={t('passwordReset.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <TextField
            label={t('passwordReset.confirmPasswordLabel')}
            type="password"
            placeholder={t('passwordReset.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-danger-500/30 bg-danger-50 p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger-700" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variante="fantasma" onClick={() => setStep('show-password')} disabled={loading}>
              {t('passwordReset.back')}
            </Button>
            <Button type="submit" variante="primario" disabled={loading || !newPassword || !confirmPassword} icono={<KeyRound size={16} />}>
              {loading ? t('passwordReset.resetting') : t('passwordReset.resetButton')}
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
            <p className="text-base font-semibold text-gray-900">{t('passwordReset.successTitle')}</p>
            <p className="mt-1 text-sm text-gray-500">{t('passwordReset.successMessage')}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
