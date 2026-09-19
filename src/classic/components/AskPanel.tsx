import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PROFILE } from '../lib/data';
import { restoreFocus, useInertPage, useMedia, useReducedMotionPref } from '../lib/hooks';
import { ease, fade, spring } from '../lib/motion';
import { cn } from '../lib/cn';
import { Icon } from './Icon';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING: Message = {
  role: 'assistant',
  content: "I'm an AI that has read Zach's projects and work history. Ask me what he built, how, or whether he'd fit a role you have in mind.",
};
const SUGGESTED = ['What did he automate at his current job?', 'How does FieldSense price a line?', 'Which projects use AI agents?', 'Is he open to new roles?'];

/**
 * The AI assistant (api/chat), dressed for this site: a side panel instead of a
 * floating bubble. It opens from ⌘K or the contact band, optionally with the
 * question already asked, and can hand off to a real message to Zach.
 */
export function AskPanel({ onClose, initial }: { onClose: () => void; initial?: string }) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'message'>('chat');
  const phone = useMedia('(max-width: 639px)');
  const reduce = useReducedMotionPref();
  const field = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const asked = useRef(false);
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  useInertPage();

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput('');
    const next: Message[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = res.ok ? await res.json() : null;
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: data?.content ?? `I can't reach my model right now. The fastest route is email: ${PROFILE.email}.`,
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: `The connection dropped. Try again, or email ${PROFILE.email}.` }]);
    } finally {
      setLoading(false);
    }
  };

  // a question typed into ⌘K arrives already asked
  useEffect(() => {
    if (initial && !asked.current) {
      asked.current = true;
      send(initial);
    }
    // send is stable enough for a one-shot on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  useEffect(() => {
    field.current?.focus({ preventScroll: true });
    // opened from the palette's "Ask" row, the opener is gone: land on the search button
    return () => restoreFocus(opener, '[data-palette-trigger]');
  }, [opener]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' });
  }, [messages, loading, reduce]);

  return (
    <div className="fixed inset-0 z-[75]" data-overlay-open="">
      <motion.div
        className="absolute inset-0 bg-[oklch(0.2_0.02_50/0.28)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Ask about Zach's work"
        className={cn(
          'absolute flex flex-col bg-paper shadow-[0_0_0_1px_var(--rule),var(--shadow-float)]',
          phone ? 'inset-x-0 top-[8vh] bottom-0 rounded-t-2xl' : 'top-3 right-3 bottom-3 w-[440px] rounded-xl',
        )}
        initial={phone ? { y: '100%' } : { x: 'calc(100% + 16px)' }}
        animate={phone ? { y: 0 } : { x: 0 }}
        exit={phone ? { y: '100%' } : { x: 'calc(100% + 16px)' }}
        transition={reduce ? { duration: 0.01 } : spring.sheet}
      >
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-rule px-4">
          <span className="grid size-7 place-items-center rounded-md bg-term text-term-amber">
            <Icon name="ask" size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[14.5px] font-[620] text-ink">{mode === 'chat' ? 'Ask about my work' : 'Send me a message'}</p>
            <p className="font-mono text-[11px] text-ink-3">{mode === 'chat' ? 'an AI, grounded in this site' : 'goes straight to my inbox'}</p>
          </div>
          <button type="button" className="icon-btn ml-auto" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {mode === 'chat' ? (
            <motion.div key="chat" className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
              <div className="flex-1 overflow-y-auto px-4 py-5" aria-live="polite">
                <ul className="grid gap-3">
                  {messages.map((m, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: ease.out }}
                      className={cn(
                        'max-w-[88%] rounded-xl px-3.5 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap',
                        m.role === 'user' ? 'ml-auto rounded-br-sm bg-ink text-paper' : 'rounded-bl-sm bg-paper-3 text-ink',
                      )}
                    >
                      {m.content}
                    </motion.li>
                  ))}
                  {loading && (
                    <li className="flex w-16 items-center gap-1 rounded-xl rounded-bl-sm bg-paper-3 px-3.5 py-3.5" aria-label="Thinking">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          className="size-1.5 rounded-full bg-ink-3"
                          animate={reduce ? undefined : { y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }}
                        />
                      ))}
                    </li>
                  )}
                </ul>
                {messages.length === 1 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {SUGGESTED.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full px-3 py-1.5 text-left text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_var(--rule-2)] transition-colors hover:bg-paper-3 hover:text-ink"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={bottom} />
              </div>
              <form
                className="shrink-0 border-t border-rule p-3"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <div className="flex items-end gap-2 rounded-lg bg-paper-2 p-1.5 shadow-[inset_0_0_0_1px_var(--rule-2)] focus-within:shadow-[inset_0_0_0_1px_var(--amber)]">
                  <label htmlFor="ask-input" className="sr-only">
                    Your question
                  </label>
                  <textarea
                    id="ask-input"
                    ref={field}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder="What would you like to know?"
                    className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[14.5px] text-ink outline-none [field-sizing:content] placeholder:text-ink-3"
                  />
                  <button type="submit" className="btn btn-sm btn-primary px-3" disabled={!input.trim() || loading} aria-label="Send">
                    <Icon name="arrowRight" size={16} />
                  </button>
                </div>
                <button type="button" onClick={() => setMode('message')} className="mt-2 flex items-center gap-1.5 px-1 text-[12.5px] font-[560] text-amber-ink">
                  <Icon name="mail" size={14} /> Rather talk to the real me? Send a message
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="message" className="flex-1 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
              <MessageForm conversation={messages.slice(1)} onBack={() => setMode('chat')} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
}

function MessageForm({ conversation, onBack }: { conversation: Message[]; onBack: () => void }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const valid = form.name.trim() && form.message.trim();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, conversation }),
      });
      setState(res.ok ? 'sent' : 'failed');
    } catch {
      setState('failed');
    }
  };

  if (state === 'sent') {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <span className="mx-auto grid size-10 place-items-center rounded-full bg-tick text-paper">
            <Icon name="check" />
          </span>
          <p className="mt-4 text-[17px] font-[640] text-ink">Sent. I&apos;ll get back to you.</p>
          <button type="button" onClick={onBack} className="text-link mt-3 text-[14px]">
            Back to the chat
          </button>
        </div>
      </div>
    );
  }

  const input = 'w-full rounded-md bg-paper-2 px-3 py-2.5 text-[14.5px] text-ink shadow-[inset_0_0_0_1px_var(--rule-2)] outline-none placeholder:text-ink-3 focus:shadow-[inset_0_0_0_1px_var(--amber)]';
  return (
    <form onSubmit={submit} className="grid gap-4 p-4">
      <div>
        <label htmlFor="m-name" className="label-type">
          Your name
        </label>
        <input id="m-name" required autoComplete="name" className={cn(input, 'mt-1.5')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label htmlFor="m-email" className="label-type">
          Your email, so I can reply
        </label>
        <input id="m-email" type="email" autoComplete="email" className={cn(input, 'mt-1.5')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div>
        <label htmlFor="m-msg" className="label-type">
          Message
        </label>
        <textarea id="m-msg" required rows={6} className={cn(input, 'mt-1.5 resize-y')} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </div>
      {conversation.length > 0 && <p className="text-[12.5px] text-ink-3">Your chat with the AI comes along, so you don&apos;t have to repeat yourself.</p>}
      {state === 'failed' && (
        <p className="text-[13.5px] text-fault" role="alert">
          That didn&apos;t send. Email me instead: {PROFILE.email}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={!valid || state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send it'}
        </button>
        <button type="button" onClick={onBack} className="btn btn-ghost">
          Back to the chat
        </button>
      </div>
    </form>
  );
}
