import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isTypingTarget } from './hooks';

/**
 * "Show the work": a page-wide switch that lays pencil notes over the site,
 * explaining how each piece is built. Off by default; `W` toggles it, and a
 * `?work` link opens the page with it on.
 */
interface ShowWorkApi {
  on: boolean;
  toggle: () => void;
  set: (on: boolean) => void;
}
const ShowWorkContext = createContext<ShowWorkApi>({ on: false, toggle: () => {}, set: () => {} });

const fromUrl = () => new URLSearchParams(window.location.search).has('work');

function writeUrl(on: boolean) {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  params.delete('work');
  // keep the switch shareable as a bare flag: ?work
  const query = [params.toString(), on ? 'work' : ''].filter(Boolean).join('&').replace(/=(&|$)/g, '$1');
  window.history.replaceState(window.history.state, '', `${url.pathname}${query ? `?${query}` : ''}${url.hash}`);
}

export function ShowWorkProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(fromUrl);

  // <html data-show-work> lets CSS dim or reveal things without a re-render
  useEffect(() => {
    document.documentElement.toggleAttribute('data-show-work', on);
  }, [on]);

  const set = useCallback((next: boolean) => {
    setOn(next);
    writeUrl(next);
  }, []);
  const toggle = useCallback(() => set(!document.documentElement.hasAttribute('data-show-work')), [set]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'w' || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector('[data-overlay-open]')) return; // an open dialog owns the keyboard
      toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  const value = useMemo(() => ({ on, toggle, set }), [on, toggle, set]);
  return <ShowWorkContext.Provider value={value}>{children}</ShowWorkContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useShowWork = () => useContext(ShowWorkContext);
