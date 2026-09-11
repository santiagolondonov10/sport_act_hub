import { authHeaders, clearSession } from '@/lib/auth';

export interface Subscription {
  code: string;
  name: string;
  description: string;
  priceCop: number;
  maxUsers: number | null;
  features: string[];
  isActive: boolean;
}

export interface MenuOption { code: string; label: string; path: string; icon: string | null; sortOrder: number; isActive: boolean }
export interface Access { subscriptionType: string; menuOptionCode: string }
export interface Compania { id: string; nombre: string; sector: string; contactName: string; phone: string; phone2: string | null; email: string; email2: string | null; logoUrl: string | null }
export interface Sector { id: string; nombre: string; descripcion: string; isActive: boolean }
export interface AdminUser { id: string; email: string; username: string; subscriptionType: string; companiaId: string | null; companiaNombre: string | null; validFrom: string; validUntil: string; createdAt: string; updatedAt: string; lastLoginAt: string | null }
export interface Configuration { subscriptions: Subscription[]; menuOptions: MenuOption[]; access: Access[]; companias: Compania[]; sectores: Sector[] }

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, value));
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json() as T & { error?: string };
  if (response.status === 401 || response.status === 403) {
    clearSession();
    window.location.assign('/login');
    throw new Error('Tu sesión administrativa venció. Inicia sesión nuevamente.');
  }
  if (!response.ok) throw new Error(payload.error ?? 'No fue posible actualizar la configuración.');
  return payload;
}

export async function loadConfiguration() {
  return request<Configuration>('/api/admin/configuration');
}
