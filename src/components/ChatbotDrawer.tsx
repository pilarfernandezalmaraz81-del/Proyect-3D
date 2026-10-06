import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../data/project3dData';
import { UserCheck, CheckCircle2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  needsHumanEscalation?: boolean;
}

interface ChatbotDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  lang: Language;
  onJumpToQuoter: () => void;
}

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="font-mono text-orange-400 bg-slate-900/80 px-1 py-0.5 rounded"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({
  isOpen,
  onToggle,
  lang,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text:
        lang === 'es'
          ? '¡Hola! Soy el asistente virtual de **Project 3D**. Estoy aquí para ayudarte con nuestras soluciones de fabricación industrial, dudas sobre materiales o cómo solicitar presupuestos. ¿En qué puedo orientarte hoy?'
          : 'Hello! I am the virtual assistant for **Project 3D**. I am here to help you with our industrial manufacturing solutions, material questions, or how to request quotes. How can I assist you today?',
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [escalationName, setEscalationName] = useState('');
  const [escalationContact, setEscalationContact] = useState('');
  const [escalationSubmitted, setEscalationSubmitted] = useState(false);

  const cbContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && cbContainerRef.current) {
      cbContainerRef.current.scrollTop = cbContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen, showEscalationForm]);

  const processBotResponse = (
    userText: string
  ): { reply: string; matched: boolean; escalate?: boolean } => {
    const lower = userText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (
      lower.includes('material') ||
      lower.includes('pla') ||
      lower.includes('abs') ||
      lower.includes('resina') ||
      lower.includes('petg') ||
      lower.includes('nylon') ||
      lower.includes('tpu')
    ) {
      return {
        matched: true,
        reply:
          lang === 'es'
            ? 'En Project 3D trabajamos con una amplia gama de materiales técnicos certificados: **PLA, PETG, ABS, TPU, Nylon y Resinas de alta definición**. Puedes seleccionarlos cómodamente en el Paso 2 de nuestra aplicación de presupuestos.'
            : 'At Project 3D we work with a full range of certified technical materials: **PLA, PETG, ABS, TPU, Nylon, and high-definition Resins**. You can easily select them in Step 2 of our quoting application.',
      };
    }

    if (
      lower.includes('stl') ||
      lower.includes('subir') ||
      lower.includes('archivo') ||
      lower.includes('step') ||
      lower.includes('obj')
    ) {
      return {
        matched: true,
        reply:
          lang === 'es'
            ? 'Para subir tu diseño, dirígete a nuestra sección de **Presupuesto**, arrastra tu archivo `.STL`, `.STEP` o `.OBJ` en la zona habilitada y el sistema validará la geometría de forma inmediata.'
            : 'To upload your design, head to our **Quoter** section, drag and drop your `.STL`, `.STEP`, or `.OBJ` file into the drop zone, and the system will validate its geometry immediately.',
      };
    }

    if (
      lower.includes('ubicacion') ||
      lower.includes('donde') ||
      lower.includes('torrijos') ||
      lower.includes('direccion') ||
      lower.includes('toledo')
    ) {
      return {
        matched: true,
        reply:
          lang === 'es'
            ? 'Nos encontramos en el corazón industrial de Toledo: **Avenida de los Trabajadores, Polígono Industrial de Torrijos, Torrijos, Toledo, España**.'
            : 'We are located in the industrial heart of Toledo: **Avenida de los Trabajadores, Polígono Industrial de Torrijos, Torrijos, Toledo, Spain**.',
      };
    }

    if (
      lower.includes('plazo') ||
      lower.includes('tiempo') ||
      lower.includes('entrega') ||
      lower.includes('envio')
    ) {
      return {
        matched: true,
        reply:
          lang === 'es'
            ? 'Los plazos de fabricación varían según la complejidad y el volumen del pedido, situándose habitualmente entre las 48 y 72 horas para series estándar desde nuestras instalaciones en Torrijos.'
            : 'Manufacturing lead times vary depending on part complexity and order volume, typically ranging between 48 and 72 hours for standard series from our Torrijos facility.',
      };
    }

    if (
      lower.includes('area') ||
      lower.includes('clientes') ||
      lower.includes('registro') ||
      lower.includes('pedido') ||
      lower.includes('factura')
    ) {
      return {
        matched: true,
        reply:
          lang === 'es'
            ? 'Nuestra **Área de Clientes** te permite registrarte de forma segura, ver el estado en tiempo real de tus pedidos a través de nuestros 8 estados de fabricación y descargar presupuestos o facturas.'
            : 'Our **Client Portal** lets you securely sign in, track the real-time status of your orders across all 8 manufacturing stages, and download quotes or invoices.',
      };
    }

    if (
      lower.includes('ingenier') ||
      lower.includes('humano') ||
      lower.includes('derivar') ||
      lower.includes('persona') ||
      lower.includes('si')
    ) {
      return {
        matched: true,
        escalate: true,
        reply:
          lang === 'es'
            ? 'Perfecto. Activo el formulario de derivación directa con nuestro **equipo técnico humano en Torrijos** para que un ingeniero revise tu proyecto:'
            : 'Understood. I am activating the direct handoff form to our **human engineering team in Torrijos** so an engineer can review your project:',
      };
    }

    return {
      matched: false,
      reply:
        lang === 'es'
          ? 'Entiendo perfectamente tu consulta sobre Project 3D. Para proporcionarte un detalle exacto adaptado a tu proyecto de fabricación, te recomiendo utilizar nuestro cotizador online o registrarte en el área de clientes. ¿Quieres que derive este caso con nuestro equipo técnico humano en Torrijos?'
          : 'I completely understand your inquiry about Project 3D. To provide an exact assessment tailored to your manufacturing project, I recommend using our online quoter or signing in to the client portal. Would you like me to escalate this case to our human technical team in Torrijos?',
    };
  };

  const handleUserSendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');

    const localResult = processBotResponse(text);
    if (localResult.matched) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            sender: 'bot',
            text: localResult.reply,
            needsHumanEscalation: localResult.escalate,
          },
        ]);
        if (localResult.escalate) {
          setShowEscalationForm(true);
        }
      }, 500);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          lang,
          history: updatedMessages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.reply) {
        throw new Error('Use standard reply');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          needsHumanEscalation: Boolean(data.needsHumanEscalation),
        },
      ]);
      if (data.needsHumanEscalation) {
        setShowEscalationForm(true);
      }
    } catch {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `b-fallback-${Date.now()}`,
            sender: 'bot',
            text: localResult.reply,
          },
        ]);
      }, 400);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationName.trim() || !escalationContact.trim()) return;
    setEscalationSubmitted(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `esc-${Date.now()}`,
        sender: 'bot',
        text:
          lang === 'es'
            ? `Solicitud derivada al equipo técnico de **Project 3D en Torrijos** para ${escalationName} (${escalationContact}). Un ingeniero te contactará en breve.`
            : `Request escalated to the **Project 3D Torrijos** engineering team for ${escalationName} (${escalationContact}). An engineer will contact you shortly.`,
      },
    ]);
  };

  return (
    /* 6. CHATBOT INFORMATIVO / ASISTENTE VIRTUAL AVANZADO (PROJECT 3D) */
    <div id="project3d-chatbot" className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Botón flotante para abrir/cerrar el chat */}
      <button
        id="cb-toggle-btn"
        type="button"
        onClick={onToggle}
        aria-label={lang === 'es' ? 'Abrir o cerrar Asistente Project 3D' : 'Toggle Project 3D Assistant'}
        className="bg-orange-600 hover:bg-orange-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 focus:outline-none border-2 border-orange-400 group relative"
      >
        <span className="absolute -top-2 -right-2 bg-emerald-500 w-4 h-4 rounded-full border-2 border-slate-950 animate-pulse" />
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {/* Ventana del Asistente */}
      <div
        id="cb-window"
        className={`${
          isOpen ? 'flex' : 'hidden'
        } absolute bottom-20 right-0 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex-col h-[500px]`}
      >
        {/* Cabecera del Chat */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-600/30 text-orange-400 font-bold flex items-center justify-center text-xs">
              3D
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {lang === 'es' ? 'Asistente Project 3D' : 'Project 3D Assistant'}
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>
                  {lang === 'es'
                    ? 'Online en Polígono Torrijos'
                    : 'Online at Torrijos Plant'}
                </span>
              </span>
            </div>
          </div>
          <button
            id="cb-close-btn"
            type="button"
            onClick={onToggle}
            aria-label={lang === 'es' ? 'Cerrar asistente' : 'Close assistant'}
            className="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo de Mensajes */}
        <div
          id="cb-messages-container"
          ref={cbContainerRef}
          className="flex-1 p-4 overflow-y-auto space-y-4 text-sm bg-slate-900/50"
        >
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  isBot ? '' : 'flex-row-reverse space-x-reverse'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg ${
                    isBot ? 'bg-orange-600' : 'bg-slate-700'
                  } text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md`}
                >
                  {isBot ? '3D' : lang === 'es' ? 'Tú' : 'You'}
                </div>
                <div
                  className={`${
                    isBot
                      ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                      : 'bg-orange-600 text-white rounded-tr-none'
                  } p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] shadow-sm`}
                >
                  {renderFormattedText(msg.text)}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">
                3D
              </div>
              <div className="bg-slate-800 text-slate-400 p-3.5 rounded-2xl rounded-tl-none text-xs border border-slate-700 shadow-sm">
                {lang === 'es' ? 'Procesando consulta...' : 'Processing inquiry...'}
              </div>
            </div>
          )}

          {showEscalationForm && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-orange-500/40 text-xs space-y-2.5">
              <div className="flex items-center justify-between text-orange-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'es'
                      ? 'Equipo Técnico Humano · Torrijos'
                      : 'Human Engineering Team · Torrijos'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowEscalationForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              {escalationSubmitted ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {lang === 'es'
                      ? 'Caso derivado al equipo técnico en Torrijos.'
                      : 'Case forwarded to Torrijos engineering team.'}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleEscalationSubmit} className="space-y-2">
                  <input
                    type="text"
                    required
                    value={escalationName}
                    onChange={(e) => setEscalationName(e.target.value)}
                    placeholder={lang === 'es' ? 'Tu nombre o empresa' : 'Your name or company'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="text"
                    required
                    value={escalationContact}
                    onChange={(e) => setEscalationContact(e.target.value)}
                    placeholder={lang === 'es' ? 'Email o teléfono de contacto' : 'Contact email or phone'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-1.5 rounded-lg text-xs transition-colors"
                  >
                    {lang === 'es' ? 'Derivar con Ingeniero' : 'Escalate to Engineer'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Sugerencias de Consultas Rápidas (FAQs) */}
        <div className="px-3 py-2.5 bg-slate-950/80 border-t border-slate-800 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <button
            type="button"
            onClick={() =>
              handleUserSendMessage(
                lang === 'es'
                  ? '¿Qué materiales utilizáis?'
                  : 'What materials do you use?'
              )
            }
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg whitespace-nowrap border border-slate-700 transition-colors"
          >
            {lang === 'es' ? '📦 Materiales' : '📦 Materials'}
          </button>
          <button
            type="button"
            onClick={() =>
              handleUserSendMessage(
                lang === 'es' ? '¿Cómo subo mi STL?' : 'How do I upload my STL?'
              )
            }
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg whitespace-nowrap border border-slate-700 transition-colors"
          >
            {lang === 'es' ? '⚙️ Subir STL' : '⚙️ Upload STL'}
          </button>
          <button
            type="button"
            onClick={() =>
              handleUserSendMessage(
                lang === 'es' ? '¿Dónde estáis ubicados?' : 'Where are you located?'
              )
            }
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg whitespace-nowrap border border-slate-700 transition-colors"
          >
            {lang === 'es' ? '📍 Ubicación' : '📍 Location'}
          </button>
          <button
            type="button"
            onClick={() =>
              handleUserSendMessage(
                lang === 'es' ? '¿Cuáles son los plazos?' : 'What are the lead times?'
              )
            }
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg whitespace-nowrap border border-slate-700 transition-colors"
          >
            {lang === 'es' ? '⏱️ Plazos' : '⏱️ Lead Times'}
          </button>
        </div>

        {/* Barra de Escritura de Mensajes */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            id="cb-user-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUserSendMessage(inputValue);
              }
            }}
            placeholder={
              lang === 'es'
                ? 'Escribe tu consulta en español...'
                : 'Type your inquiry in English or Spanish...'
            }
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
          />
          <button
            id="cb-send-btn"
            type="button"
            onClick={() => handleUserSendMessage(inputValue)}
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-orange-600/30"
          >
            {lang === 'es' ? 'Enviar' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
