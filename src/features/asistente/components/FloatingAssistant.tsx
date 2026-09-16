import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { AssistantChat } from './AssistantChat';

export function FloatingAssistant() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAbierto(!abierto)}
        className={`fixed z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 ${
          abierto
            ? 'bg-gray-100 text-gray-400'
            : 'bottom-6 right-6 bg-brand-800 text-white hover:bg-brand-900'
        }`}
        aria-label="Abrir asistente"
      >
        {abierto ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {abierto && <AssistantChat onCerrar={() => setAbierto(false)} />}
    </>
  );
}
