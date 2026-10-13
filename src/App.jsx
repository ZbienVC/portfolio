import { lazy, Suspense } from 'react';
import { canUseHub, isEmbedded, resolveMode } from './mode.js';

// Each mode is its own chunk carrying its own stylesheet, so only one design
// system is ever live in a document. The chosen chunk starts downloading as
// soon as this module runs, before React renders.
const interactive = resolveMode() === 'interactive' && canUseHub();
// the basecamp window never nests the classic site inside itself
const embeddedWithoutWebGL = isEmbedded() && !interactive;
const chunk = interactive
  ? import('./hub/InteractiveMode.jsx')
  : embeddedWithoutWebGL
    ? null
    : import('./classic/ClassicApp.tsx');
const Mode = chunk ? lazy(() => chunk) : NoWebGL;

function NoWebGL() {
  return (
    <p style={{ font: '15px/1.5 system-ui, sans-serif', padding: 24, color: '#8a7f72' }}>
      The 3D basecamp needs WebGL, which this browser has turned off.
    </p>
  );
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Mode />
    </Suspense>
  );
}
