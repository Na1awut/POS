import { useState, useRef, useEffect } from 'react';
import { adminFetch } from '../api/adminClient';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'สวัสดีครับ! ☕ ผมคือ Coffee View AI ผู้ช่วยประจำร้านคาเฟ่ของคุณ\n\nถามผมได้เลยครับ เช่น:\n• สูตรเมนูใหม่ๆ\n• วิธีบริหารร้าน\n• คำถามเรื่องภาษี VAT\n• เทคนิคชงกาแฟ' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await adminFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          history: messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) !== 0), // skip greeting
        }),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ ไม่สามารถเชื่อมต่อ AI ได้ กรุณาตรวจสอบ GROQ_API_KEY' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110"
        title="เปิด AI Chatbot"
      >
        <span className="text-2xl">🤖</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '520px' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <div className="text-white font-bold text-sm">Coffee View AI</div>
            <div className="text-violet-200 text-xs">ผู้ช่วยประจำร้านคาเฟ่</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMessages([{ role: 'assistant', content: 'สวัสดีครับ! ☕ เริ่มบทสนทนาใหม่เลยครับ ถามอะไรก็ได้เลย!' }])}
            className="text-violet-200 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-white/10"
            title="เริ่มใหม่"
          >
            🔄
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-violet-200 hover:text-white transition-colors text-lg leading-none px-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-md'
                  : 'bg-white text-gray-700 border border-gray-200 shadow-sm rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-400 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm shadow-sm">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ถามอะไรก็ได้เลยครับ..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
          >
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}
