import { REDUCED_MOTION, hasWebGL } from './journey/hooks.js';

// The classic site is home. The 3D basecamp lives in a window on it (loaded on
// request, in an iframe at `?3d&embed`), and `?3d` still opens it full page.
export function resolveMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has('3d') || params.has('embed') ? 'interactive' : 'classic';
}

// Running inside the classic site's basecamp window.
export const isEmbedded = () => new URLSearchParams(window.location.search).has('embed');

// A full-page 3D visit needs WebGL and a visitor who hasn't asked for less motion.
// (Inside the window, the visitor asked for it by clicking in, so WebGL is enough.)
export const canUseHub = () => hasWebGL() && (isEmbedded() || !REDUCED_MOTION);

// Full-page switches reload, so only one design system's CSS is ever live.
export function switchMode(mode) {
  const url = new URL(window.location.href);
  url.search = mode === 'classic' ? '' : '?3d';
  url.hash = '';
  window.location.href = url.toString();
}
