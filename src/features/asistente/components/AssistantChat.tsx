import { useState, useRef, useEffect } from 'react';
import { Send, Loader, AlertCircle, Download } from 'lucide-react';
import { useAssistant } from '../hooks/useAssistant';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  archivo?: {
    base64: string;
    nombre: string;
    tipo: string;
  };
}

interface AssistantChatProps {
  onCerrar: () => void;
}

const STORAGE_KEY = 'asistente_chat_mensajes';
const STORAGE_TIMESTAMP_KEY = 'asistente_chat_timestamp';
const TIMEOUT_MINUTOS = 10;

export function AssistantChat({ onCerrar }: AssistantChatProps) {
  const cargarMensajesGuardados = () => {
    try {
      const mensajesGuardados = localStorage.getItem(STORAGE_KEY);
      const timestampGuardado = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

      if (mensajesGuardados && timestampGuardado) {
        const ahora = Date.now();
        const tiempoTranscurrido = (ahora - parseInt(timestampGuardado)) / 1000 / 60; // en minutos

        // Si han pasado menos de 10 minutos, cargar los mensajes
        if (tiempoTranscurrido < TIMEOUT_MINUTOS) {
          return JSON.parse(mensajesGuardados);
        } else {
          // Si han pasado más de 10 minutos, limpiar
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        }
      }
    } catch (error) {
      console.error('Error cargando mensajes guardados:', error);
    }

    // Retornar mensaje de bienvenida por defecto
    return [
      {
        id: '1',
        role: 'assistant' as const,
        content: '¡Hola! Soy tu asistente IA. Puedo ayudarte a buscar información en la base de datos sobre oportunidades, acuerdos, compromisos, evidencias y más. ¿Qué deseas saber?',
        timestamp: new Date(),
      },
    ];
  };

  const [mensajes, setMensajes] = useState<Message[]>(cargarMensajesGuardados);
  const [input, setInput] = useState('');
  const { enviarPregunta, cargando, error } = useAssistant();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const descargarArchivo = (archivo: Message['archivo']) => {
    if (!archivo) return;

    const binaryString = atob(archivo.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: archivo.tipo });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = archivo.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Guardar mensajes en localStorage cada vez que cambien
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mensajes));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error guardando mensajes:', error);
    }

    scrollToBottom();

    // Configurar timeout de 10 minutos para limpiar
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    }, TIMEOUT_MINUTOS * 60 * 1000);
  }, [mensajes]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleEnviar() {
    if (!input.trim()) return;

    const mensajeUsuario: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMensajes((prev) => [...prev, mensajeUsuario]);
    setInput('');

    try {
      const respuesta = await enviarPregunta(input);

      // Parsear respuesta que puede incluir archivo
      let contenido = respuesta;
      let archivo: Message['archivo'] | undefined;

      if (typeof respuesta === 'object' && respuesta !== null && 'respuesta' in respuesta && 'archivo' in respuesta) {
        const datosRespuesta = respuesta as any;
        contenido = datosRespuesta.respuesta;
        if (datosRespuesta.archivo) {
          archivo = {
            base64: datosRespuesta.archivo,
            nombre: datosRespuesta.nombreArchivo,
            tipo: datosRespuesta.tipoArchivo,
          };
        }
      }

      const mensajeAsistente: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: contenido,
        timestamp: new Date(),
        archivo,
      };
      setMensajes((prev) => [...prev, mensajeAsistente]);
    } catch (err) {
      const mensajeError: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Disculpa, hubo un error al procesar tu pregunta. Por favor intenta nuevamente.',
        timestamp: new Date(),
      };
      setMensajes((prev) => [...prev, mensajeError]);
    }
  }

  return (
    <div className="fixed bottom-24 right-6 z-40 flex h-[500px] w-96 flex-col rounded-lg border border-gray-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h3 className="font-semibold text-gray-900">Asistente IA</h3>
          <p className="text-xs text-gray-500">Consulta tu base de datos</p>
        </div>
        <button
          onClick={onCerrar}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
        {mensajes.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-brand-800 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.content}
              {msg.archivo && msg.role === 'assistant' && (
                <button
                  onClick={() => descargarArchivo(msg.archivo)}
                  className="mt-2 flex items-center gap-1 rounded bg-white bg-opacity-20 px-2 py-1 text-xs font-medium hover:bg-opacity-30"
                >
                  <Download size={14} />
                  Descargar {msg.archivo.nombre}
                </button>
              )}
            </div>
          </div>
        ))}
        {cargando && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-3 py-2">
              <Loader size={16} className="animate-spin text-gray-600" />
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="flex max-w-xs items-center gap-2 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">
              <AlertCircle size={16} />
              {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEnviar()}
            placeholder="Escribe tu pregunta..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            disabled={cargando}
          />
          <button
            onClick={handleEnviar}
            disabled={cargando || !input.trim()}
            className="rounded-lg bg-brand-800 p-2 text-white hover:bg-brand-900 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
