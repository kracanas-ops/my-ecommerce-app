import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Loader2, Send, Sparkles, X } from 'lucide-react';
import { spring } from './motion';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

/**
 * Sends a message to the AI shopping assistant backend and returns
 * { reply: string, citations: Array<{title, url}> }.
 */
async function fetchAIReply(message) {
  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'The assistant could not respond.');
  return data;
}

/** A single chat message bubble */
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
    >
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-violet-500/90 text-white shadow-[0_4px_20px_rgba(139,92,246,0.35)]'
            : 'glass-chat-bubble rounded-bl-md text-zinc-100'
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.text}</p>
        {msg.citations && msg.citations.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-white/10 pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Sources</p>
            {msg.citations.map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-100 hover:underline"
              >
                <ExternalLink size={10} className="shrink-0" />
                <span className="truncate">{c.title || c.url}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your AI shopping assistant — powered by live web search. Ask me about products, prices, reviews, or anything else! 🛍️",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const { reply, citations } = await fetchAIReply(text);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply, citations }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    /* Portal anchor — fixed to viewport bottom-right */
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass-chat-panel flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ ...spring, duration: 0.38 }}
            style={{ height: 'min(540px, 70vh)', transformOrigin: 'bottom right' }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-4">
              <motion.span
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-violet-500/30 text-violet-200 shadow-[0_0_18px_rgba(139,92,246,0.3)]"
                animate={{ boxShadow: ['0 0 18px rgba(139,92,246,0.3)', '0 0 28px rgba(139,92,246,0.55)', '0 0 18px rgba(139,92,246,0.3)'] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles size={16} />
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">AI Shopping Assistant</p>
                <p className="text-[10px] text-zinc-400">Live web search enabled</p>
              </div>
              <motion.button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                transition={spring}
                aria-label="Close chat"
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}

              {loading && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="glass-chat-bubble flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-zinc-400">
                    <Loader2 size={14} className="animate-spin text-violet-400" />
                    Thinking with live web search…
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.p
                  className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-xs text-red-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div className="shrink-0 border-t border-white/10 p-3">
              <div className="glass-pill flex items-end gap-2 rounded-2xl px-4 py-2.5">
                <textarea
                  ref={inputRef}
                  className="glass-search max-h-28 min-h-[1.5rem] flex-1 resize-none text-sm text-white placeholder:text-zinc-500"
                  rows={1}
                  placeholder="Ask about products, prices, reviews…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Message the shopping assistant"
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white shadow-[0_4px_16px_rgba(139,92,246,0.4)] disabled:opacity-40"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={spring}
                  aria-label="Send message"
                >
                  <Send size={14} />
                </motion.button>
              </div>
              <p className="mt-2 text-center text-[10px] text-zinc-600">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating trigger bubble ── */}
      <motion.button
        onClick={() => setOpen((prev) => !prev)}
        className="glass-ai-bubble relative flex h-14 w-14 items-center justify-center rounded-full text-white"
        whileHover={{ scale: 1.1, y: -3 }}
        whileTap={{ scale: 0.92 }}
        transition={spring}
        aria-label={open ? 'Close AI assistant' : 'Open AI shopping assistant'}
        aria-expanded={open}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Sparkles size={22} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!open && (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full border border-violet-400/50"
            animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.button>
    </div>
  );
}

