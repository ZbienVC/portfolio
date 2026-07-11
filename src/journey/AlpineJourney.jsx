import { useEffect, useRef, useState, useMemo } from 'react';
import { getEngine, resolveLook } from './engine/index.js';
import ALPINE_WORLD from './worlds/alpine.js';
import { REDUCED_MOTION, hasWebGL, useTypewriter, useMagnetic } from './hooks.js';
import { PROFILE, HERO_STATS, WAYPOINTS } from '../content/portfolio.js';
import JourneyNav from './JourneyNav.jsx';

import AboutPanel from '../sections/AboutPanel.jsx';
import ProjectsPanel from '../sections/ProjectsPanel.jsx';
import ExperiencePanel from '../sections/ExperiencePanel.jsx';
import SkillsPanel from '../sections/SkillsPanel.jsx';
import LifePanel from '../sections/LifePanel.jsx';
import ContactPanel from '../sections/ContactPanel.jsx';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const PANELS = {
  about: AboutPanel,
  projects: ProjectsPanel,
  experience: ExperiencePanel,
  skills: SkillsPanel,
  life: LifePanel,
  contact: ContactPanel,
};

// Opacity for a waypoint panel given journey progress p and the waypoint center.
// Narrow windows leave visible "walking" between stations.
function windowOpacity(p, center, half = 0.055, flat = 0.016) {
  const d = Math.abs(p - center);
  if (d <= flat) return 1;
  if (d >= half) return 0;
  return 1 - (d - flat) / (half - flat);
}

function SummitHero({ onDescend }) {
  const role = useTypewriter(PROFILE.roles);
  const mag = useMagnetic(0.3);
  return (
    <div className="summit-hero">
      <div className="summit-inner">
        <div className="eyebrow summit-eyebrow">
          <span className="live-dot" /> {PROFILE.availability}
        </div>
        <h1 className="summit-name">
          <span className="line"><span className="rise">Zach</span></span>
          <span className="line"><span className="rise serif-italic d1">Bienstock</span></span>
        </h1>
        <div className="summit-role mono">
          <span className="slash">{'// '}</span>{role}<span className="caret" />
        </div>
        <p className="summit-tag">{PROFILE.tagline}</p>
        <div className="summit-stats">
          {HERO_STATS.map((s) => (
            <div key={s.label} className="stat">
              <div className="stat-num display">{s.num}</div>
              <div className="stat-label mono">{s.label}</div>
            </div>
          ))}
        </div>
        <button ref={mag} className="btn btn-primary summit-cta" onClick={onDescend}>Descend the trail ↓</button>
      </div>
      <div className="scroll-cue">
        <span className="mono">SCROLL TO WALK</span>
        <span className="cue-line" />
      </div>
    </div>
  );
}

