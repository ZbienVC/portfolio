import '@fontsource-variable/mona-sans/standard.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import './styles/classic.css';

import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { AskPanel } from './components/AskPanel';
import { CommandPalette, usePaletteShortcut } from './components/CommandPalette';
import { Icon } from './components/Icon';
import { InkDefs } from './components/Ink';
import { Nav } from './components/Nav';
import { ProjectSheet } from './components/ProjectSheet';
import { projectById, PROFILE } from './lib/data';
import { useCopy } from './lib/hooks';
import { fade, spring } from './lib/motion';
import { ShowWorkProvider, useShowWork } from './lib/show-work';
import { ThemeProvider } from './lib/theme';
import { applyTheme, initialTheme } from './lib/theme-dom';
import { Contact } from './sections/Contact';
import { DayJob } from './sections/DayJob';
import { Experience } from './sections/Experience';
import { Hero } from './sections/Hero';
import { Basecamp } from './sections/Basecamp';
import { OffTheClock } from './sections/OffTheClock';
import { Toolkit } from './sections/Toolkit';
import { Work, type WorkFilter } from './sections/Work';

// Theme before the first paint of this chunk, so dark-mode visitors never see a flash of paper.
applyTheme(initialTheme());

/** "#work/fieldsense" → "fieldsense", when it names a real project. */
const sheetFromHash = () => {
  const m = window.location.hash.match(/^#work\/([\w-]+)$/);
  return m && projectById(m[1]) ? m[1] : null;
};

export default function ClassicApp() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ShowWorkProvider>
          <Page />
        </ShowWorkProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}

interface SheetState {
  id: string;
  /** the project whose card opened the sheet: its screenshot is the shared element */
  shared: string | null;
}

function Page() {
  const [sheet, setSheet] = useState<SheetState | null>(() => {
    const id = sheetFromHash();
    return id ? { id, shared: null } : null;
  });
  const [palette, setPalette] = useState(false);
  const [ask, setAsk] = useState<{ question?: string } | null>(null);
  const [workFilter, setWorkFilter] = useState<WorkFilter>({ kind: 'category', id: 'all' });
  const { copy, copied } = useCopy();

  // the sheet lives in the URL: shareable, and the back button closes it
  useEffect(() => {
    const onPop = () => {
      const id = sheetFromHash();
      setSheet((s) => (id ? { id, shared: s?.shared ?? null } : null));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openProject = useCallback((id: string, fromCard = false) => {
    setSheet({ id, shared: fromCard ? id : null });
    // `pushed` marks an entry this page added, so closing can step back to it safely
    if (sheetFromHash() !== id) window.history.pushState({ sheet: id, pushed: true }, '', `${window.location.pathname}${window.location.search}#work/${id}`);
  }, []);
  const navigateSheet = useCallback((id: string) => {
    setSheet((s) => ({ id, shared: s?.shared ?? null }));
    window.history.replaceState({ ...(window.history.state ?? {}), sheet: id }, '', `${window.location.pathname}${window.location.search}#work/${id}`);
  }, []);
  const closeSheet = useCallback(() => {
    // only step back over an entry this page pushed; a deep link has nothing behind it but another site
    if (window.history.state?.pushed) window.history.back();
    else {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      setSheet(null);
    }
  }, []);

  const filterByTool = useCallback((toolId: string) => {
    setWorkFilter({ kind: 'tool', id: toolId });
    requestAnimationFrame(() =>
      document.getElementById('ledger')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }),
    );
  }, []);

  const openPalette = useCallback(() => setPalette(true), []);
  usePaletteShortcut(openPalette);

  return (
    <>
      <div id="page">
      <a
        href="#work"
        className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-md bg-ink px-4 py-2 text-sm font-[600] text-paper transition-transform focus:translate-y-0"
      >
        Skip to the work
      </a>

      <Nav onOpenPalette={openPalette} onOpenProject={(id) => openProject(id)} />

      <main id="main">
        <Hero onOpenProject={(id) => openProject(id)} />
        <Work filter={workFilter} onFilter={setWorkFilter} onOpenProject={openProject} />
        <DayJob />
        <Experience />
        <Toolkit onFilterTool={filterByTool} />
        <OffTheClock />
        <Basecamp />
      </main>

      <Contact onAsk={() => setAsk({})} />
      </div>

      <AnimatePresence>
        {sheet && <ProjectSheet key="sheet" id={sheet.id} sharedId={sheet.shared} onClose={closeSheet} onNavigate={navigateSheet} />}
      </AnimatePresence>
      <AnimatePresence>
        {palette && (
          <CommandPalette
            key="palette"
            onClose={() => setPalette(false)}
            onOpenProject={(id) => openProject(id)}
            onAsk={(question) => setAsk({ question })}
            onCopyEmail={() => copy(PROFILE.email)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{ask && <AskPanel key="ask" initial={ask.question} onClose={() => setAsk(null)} />}</AnimatePresence>

      <InkDefs />
      <ShowWorkBadge />
      <Toast show={copied}>Email address copied</Toast>
    </>
  );
}

/** While the notes are showing, a quiet way back out. */
function ShowWorkBadge() {
  const { on, set } = useShowWork();
  return (
    <AnimatePresence>
      {on && (
        <motion.div
          className="fixed bottom-4 left-1/2 z-[55] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-1.5 pr-1.5 pl-4 text-[13px] text-paper shadow-[var(--shadow-float)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ ...spring.crisp, opacity: fade }}
          role="status"
        >
          <Icon name="pencil" size={15} className="shrink-0 text-amber" />
          <span className="truncate">Showing the work: pencil notes on how each part is built</span>
          <button type="button" onClick={() => set(false)} className="shrink-0 rounded-full bg-paper/12 px-3 py-1 font-[560] hover:bg-paper/20">
            Hide <kbd className="ml-1 font-mono text-[11px] opacity-70">W</kbd>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toast({ show, children }: { show: boolean; children: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--nav-h)+12px)] z-[90] flex justify-center" aria-live="polite">
      <AnimatePresence>
        {show && (
          <motion.p
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13.5px] text-paper shadow-[var(--shadow-float)]"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ ...spring.stiff, opacity: fade }}
          >
            <Icon name="check" size={15} className="text-term-tick" />
            {children}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
