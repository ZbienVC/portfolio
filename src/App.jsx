import { lazy, Suspense } from 'react';
import { REDUCED_MOTION, hasWebGL } from './journey/hooks.js';
import HubExperience from './hub/HubExperience.jsx';
import ChatWidget from './ChatWidget.jsx';

// Classic = the original editorial site, loaded lazily so its stylesheet only
// ever enters the page in classic mode (mode switches reload the page).
const ClassicSite = lazy(() => import('./classic/ClassicSite.jsx'));

// 'interactive' (3D basecamp) | 'classic' (the original site).
// Priority: explicit URL param → remembered choice → default interactive.
function resolveMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('3d')) return 'interactive';
  if (params.has('classic') || params.has('flat')) return 'classic';
  const stored = localStorage.getItem('zb-mode');
  if (stored === 'classic' || stored === 'interactive') return stored;
  return 'interactive';
}

// switching modes reloads the page so only one design system's CSS is live.
// The explicit param makes the switch work even where localStorage is blocked;
// the stored value makes the choice stick for future visits.
export function switchMode(mode) {
  try { localStorage.setItem('zb-mode', mode); } catch {}
  const url = new URL(window.location.href);
  url.search = mode === 'classic' ? '?classic' : '?3d';
  window.location.href = url.toString();
}

function InteractiveChip() {
  return (
    <button
      onClick={() => switchMode('interactive')}
      style={{
        position: 'fixed', left: 20, bottom: 20, zIndex: 1000,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '11px 18px', borderRadius: 100, cursor: 'pointer',
        background: 'rgba(224,161,85,0.12)', border: '1px solid rgba(224,161,85,0.4)',
        color: '#e0a155', fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
      }}
      title="Explore the interactive 3D basecamp"
    >
      ✦ INTERACTIVE MODE
    </button>
  );
}

export default function App() {
  const canHub = hasWebGL() && !REDUCED_MOTION;
  const mode = resolveMode();
  const useHub = mode === 'interactive' && canHub;

  return (
    <>
      {useHub ? (
        <HubExperience onClassic={() => switchMode('classic')} />
      ) : (
        <Suspense fallback={null}>
          <ClassicSite />
          {canHub && <InteractiveChip />}
        </Suspense>
      )}
      <ChatWidget />
    </>
  );
}
