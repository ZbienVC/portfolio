/** Theme plumbing that runs outside React (before the first paint, too). */
export type Theme = 'light' | 'dark';
const KEY = 'zb-theme';
const PAPER: Record<Theme, string> = { light: '#fcfbf9', dark: '#110e0b' };

export function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // storage blocked: follow the system
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PAPER[theme]);
}

export function rememberTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // not remembered, still applied
  }
}
