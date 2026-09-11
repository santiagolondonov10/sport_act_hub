/**
 * Wrapper para fetch que detecta automáticamente si estamos en un túnel
 * y ajusta las URLs de la API según sea necesario
 */

let cachedTunnelBackendUrl: string | null | undefined;

function getTunnelBackendUrl(): string | null {
  // Si ya hemos cached la detección, devolverla
  if (cachedTunnelBackendUrl !== undefined) {
    return cachedTunnelBackendUrl;
  }

  try {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    console.log(`[fetch-wrapper] Detectando túnel: hostname=${hostname}, protocol=${protocol}`);

    // Detectar si estamos en un túnel de devtunnels.ms
    if (hostname.includes('devtunnels.ms')) {
      console.log('[fetch-wrapper] Túnel detectado en devtunnels.ms');

      // Reemplazar "-5173" por "-3001" para apuntar al backend del túnel
      const backendHostname = hostname.replace('-5173', '-3001');
      const backendUrl = `${protocol}//${backendHostname}`;

      console.log(`[fetch-wrapper] Backend URL de túnel: ${backendUrl}`);
      cachedTunnelBackendUrl = backendUrl;
      return backendUrl;
    }

    console.log('[fetch-wrapper] No es un túnel, modo desarrollo local');
    cachedTunnelBackendUrl = null;
  } catch (e) {
    console.warn('[fetch-wrapper] Error detectando túnel:', e);
    cachedTunnelBackendUrl = null;
  }
  return null;
}

function adjustUrl(url: string | URL): string {
  const urlString = typeof url === 'string' ? url : url.toString();

  // Si es una URL relativa que comienza con /api, ajustarla según sea necesario
  if (urlString.startsWith('/api')) {
    const backendUrl = getTunnelBackendUrl();
    if (backendUrl) {
      // Estamos en un túnel, usar URL absoluta
      const adjustedUrl = `${backendUrl}${urlString}`;
      console.log(`[fetch-wrapper] URL de túnel ajustada: ${urlString} → ${adjustedUrl}`);
      return adjustedUrl;
    }
    // En desarrollo local, dejar la URL relativa para que use el proxy de Vite
    console.log(`[fetch-wrapper] URL relativa (proxy local): ${urlString}`);
    return urlString;
  }

  // Si es una URL absoluta que apunta a localhost:3001, reemplazarla por el backend del túnel
  if (urlString.includes('localhost:3001') || urlString.includes('127.0.0.1:3001')) {
    const backendUrl = getTunnelBackendUrl();
    if (backendUrl) {
      const adjustedUrl = urlString.replace(/https?:\/\/(localhost|127\.0\.0\.1):3001/, backendUrl);
      console.log(`[fetch-wrapper] URL localhost reemplazada: ${urlString} → ${adjustedUrl}`);
      return adjustedUrl;
    }
  }

  // Dejar otras URLs como están
  return urlString;
}

/**
 * Reemplazo global de fetch que ajusta URLs automáticamente
 */
export function setupFetchInterceptor() {
  const originalFetch = window.fetch;
  const backendUrl = getTunnelBackendUrl();

  console.log('[fetch-wrapper] Interceptor de fetch inicializado');
  console.log(`[fetch-wrapper] Hostname: ${window.location.hostname}`);
  console.log(`[fetch-wrapper] Protocol: ${window.location.protocol}`);
  if (backendUrl) {
    console.log(`[fetch-wrapper] Modo: Túnel (Backend URL: ${backendUrl})`);
  } else {
    console.log(`[fetch-wrapper] Modo: Desarrollo local (proxy de Vite)`);
  }

  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const originalUrl = typeof input === 'string' ? input : input.toString();
    const adjustedUrl = adjustUrl(originalUrl);

    if (adjustedUrl !== originalUrl) {
      console.log(`[fetch-wrapper] URL ajustada: ${originalUrl} → ${adjustedUrl}`);
    }

    return originalFetch.call(window, adjustedUrl, init).catch((error) => {
      console.error(`[fetch-wrapper] Error en fetch: ${adjustedUrl}`, error);
      throw error;
    });
  };
}