export default function AlpineJourney() {
  const hostRef = useRef(null);
  const trackRef = useRef(null);
  const panelRefs = useRef({});
  const heroRef = useRef(null);
  const altRef = useRef(null);
  const railFillRef = useRef(null);
  const engineRef = useRef(null);
  const [active, setActive] = useState('summit');
  const [ready, setReady] = useState(false);

  const world = ALPINE_WORLD;
  const stations = useMemo(() => WAYPOINTS.filter((w) => w.id !== 'summit'), []);

  useEffect(() => {
    const { WorldRuntime, WorldLooks, ThreeWorldAdapter, CanvasWorldAdapter } = getEngine();
    if (!WorldRuntime) {
      // Engine failed to load — the parent will have rendered the fallback.
      return;
    }
    const reduce = REDUCED_MOTION;
    const useGL = hasWebGL();

    const host = hostRef.current;
    const canvas = document.createElement('canvas');
    canvas.className = 'journey-canvas';
    host.appendChild(canvas);

    const runtime = WorldRuntime(world, { reduce });
    const look = resolveLook(WorldLooks, world.lookPreset);

    let adapter;
    try {
      adapter = useGL
        ? ThreeWorldAdapter(canvas, world, runtime, look)
        : CanvasWorldAdapter(canvas, world, runtime, look);
    } catch (e) {
      // WebGL construction can fail even when probed OK — fall back to 2.5D.
      try {
        canvas.remove();
      } catch {}
      const c2 = document.createElement('canvas');
      c2.className = 'journey-canvas';
      host.appendChild(c2);
      adapter = CanvasWorldAdapter(c2, world, runtime, look);
    }
    engineRef.current = { runtime, adapter };

    const pace = world.travel.pace;
    const pointer = { x: 0.5, y: 0.5 };

    function setTrackHeight() {
      if (trackRef.current) {
        trackRef.current.style.height =
          Math.round(runtime.len / pace + window.innerHeight) + 'px';
      }
    }

    function size() {
      if (window.innerWidth > 0 && window.innerHeight > 0) {
        adapter.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
      }
      setTrackHeight();
    }

    let lastActive = 'summit';
    function paintOverlays(progress) {
      // hero
      const heroOp = progress < 0.05 ? 1 : clamp(1 - (progress - 0.05) / 0.06, 0, 1);
      if (heroRef.current) {
        heroRef.current.style.opacity = heroOp;
        heroRef.current.style.pointerEvents = heroOp > 0.5 ? 'auto' : 'none';
      }
      // station panels
      let best = 'summit';
      let bestOp = heroOp > 0.5 ? 1 : 0;
      for (const st of stations) {
        const op = windowOpacity(progress, st.t);
        const el = panelRefs.current[st.id];
        if (el) {
          el.style.opacity = op;
          el.style.transform = op > 0 ? `translateY(${(1 - op) * 26}px)` : 'translateY(26px)';
          el.style.pointerEvents = op > 0.5 ? 'auto' : 'none';
          el.classList.toggle('revealed', op > 0.5);
        }
        if (op > bestOp) { bestOp = op; best = st.id; }
      }
      if (best !== lastActive) {
        lastActive = best;
        setActive(best);
      }
      // altitude + descent rail
      const alt = Math.round(2842 + (720 - 2842) * progress);
      if (altRef.current) altRef.current.textContent = alt.toLocaleString() + ' m';
      if (railFillRef.current) railFillRef.current.style.height = (progress * 100).toFixed(1) + '%';
    }

    function frameStep(dt) {
      const target = window.scrollY * pace + 4;
      const frame = runtime.step(target, pointer, dt);
      adapter.render(frame);
      paintOverlays(frame.progress);
      return frame;
    }

    size();
    setReady(true);

    // Dev helper: ?at=<0..1> jumps the initial scroll to that journey progress.
    const atParam = parseFloat(new URLSearchParams(window.location.search).get('at'));
    if (!Number.isNaN(atParam)) {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      setTimeout(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.round(clamp(atParam, 0, 1) * scrollable));
      }, 250);
    }

    let raf = 0;
    let renderOnce = null;
    const onScroll = () => { if (renderOnce) renderOnce(); };
    const onPointer = (e) => {
      pointer.x = e.clientX / window.innerWidth;
      pointer.y = e.clientY / window.innerHeight;
    };

    if (reduce) {
      renderOnce = () => frameStep(1 / 60);
      window.addEventListener('scroll', renderOnce, { passive: true });
      for (let i = 0; i < 90; i++) frameStep(1 / 60); // settle the springs
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true });
      let t0 = performance.now();
      const loop = (now) => {
        const dt = Math.min((now - t0) / 1000, 0.05);
        t0 = now;
        frameStep(dt);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', size);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      document.removeEventListener('visibilitychange', size);
      window.removeEventListener('pointermove', onPointer);
      if (renderOnce) window.removeEventListener('scroll', renderOnce);
      try { adapter.dispose(); } catch {}
      if (host) host.innerHTML = '';
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jump to a waypoint by scrolling to its progress position.
  const jumpTo = (id) => {
    const wp = WAYPOINTS.find((w) => w.id === id);
    if (!wp) return;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const y = wp.t * scrollable;
    window.scrollTo({ top: y, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
  };

  return (
    <div className="journey-root">
      <div className="canvas-host" ref={hostRef} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <JourneyNav active={active} onJump={jumpTo} />

      {/* Descent HUD */}
      <div className={`hud${ready ? ' in' : ''}`} aria-hidden="true">
        <div className="hud-alt">
          <span className="hud-label mono">ALTITUDE</span>
          <span className="hud-value mono" ref={altRef}>2,842 m</span>
        </div>
        <div className="descent-rail">
          {WAYPOINTS.map((w) => (
            <span key={w.id} className="rail-tick" style={{ top: `${w.t * 100}%` }} />
          ))}
          <span className="rail-fill" ref={railFillRef} />
        </div>
      </div>

      {/* Summit hero overlay */}
      <div className="waypoint-hero" ref={heroRef}>
        <SummitHero onDescend={() => jumpTo('about')} />
      </div>

      {/* Station panels */}
      {stations.map((wp) => {
        const Panel = PANELS[wp.id];
        return (
          <section
            key={wp.id}
            id={wp.id}
            className="waypoint-panel"
            ref={(el) => (panelRefs.current[wp.id] = el)}
          >
            <div className="panel-card glass">
              <div className="panel-scroll">
                <Panel waypoint={wp} active={active === wp.id} />
              </div>
            </div>
          </section>
        );
      })}

      {/* The tall element that creates the scrollable range (drives the walk) */}
      <div className="track" ref={trackRef} aria-hidden="true" />
    </div>
  );
}
