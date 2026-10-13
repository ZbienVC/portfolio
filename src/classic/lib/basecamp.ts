/** "Walk the 3D basecamp" from anywhere on the page: scroll to its window and open it. */
const EVENT = 'zb:basecamp-open';

export function openBasecamp() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('basecamp')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  window.dispatchEvent(new Event(EVENT));
}

export function onOpenBasecamp(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

let webgl: boolean | null = null;
/** Can this browser draw the scene at all? Probed once, on the first request, and the probe context is released. */
export function canDrawBasecamp() {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    webgl = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}
