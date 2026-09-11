import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Minus, Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [position, setPosition] = useState({ x: -380, y: -420 }); // Esquina inferior derecha
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) {
      return;
    }
    setIsDragging(true);
    const rect = chatRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !chatRef.current) return;

      const newX = e.clientX - dragOffset.x - 320; // 320 es el ancho del chat
      const newY = e.clientY - dragOffset.y - 360; // 360 es la altura del chat

      setPosition({
        x: Math.max(-360, Math.min(newX, 0)),
        y: Math.max(-360, Math.min(newY, 0)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simular respuesta del bot después de un pequeño delay
    setTimeout(() => {
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: 'Estamos trabajando para esto, apenas tenga la información, te la comparto. Acá podrás preguntar temas relacionados a cualquier información de tu negocio.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition-colors"
        title="Abrir chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div
      ref={chatRef}
      className="fixed z-50 flex flex-col w-80 h-96 rounded-xl border border-gray-200 bg-white shadow-2xl"
      style={{
        right: `${Math.max(20, Math.min(position.x + 380, window.innerWidth - 320))}px`,
        bottom: `${Math.max(20, Math.min(position.y + 420, window.innerHeight - 360))}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between rounded-t-xl bg-brand-600 px-4 py-3 text-white cursor-grab active:cursor-grabbing"
        data-no-drag="false"
      >
        <div>
          <h3 className="font-semibold">Asistente Sports Act</h3>
          <p className="text-xs text-brand-100">Estamos para ayudarte</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-brand-700 rounded-md p-1 transition-colors"
          data-no-drag="true"
          title="Minimizar"
        >
          <Minus size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="text-sm text-gray-500">
              <MessageCircle size={32} className="mx-auto mb-2 text-gray-400" />
              <p>¡Hola! Pregúntame sobre tu negocio</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                    message.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-3 rounded-b-xl" data-no-drag="true">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu pregunta..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="flex items-center justify-center rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
