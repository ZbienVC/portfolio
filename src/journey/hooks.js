import { useEffect, useRef, useState } from 'react';

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// WebGL capability probe (cached).
let _webgl = null;
export function hasWebGL() {
  if (_webgl !== null) return _webgl;
  try {
    const c = document.createElement('canvas');
    _webgl = !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl'))
    );
  } catch {
    _webgl = false;
  }
  return _webgl;
}

export const REDUCED_MOTION = prefersReduced();

// Touch/pen device — no hover, so the instructions say "tap", not "click".
export const COARSE_POINTER =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(hover: none)').matches;

// Reveal on scroll — adds `.in` to any `.reveal` descendant as it enters view.
export function useReveal(deps = []) {
  const root = useRef(null);
  useEffect(() => {
    const scope = root.current || document;
    const els = scope.querySelectorAll('.reveal:not(.in)');
    if (prefersReduced()) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return root;
}

// Magnetic pointer lean for CTAs.
export function useMagnetic(strength = 0.32) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    let raf = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
      });
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      el.style.transform = 'translate(0,0)';
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', reset);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', reset);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return ref;
}

// Rotating typewriter for the hero role line.
export function useTypewriter(words, { type = 90, wait = 1700, del = 45 } = {}) {
  const [text, setText] = useState('');
  const [i, setI] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (prefersReduced()) {
      setText(words[0]);
      return;
    }
    const current = words[i % words.length];
    let to;
    if (!deleting && text.length < current.length) {
      to = setTimeout(() => setText(current.slice(0, text.length + 1)), type);
    } else if (!deleting && text.length === current.length) {
      to = setTimeout(() => setDeleting(true), wait);
    } else if (deleting && text.length > 0) {
      to = setTimeout(() => setText(text.slice(0, -1)), del);
    } else {
      setDeleting(false);
      setI((v) => (v + 1) % words.length);
    }
    return () => clearTimeout(to);
  }, [text, deleting, i, words, type, wait, del]);
  return text;
}
