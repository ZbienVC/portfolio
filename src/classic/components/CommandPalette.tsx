import { LayoutGroup, motion } from 'motion/react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { PROFILE, PROJECTS } from '../lib/data';
import { restoreFocus, useInertPage } from '../lib/hooks';
import { runPings } from '../lib/pings';
import { fade, spring } from '../lib/motion';
import { useShowWork } from '../lib/show-work';
import { useTheme } from '../lib/theme';
import { openBasecamp } from '../lib/basecamp';
import { cn } from '../lib/cn';
import { Icon, type IconName } from './Icon';

interface Item {
  id: string;
  group: 'Jump to' | 'Projects' | 'Do' | 'Ask';
  label: string;
  hint?: string;
  icon: IconName;
  keywords?: string;
  run: () => void;
}

interface PaletteProps {
  onClose: () => void;
  onOpenProject: (id: string) => void;
  onAsk: (question: string) => void;
  onCopyEmail: () => void;
}

const jump = (hash: string) => () => {
  const el = hash === '#top' ? document.body : document.querySelector(hash);
  el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  history.replaceState(history.state, '', hash === '#top' ? window.location.pathname + window.location.search : hash);
};

/** Score a query against text: prefix and word-start hits beat loose substrings. */
function score(q: string, text: string) {
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t.startsWith(q)) return 4;
  if (t.includes(` ${q}`)) return 3;
  if (t.includes(q)) return 2;
  // initials: "ss" → Splash Signal
  const initials = t
    .split(/[\s·/,&-]+/)
    .map((w) => w[0])
    .join('');
  return initials.includes(q) ? 1 : 0;
}

/**
 * ⌘K: jump anywhere, open any project, flip any switch, or hand the question
 * to the AI when nothing on the page matches it.
 */
