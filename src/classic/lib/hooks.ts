import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** Subscribe to a media query; SSR-safe default of `false`. */
export function useMedia(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

export const useReducedMotionPref = () => useMedia('(prefers-reduced-motion: reduce)');
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)');

/** True once the element has scrolled into view (latched). */
export function useInViewOnce<T extends Element>(rootMargin = '0px 0px -10% 0px') {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, seen]);
  return [ref, seen] as const;
}

/** The id of the section currently under the reading line (scroll spy). */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        // the first section (in page order) that crosses the reading line wins
        setActive(ids.find((id) => visible.get(id)) ?? null);
      },
      // a thin band a third of the way down the viewport is the "reading line"
      { rootMargin: '-33% 0px -66% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

/** Copy text; `copied` is true for a moment afterwards. */
export function useCopy(timeout = 1800) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // clipboard blocked (insecure context, permissions): fall back to a selection copy
        const ta = Object.assign(document.createElement('textarea'), { value: text });
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.append(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), timeout);
    },
    [timeout],
  );
  return { copied, copy };
}

/** Keyboard shortcut helper: ignores keys typed into fields. */
export function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName));
}

/*
 * While an overlay (sheet, palette, AI panel, phone menu) is open, the page
 * behind it is `inert`: no focus, no clicks, hidden from assistive tech. A
 * counter keeps it inert while overlays hand over to one another.
 *
 * It goes inert just after the overlay's first frame. `inert` restyles every
 * element on the page, and done inside the opening frame (then forced by the
 * overlay focusing its first field) it was most of the time an overlay took to
 * appear. The dialog is aria-modal from its first frame regardless.
 */
let inertCount = 0;
export function useInertPage(active = true) {
  useEffect(() => {
    if (!active) return;
    const page = document.getElementById('page');
    inertCount += 1;
    let timer = 0;
    const raf = requestAnimationFrame(() => {
      timer = window.setTimeout(() => inertCount > 0 && page?.setAttribute('inert', ''));
    });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      inertCount -= 1;
      if (inertCount === 0) page?.removeAttribute('inert');
    };
  }, [active]);
}

/**
 * Where focus goes when an overlay closes: back to whatever opened it, or, if
 * that's gone (an overlay that handed over and unmounted), to a fallback.
 */
export function restoreFocus(opener: HTMLElement | null, fallback?: string) {
  if (opener?.isConnected && opener !== document.body) {
    opener.focus({ preventScroll: true });
    return;
  }
  if (!fallback) return;
  // the first match that's actually on screen (the nav has desktop and phone versions)
  const el = [...document.querySelectorAll<HTMLElement>(fallback)].find((n) => n.getClientRects().length > 0);
  el?.focus({ preventScroll: true });
}

/** ⌘ on Apple keyboards, Ctrl everywhere else. */
export function modKey() {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent;
  return /mac|iphone|ipad|ipod/i.test(platform) ? '⌘' : 'Ctrl';
}
