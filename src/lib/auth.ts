export interface AuthUser {
  id: string;
  email: string | null;
  username: string | null;
  subscriptionType: string;
  companiaId?: string | null;
  companiaNombre?: string | null;
  companiaLogo?: string | null;
  menuOptions: Array<{
    code: string;
    label: string;
    path: string;
    icon: string | null;
    sortOrder: number;
  }>;
}

const SESSION_KEY = 'sports-act-auth-session';

export function authHeaders() {
  const user = getSessionUser();
  const headers: Record<string, string> = {};
  if (user) {
    headers['x-user-id'] = user.email || user.username || '';
    if (user.companiaId) {
      headers['x-compania-id'] = user.companiaId;
    }
  }
  return headers;
}

export function hasSession() {
  return Boolean(window.localStorage.getItem(SESSION_KEY));
}

export function getSessionUser(): AuthUser | null {
  const value = window.localStorage.getItem(SESSION_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export async function login(identifier: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  let payload: { user?: AuthUser; error?: string };
  try {
    payload = (await response.json()) as { user?: AuthUser; error?: string };
  } catch {
    throw new Error('El servidor no respondió correctamente. Por favor, intenta nuevamente.');
  }
  if (!response.ok || !payload.user) throw new Error(payload.error ?? 'No fue posible iniciar sesión.');
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload.user));
  return payload.user;
}

export async function register(email: string, username: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  let payload: { user?: AuthUser; error?: string };
  try {
    payload = (await response.json()) as { user?: AuthUser; error?: string };
  } catch {
    throw new Error('El servidor no respondió correctamente. Por favor, intenta nuevamente.');
  }
  if (!response.ok || !payload.user) throw new Error(payload.error ?? 'No fue posible crear la cuenta.');
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload.user));
  return payload.user;
}

export async function requestPasswordReset(identifier: string): Promise<string> {
  const response = await fetch('/api/auth/request-password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier }),
  });
  let payload: { resetToken?: string; message?: string; error?: string };
  try {
    payload = (await response.json()) as { resetToken?: string; message?: string; error?: string };
  } catch {
    throw new Error('El servidor no respondió correctamente. Por favor, intenta nuevamente.');
  }
  if (!response.ok) throw new Error(payload.error ?? 'No fue posible solicitar la recuperación.');
  return payload.resetToken ?? '';
}

export async function resetPassword(identifier: string, resetToken: string, newPassword: string): Promise<void> {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, resetToken, newPassword }),
  });
  let payload: { message?: string; error?: string };
  try {
    payload = (await response.json()) as { message?: string; error?: string };
  } catch {
    throw new Error('El servidor no respondió correctamente. Por favor, intenta nuevamente.');
  }
  if (!response.ok) throw new Error(payload.error ?? 'No fue posible restablecer la contraseña.');
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, value));
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers,
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  let payload: { message?: string; error?: string };
  try {
    payload = (await response.json()) as { message?: string; error?: string };
  } catch {
    throw new Error('El servidor no respondió correctamente. Por favor, intenta nuevamente.');
  }
  if (!response.ok) throw new Error(payload.error ?? 'No fue posible cambiar la contraseña.');
}
