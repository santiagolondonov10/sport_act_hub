import { useState } from 'react';
import { authHeaders } from '@/lib/auth';

export function useAssistant() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviarPregunta(pregunta: string): Promise<string> {
    setCargando(true);
    setError(null);

    try {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });

      const response = await fetch('/api/asistente/pregunta', {
        method: 'POST',
        headers,
        body: JSON.stringify({ pregunta }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al procesar la pregunta');
      }

      const data = await response.json();
      return data.respuesta;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setError(mensaje);
      throw err;
    } finally {
      setCargando(false);
    }
  }

  async function descargarReporte(tipo: 'acuerdos' | 'compromisos' | 'oportunidades'): Promise<void> {
    setCargando(true);
    setError(null);

    try {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const auth = authHeaders();
      Object.entries(auth).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });

      const response = await fetch('/api/asistente/generar-reporte', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tipo }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al generar el reporte');
      }

      const data = await response.json();

      // Convertir base64 a blob
      const binaryString = atob(data.archivo);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.tipo });

      // Crear link de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setError(mensaje);
      throw err;
    } finally {
      setCargando(false);
    }
  }

  return { enviarPregunta, descargarReporte, cargando, error };
}
