import { useState, useRef, useEffect } from 'react';

const SUGGESTED = [
  "What projects has Zach built?",
  "What's his tech stack?",
  "Is he available for work?",
  "Tell me about DipperAI",
];

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px 14px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--accent)',
          animation: 'chatBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I'm Zach's AI — ask me anything about his work, projects, or skills. Or just say hi 👋" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Stop pulsing after first open
  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.filter(m => m.role !== 'system') }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content || 'Something went wrong — try again.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue — please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendContact = async () => {
    if (!contact.name || !contact.message) return;
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contact,
          conversation: messages.slice(1), // exclude greeting
        }),
      });
      setSent(true);
    } catch {
      setSent(true); // optimistic
    }
  };

  return (
    <>
      <style>{`
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(224,161,85,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(224,161,85,0); }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-widget-enter { animation: chatSlideUp 0.25s ease forwards; }
        .chat-msg-user { background: linear-gradient(135deg, var(--accent-bright), var(--accent-deep)); color: #fff; border-radius: 18px 18px 4px 18px; }
        .chat-msg-ai { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); color: #c4d0f5; border-radius: 18px 18px 18px 4px; }
        .chat-input:focus { outline: none; border-color: rgba(224,161,85,0.5) !important; }
        .chat-send:hover { background: rgba(224,161,85,0.25) !important; }
        .chat-suggest:hover { background: rgba(224,161,85,0.15) !important; border-color: rgba(224,161,85,0.4) !important; }
      `}</style>

      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: open ? 'rgba(22,19,26,0.95)' : 'linear-gradient(135deg, var(--accent-bright), var(--accent-deep))',
          border: open ? '1px solid rgba(224,161,85,0.3)' : 'none',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 24px rgba(224,161,85,0.4)',
          transition: 'all 0.2s ease',
          animation: pulse && !open ? 'chatPulse 2.5s ease-in-out infinite' : 'none',
          fontSize: 22,
        }}>
        {open ? '✕' : '💬'}
      </button>

      {/* Unread dot */}
      {!open && pulse && (
        <div style={{
          position: 'fixed', bottom: 72, right: 22, zIndex: 10000,
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--accent)', border: '2px solid var(--bg)',
        }} />
      )}

      {/* Chat window */}
      {open && (
        <div className="chat-widget-enter" style={{
          position: 'fixed', bottom: 92, right: 16,
          width: 'min(380px, calc(100vw - 32px))',
          maxHeight: 'min(580px, calc(100vh - 120px))',
          background: 'rgba(4,8,16,0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(224,161,85,0.08)',
          zIndex: 9998,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '16px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(224,161,85,0.04)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-bright), var(--accent-deep))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>ZB</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Zach's AI</div>
              <div style={{ fontSize: 11, color: 'var(--accent-bright)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                Online now
              </div>
            </div>
            <button onClick={() => setShowContact(s => !s)}
              style={{
                marginLeft: 'auto', padding: '6px 14px', borderRadius: 100,
                background: 'rgba(224,161,85,0.1)', border: '1px solid rgba(224,161,85,0.25)',
                color: 'var(--accent-bright)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
              {showContact ? 'Back to chat' : '✉ Message Zach'}
            </button>
          </div>

          {/* Contact form */}
          {showContact ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent-bright)', marginBottom: 8 }}>Message sent!</div>
                  <div style={{ color: '#6b7db3', fontSize: 13 }}>Zach will get back to you soon.</div>
                </div>
              ) : (
                <>
                  <p style={{ color: '#6b7db3', fontSize: 13, margin: 0 }}>
                    Drop a message — Zach gets it via email and SMS.
                  </p>
                  {[
                    { key: 'name', placeholder: 'Your name *', type: 'text' },
                    { key: 'email', placeholder: 'Your email (optional)', type: 'email' },
                  ].map(f => (
                    <input key={f.key} type={f.type} placeholder={f.placeholder}
                      value={contact[f.key]}
                      onChange={e => setContact(c => ({ ...c, [f.key]: e.target.value }))}
                      className="chat-input"
                      style={{
                        padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)', color: 'var(--ink)', fontSize: 13,
                        width: '100%', boxSizing: 'border-box',
                      }}
                    />
                  ))}
                  <textarea placeholder="Your message *" rows={4}
                    value={contact.message}
                    onChange={e => setContact(c => ({ ...c, message: e.target.value }))}
                    className="chat-input"
                    style={{
                      padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)', color: 'var(--ink)', fontSize: 13,
                      width: '100%', boxSizing: 'border-box', resize: 'vertical',
                    }}
                  />
                  <button onClick={sendContact}
                    disabled={!contact.name || !contact.message}
                    style={{
                      padding: '12px', borderRadius: 12, border: 'none',
                      background: contact.name && contact.message
                        ? 'linear-gradient(135deg, var(--accent-bright), var(--accent-deep))'
                        : 'rgba(255,255,255,0.06)',
                      color: contact.name && contact.message ? '#fff' : 'var(--ink-4)',
                      fontWeight: 700, fontSize: 14, cursor: contact.name && contact.message ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                    }}>
                    Send Message →
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div className={m.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}
                      style={{ maxWidth: '82%', padding: '10px 14px', fontSize: 13, lineHeight: 1.55 }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div className="chat-msg-ai"><TypingDots /></div>
                  </div>
                )}

                {/* Suggestions — show after greeting only */}
                {messages.length === 1 && !loading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    {SUGGESTED.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)} className="chat-suggest"
                        style={{
                          padding: '8px 12px', borderRadius: 10, textAlign: 'left',
                          background: 'rgba(224,161,85,0.06)', border: '1px solid rgba(224,161,85,0.2)',
                          color: '#8b9cc8', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '12px 14px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 8, alignItems: 'flex-end',
              }}>
                <input ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask anything about Zach's work..."
                  className="chat-input"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)', color: 'var(--ink)', fontSize: 13,
                  }}
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                  className="chat-send"
                  style={{
                    width: 38, height: 38, borderRadius: 10, border: 'none',
                    background: input.trim() && !loading ? 'rgba(224,161,85,0.15)' : 'rgba(255,255,255,0.04)',
                    color: input.trim() && !loading ? 'var(--accent-bright)' : 'var(--ink-4)',
                    fontSize: 16, cursor: input.trim() && !loading ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}>
                  ↑
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
