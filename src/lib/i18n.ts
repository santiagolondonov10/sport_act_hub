export type Language = 'es' | 'en';

const translations = {
  es: {
    login: {
      title: 'Inicia sesión',
      subtitle: 'Ingresa con el correo o usuario de tu cuenta.',
      emailLabel: 'Correo o usuario',
      emailPlaceholder: 'usuario o correo@empresa.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Ingresa tu contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      submitButton: 'Entrar al Business Hub',
      validating: 'Validando...',
      noAccount: '¿Aún no tienes cuenta?',
      createAccount: 'Crear cuenta',
      demoAccess: 'Acceso de demostración local',
      secureAccess: 'Acceso seguro',
      platformDescription: 'Plataforma de gestión de patrocinios deportivos',
      businessHub: 'Business Hub',
      mainHeading: 'Convierte cada compromiso en valor demostrable.',
      mainDescription: 'Una vista conectada de activos, oportunidades, acuerdos y resultados para gestionar el patrocinio deportivo con precisión.',
      operationLabel: 'de la operación comercial',
      liveLabel: 'de cumplimiento y evidencias',
    },
    passwordReset: {
      title: 'Recuperar contraseña',
      description: 'Ingresa tu correo electrónico o usuario para recibir un código de recuperación válido por 30 minutos.',
      emailLabel: 'Correo o usuario',
      emailPlaceholder: 'usuario@ejemplo.com o tu_usuario',
      getCode: 'Obtener código',
      sending: 'Enviando...',
      cancel: 'Cancelar',
      codeReceived: 'Código recibido:',
      newPasswordLabel: 'Nueva contraseña',
      newPasswordPlaceholder: 'Mínimo 8 caracteres',
      confirmPasswordLabel: 'Confirmar contraseña',
      confirmPasswordPlaceholder: 'Repite tu nueva contraseña',
      resetButton: 'Restablecer contraseña',
      resetting: 'Restableciendo...',
      back: 'Atrás',
      successTitle: 'Contraseña actualizada',
      successMessage: 'Tu contraseña ha sido restablecida correctamente. Serás redirigido al login en breve.',
      successMessage2: 'Código de recuperación generado. Úsalo en los próximos 30 minutos.',
    },
  },
  en: {
    login: {
      title: 'Sign in',
      subtitle: 'Enter with your account email or username.',
      emailLabel: 'Email or username',
      emailPlaceholder: 'username or email@company.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      forgotPassword: 'Forgot your password?',
      submitButton: 'Enter Business Hub',
      validating: 'Validating...',
      noAccount: "Don't have an account yet?",
      createAccount: 'Create account',
      demoAccess: 'Local demo access',
      secureAccess: 'Secure access',
      platformDescription: 'Sports sponsorship management platform',
      businessHub: 'Business Hub',
      mainHeading: 'Turn every commitment into demonstrable value.',
      mainDescription: 'A connected view of assets, opportunities, agreements and results to manage sports sponsorship with precision.',
      operationLabel: 'of commercial operation',
      liveLabel: 'of compliance and evidence',
    },
    passwordReset: {
      title: 'Recover password',
      description: 'Enter your email or username to receive a recovery code valid for 30 minutes.',
      emailLabel: 'Email or username',
      emailPlaceholder: 'user@example.com or your_username',
      getCode: 'Get code',
      sending: 'Sending...',
      cancel: 'Cancel',
      codeReceived: 'Code received:',
      newPasswordLabel: 'New password',
      newPasswordPlaceholder: 'Minimum 8 characters',
      confirmPasswordLabel: 'Confirm password',
      confirmPasswordPlaceholder: 'Repeat your new password',
      resetButton: 'Reset password',
      resetting: 'Resetting...',
      back: 'Back',
      successTitle: 'Password updated',
      successMessage: 'Your password has been reset successfully. You will be redirected to login shortly.',
      successMessage2: 'Recovery code generated. Use it in the next 30 minutes.',
    },
  },
};

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

export function useLanguage() {
  const savedLang = localStorage.getItem('app-language') as Language | null;
  const browserLang = navigator.language.startsWith('es') ? 'es' : 'en';
  const language = (savedLang || browserLang) as Language;

  const setLanguage = (lang: Language) => {
    localStorage.setItem('app-language', lang);
    window.location.reload();
  };

  const t = (key: string) => getTranslation(language, key);

  return { language, setLanguage, t };
}