export function CommandPalette({ onClose, onOpenProject, onAsk, onCopyEmail }: PaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  // an item that opens its own panel takes focus there; don't pull it back on close
  const chosen = useRef(false);
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  useInertPage();
  const { toggle: toggleTheme, theme } = useTheme();
  const { on: showing, toggle: toggleWork } = useShowWork();

  const items = useMemo<Item[]>(
    () => [
      { id: 'j-work', group: 'Jump to', label: 'Work', icon: 'arrowRight', run: jump('#work') },
      { id: 'j-ledger', group: 'Jump to', label: 'The whole ledger', hint: 'every project', icon: 'arrowRight', run: jump('#ledger') },
      { id: 'j-day', group: 'Jump to', label: 'The day job', hint: 'AP automation', icon: 'arrowRight', keywords: 'accounts payable quickbooks iif telecom finance', run: jump('#day-job') },
      { id: 'j-exp', group: 'Jump to', label: 'Experience', hint: 'Bloomberg, banking, Grapevine', icon: 'arrowRight', keywords: 'resume career jobs', run: jump('#experience') },
      { id: 'j-tools', group: 'Jump to', label: 'Toolkit', icon: 'arrowRight', keywords: 'skills stack', run: jump('#toolkit') },
      { id: 'j-life', group: 'Jump to', label: 'Off the clock', icon: 'arrowRight', keywords: 'photos life snowboarding', run: jump('#off-the-clock') },
      { id: 'j-contact', group: 'Jump to', label: 'Contact', icon: 'arrowRight', keywords: 'email hire', run: jump('#contact') },
      ...PROJECTS.map<Item>((p) => ({
        id: `p-${p.id}`,
        group: 'Projects',
        label: p.name,
        hint: p.kind,
        icon: 'external',
        keywords: `${p.tagline} ${p.tags.join(' ')} ${p.collection?.map((s) => s.name).join(' ') ?? ''}`,
        run: () => onOpenProject(p.id),
      })),
      { id: 'd-email', group: 'Do', label: 'Copy my email address', hint: PROFILE.email, icon: 'copy', keywords: 'contact mail', run: onCopyEmail },
      { id: 'd-mail', group: 'Do', label: 'Write me an email', icon: 'mail', keywords: 'contact', run: () => (window.location.href = `mailto:${PROFILE.email}`) },
      { id: 'd-cv', group: 'Do', label: 'Open the résumé', hint: 'building with AI', icon: 'file', keywords: 'resume cv pdf', run: () => window.open(PROFILE.resumePdfNamed, '_blank', 'noopener') },
      { id: 'd-cv2', group: 'Do', label: 'Open the finance résumé', icon: 'file', keywords: 'resume cv pdf', run: () => window.open(PROFILE.resumePdf, '_blank', 'noopener') },
      { id: 'd-work', group: 'Do', label: showing ? 'Hide the work' : 'Show the work', hint: 'W', icon: 'pencil', keywords: 'annotations how built notes', run: toggleWork },
      { id: 'd-theme', group: 'Do', label: theme === 'dark' ? 'Switch to daylight' : 'Switch to after hours', icon: theme === 'dark' ? 'sun' : 'moon', keywords: 'theme dark light mode', run: () => toggleTheme() },
      { id: 'd-ping', group: 'Do', label: 'Check every site again', icon: 'refresh', keywords: 'status ping live', run: () => { jump('#top')(); runPings(); } },
      { id: 'd-3d', group: 'Do', label: 'Walk the 3D basecamp', icon: 'cube', keywords: 'interactive three webgl mode fox', run: openBasecamp },
      { id: 'd-src', group: 'Do', label: 'Read this site’s source', icon: 'github', keywords: 'code github', run: () => window.open('https://github.com/ZbienVC/portfolio', '_blank', 'noopener') },
    ],
    [onOpenProject, onCopyEmail, showing, toggleWork, theme, toggleTheme],
  );

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    const scored = items
      .map((it) => ({ it, s: Math.max(score(q, it.label), score(q, it.keywords ?? '') * 0.8, score(q, it.hint ?? '') * 0.6) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.it);
    const ask: Item[] = q.length > 2 ? [{ id: 'ask', group: 'Ask', label: `Ask my AI: “${query.trim()}”`, icon: 'ask', run: () => onAsk(query.trim()) }] : [];
    // keep group order stable while the query shuffles rows inside each group
    const order = ['Jump to', 'Projects', 'Do'];
    const grouped = q ? scored : order.flatMap((g) => scored.filter((r) => r.group === g));
    return scored.length ? [...grouped, ...ask] : ask;
  }, [items, q, query, onAsk]);

  const safeActive = Math.min(active, Math.max(0, results.length - 1));
  const current = results[safeActive];

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
    return () => {
      if (!chosen.current) restoreFocus(opener, '[data-palette-trigger], [data-menu-trigger]');
    };
  }, [opener]);

  // keep the highlighted row in view as the arrows move it (not on open: row 0 is already there)
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) {
      moved.current = true;
      return;
    }
    list.current?.querySelector(`[data-index="${safeActive}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [safeActive]);

  const choose = (it: Item | undefined) => {
    if (!it) return;
    chosen.current = true;
    onClose();
    // let the palette close before a jump or a sheet takes the screen
    requestAnimationFrame(() => it.run());
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(current);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[80] grid items-start justify-items-center px-4 pt-[min(18vh,140px)]" data-overlay-open="">
      <motion.div
        className="absolute inset-0 bg-[oklch(0.2_0.02_50/0.3)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Search and jump"
        className="relative w-full max-w-[640px] overflow-hidden rounded-xl bg-paper shadow-[0_0_0_1px_var(--rule-2),var(--shadow-float)]"
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
        transition={{ ...spring.crisp, opacity: fade }}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-rule px-4">
          <Icon name="search" className="shrink-0 text-ink-3" />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Jump to a section, open a project, or ask a question"
            className="h-14 w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-3"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={current ? `${listId}-${current.id}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="kbd shrink-0">esc</kbd>
        </div>

        <LayoutGroup id="palette">
          <ul ref={list} id={listId} role="listbox" className="max-h-[min(60vh,420px)] overflow-y-auto p-2" aria-label="Results">
            {results.map((it, i) => {
              const header = it.group !== lastGroup ? it.group : null;
              lastGroup = it.group;
              return (
                <Row key={it.id} header={header}>
                  <li
                    id={`${listId}-${it.id}`}
                    role="option"
                    aria-selected={i === safeActive}
                    data-index={i}
                    onPointerMove={() => setActive(i)}
                    onClick={() => choose(it)}
                    className="relative flex h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-[14.5px]"
                  >
                    {i === safeActive && (
                      <motion.span layoutId="palette-active" transition={spring.crisp} className="absolute inset-0 rounded-lg bg-paper-3" aria-hidden="true" />
                    )}
                    <Icon name={it.icon} size={16} className={cn('relative shrink-0', i === safeActive ? 'text-amber-ink' : 'text-ink-3')} />
                    <span className="relative truncate text-ink">{it.label}</span>
                    {it.hint && <span className="relative ml-auto shrink-0 truncate font-mono text-[11.5px] text-ink-3">{it.hint}</span>}
                  </li>
                </Row>
              );
            })}
            {results.length === 0 && <li className="px-3 py-8 text-center text-[14px] text-ink-3">Type a little more and I&apos;ll ask the AI.</li>}
          </ul>
        </LayoutGroup>

        <div className="flex items-center gap-4 border-t border-rule bg-paper-2 px-4 py-2.5 font-mono text-[11px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd> move
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">↵</kbd> open
          </span>
          <span className="ml-auto">
            {results.length} result{results.length === 1 ? '' : 's'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ header, children }: { header: string | null; children: ReactNode }) {
  return (
    <>
      {header && (
        <li role="presentation" className="label-type px-3 pt-3 pb-1.5 first:pt-1">
          {header}
        </li>
      )}
      {children}
    </>
  );
}

// the keyboard shortcut lives with the component that opens it
// eslint-disable-next-line react-refresh/only-export-components
export function usePaletteShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName);
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        if (document.querySelector('[data-overlay-open]') && !(e.metaKey || e.ctrlKey)) return;
        e.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
}

