// Determina la URL base del backend según donde está corriendo el frontend
export function getBackendUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3001';
  }

  const hostname = window.location.hostname;

  // En localhost, usar el proxy de Vite (que apunta a localhost:3001)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '';
  }

  // En DevTunnel o production, usar la URL del backend directamente
  if (hostname.includes('w3fszsbv')) {
    return 'https://w3fszsbv-3001.use2.devtunnels.ms';
  }

  // Default: usar localhost
  return 'http://localhost:3001';
}

export async function apiCall(endpoint: string, options?: RequestInit): Promise<Response> {
  const baseUrl = getBackendUrl();
  const url = baseUrl ? baseUrl + endpoint : endpoint;

  return fetch(url, options);
}
