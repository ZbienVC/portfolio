import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { applyTheme, rememberTheme, type Theme } from './theme-dom';

interface ThemeApi {
  theme: Theme;
  /** Flip the theme; given an origin point, the new theme opens as a circle from it. */
  toggle: (origin?: { x: number; y: number }) => void;
}
const ThemeContext = createContext<ThemeApi | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) || 'light');

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark';
      const commit = () => {
        applyTheme(next);
        flushSync(() => setTheme(next));
        rememberTheme(next);
      };
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || reduce) {
        commit();
        return;
      }
      const root = document.documentElement;
      const x = origin?.x ?? window.innerWidth - 48;
      const y = origin?.y ?? 32;
      root.style.setProperty('--vt-x', `${x}px`);
      root.style.setProperty('--vt-y', `${y}px`);
      root.style.setProperty(
        '--vt-r',
        `${Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))}px`,
      );
      document.startViewTransition(commit);
    },
    [theme],
  );

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
