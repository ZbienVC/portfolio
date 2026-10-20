import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFinePointer, useReducedMotionPref } from '../lib/hooks';
import { useTheme } from '../lib/theme';

/**
 * A laptop built as real boxes in CSS 3D, measured from its width so the parts
 * keep a laptop's proportions at any size: the lid is a slab with a screen on
 * the front, brushed aluminium on the back and edges all round; the deck is as
 * wide as the lid and about as deep as it is tall, with a recessed keyboard,
 * speaker grilles, a glass trackpad and a front lip. `open` (0 shut, 1 open)
 * swings the lid on its hinge and brings the view round from above to a slight
 * three-quarter front. A pointer over it tips the whole thing a few degrees.
 */

interface Geometry {
  W: number; // lid and deck width
  H: number; // lid height
  T: number; // lid thickness
  D: number; // deck depth
  Td: number; // deck thickness
  bx: number; // bezel at the sides
  bt: number; // bezel at the top
  bb: number; // bezel at the bottom
}

function geometry(W: number): Geometry {
  const bx = Math.max(6, W * 0.018);
  const bt = Math.max(8, W * 0.024);
  const bb = Math.max(7, W * 0.022);
  const innerH = (W - bx * 2) * 0.625; // a 16:10 screen
  const H = innerH + bt + bb;
  return { W, H, T: Math.max(3, W * 0.009), D: H * 0.97, Td: Math.max(5, W * 0.017), bx, bt, bb };
}

// keyboard rows as relative key widths: number row, three letter rows, then the space row
const ROWS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1, 1, 1, 1.25, 5.5, 1.25, 1, 1, 1, 1],
];

/**
 * The keyboard as one picture, drawn once per size and theme. Seventy shaded
 * key elements inside a moving 3D layer cost the browser a redraw each; one
 * image costs nothing to move.
 */
function keyboardImage(w: number, h: number, dark: boolean) {
  const k = Math.min(2, window.devicePixelRatio || 1) * 1.25;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * k));
  c.height = Math.max(1, Math.round(h * k));
  const g = c.getContext('2d');
  if (!g) return '';
  g.scale(k, k);
  const [hi, lo] = dark ? ['oklch(0.27 0.006 55)', 'oklch(0.17 0.005 55)'] : ['oklch(0.34 0.006 55)', 'oklch(0.22 0.005 55)'];
  const pad = w * 0.012;
  const gap = w * 0.0105;
  const rowH = (h - pad * 2 - gap * (ROWS.length - 1)) / ROWS.length;
  const r = Math.max(1.5, w * 0.005);
  ROWS.forEach((row, ri) => {
    const total = row.reduce((a, b) => a + b, 0);
    const unit = (w - pad * 2 - gap * (row.length - 1)) / total;
    let x = pad;
    const y = pad + ri * (rowH + gap);
    for (const kw of row) {
      const kwPx = kw * unit;
      const grad = g.createLinearGradient(0, y, 0, y + rowH);
      grad.addColorStop(0, hi);
      grad.addColorStop(0.55, lo);
      g.fillStyle = 'rgba(0,0,0,0.55)';
      g.beginPath();
      g.roundRect(x, y + 1, kwPx, rowH, r);
      g.fill();
      g.fillStyle = grad;
      g.beginPath();
      g.roundRect(x, y, kwPx, rowH, r);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.1)';
      g.fillRect(x + r, y + 0.5, kwPx - r * 2, 1);
      x += kwPx + gap;
    }
  });
  return c.toDataURL('image/png');
}

export function Laptop3D({ open, maxWidth, children }: { open: MotionValue<number>; maxWidth: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const g = geometry(W || 800);
  const { theme } = useTheme();
  // the keyboard well's size, rounded so small resizes reuse the same picture
  const kw = Math.round(g.W * 0.81);
  const kh = Math.round(g.D * 0.45);
  const keys = useMemo(() => (W ? keyboardImage(kw, kh, theme === 'dark') : ''), [W, kw, kh, theme]);

  // the pointer tips it a few degrees; springs keep it soft
  const fine = useFinePointer();
  const reduce = useReducedMotionPref();
  const px = useSpring(useMotionValue(0), { stiffness: 90, damping: 18 });
  const py = useSpring(useMotionValue(0), { stiffness: 90, damping: 18 });
  const onMove = (e: React.PointerEvent) => {
    if (!fine || reduce || e.pointerType !== 'mouse') return;
    const r = box.current!.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  // shut: lid flat on the deck, seen from above at an angle; open: lid up, tipped back, a slight three-quarter view
  const lid = useTransform(open, [0, 1], [-90, 13]);
  const tilt = useTransform(() => -66 + 57 * open.get() + py.get() * -4 * open.get());
  const yaw = useTransform(() => -22 + 15 * open.get() + px.get() * 7 * open.get());
  const lift = useTransform(open, [0, 1], [-g.H * 0.2, 0]);
  const screenOn = useTransform(open, [0.45, 0.85], [0, 1]);
  const lidShade = useTransform(open, [0, 0.55], [0.5, 0]);

  return (
    <div
      ref={box}
      className="lt relative mx-auto"
      style={{ width: maxWidth, height: g.H, marginTop: g.W * 0.05, marginBottom: g.W * 0.2, perspective: g.W * 3.4, perspectiveOrigin: '50% 80%' }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      role="group"
      aria-roledescription="laptop"
      aria-label="A laptop showing the selected project"
    >
      <motion.div className="absolute inset-0 [transform-style:preserve-3d] will-change-transform" style={{ rotateX: tilt, rotateY: yaw, y: lift }}>
        {/* ── the deck: a slab lying flat behind the hinge, its top face up ── */}
        <div
          className="lt-face"
          style={{ left: 0, top: g.H + g.T / 2, width: g.W, height: g.D, transformOrigin: '50% 0', transform: 'rotateX(90deg)' }}
          aria-hidden="true"
        >
          {/* the shadow it casts on the desk */}
          <div
            className="lt-face"
            style={{
              left: -g.W * 0.06,
              top: -g.D * 0.02,
              width: g.W * 1.12,
              height: g.D * 1.12,
              transform: `translateZ(${-g.Td - 2}px)`,
              background: 'radial-gradient(closest-side, var(--lt-shadow), transparent)',
            }}
          />
          {/* top face */}
          <div className="lt-face lt-alu" style={{ inset: 0, borderRadius: g.W * 0.014, boxShadow: 'inset 0 0 0 1px var(--lt-edge-lo)' }}>
            {/* speaker grilles either side of the keys */}
            <div className="lt-face lt-grille" style={{ left: '2.6%', top: '6%', width: '5.4%', height: '44%' }} />
            <div className="lt-face lt-grille" style={{ right: '2.6%', top: '6%', width: '5.4%', height: '44%' }} />
            {/* the keyboard, sunk into its well */}
            <div
              className="lt-face lt-well"
              style={{ left: '9.5%', right: '9.5%', top: '5.5%', height: '45%', borderRadius: g.W * 0.006, backgroundImage: keys ? `url(${keys})` : undefined, backgroundSize: '100% 100%' }}
            />
            {/* trackpad */}
            <div className="lt-face lt-pad" style={{ left: '50%', top: '57%', width: '38%', height: '36%', transform: 'translateX(-50%)', borderRadius: g.W * 0.01 }} />
          </div>
          {/* front edge, with the lip you open it by */}
          <div className="lt-face lt-edge" style={{ left: 0, top: g.D, width: g.W, height: g.Td, transformOrigin: '50% 0', transform: 'rotateX(-90deg)', borderRadius: `0 0 ${g.W * 0.01}px ${g.W * 0.01}px` }}>
            <div className="lt-face" style={{ left: '50%', top: 0, width: '13%', height: '46%', transform: 'translateX(-50%)', borderRadius: `0 0 ${g.W * 0.008}px ${g.W * 0.008}px`, background: 'var(--lt-edge-lo)' }} />
          </div>
          {/* side edges */}
          <div className="lt-face lt-edge" style={{ left: 0, top: 0, width: g.Td, height: g.D, transformOrigin: '0 50%', transform: 'rotateY(90deg)' }} />
          <div className="lt-face lt-edge" style={{ left: g.W - g.Td, top: 0, width: g.Td, height: g.D, transformOrigin: '100% 50%', transform: 'rotateY(-90deg)' }} />
        </div>

        {/* ── the lid: a slab hinged along its bottom edge ── */}
        <motion.div className="absolute inset-0 [transform-style:preserve-3d]" style={{ rotateX: lid, transformOrigin: '50% 100%' }}>
          {/* front: bezel, camera, screen, glass */}
          <div className="lt-face lt-bezel" style={{ inset: 0, borderRadius: g.W * 0.016, transform: `translateZ(${g.T / 2}px)` }}>
            <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[oklch(0.28_0.01_250)] shadow-[inset_0_0_0_1px_oklch(0.4_0.02_250)]" style={{ top: g.bt * 0.32, width: g.bt * 0.32, height: g.bt * 0.32 }} />
            <div className="absolute overflow-hidden bg-black" style={{ left: g.bx, right: g.bx, top: g.bt, bottom: g.bb, borderRadius: g.W * 0.004 }}>
              <motion.div className="absolute inset-0" style={{ opacity: screenOn }}>
                {children}
              </motion.div>
              <span className="lt-glare absolute inset-0" />
            </div>
            <motion.span className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: lidShade, borderRadius: g.W * 0.016 }} />
          </div>
          {/* back: brushed aluminium with the mark */}
          <div className="lt-face lt-alu grid place-items-center" style={{ inset: 0, borderRadius: g.W * 0.016, transform: `rotateY(180deg) translateZ(${g.T / 2}px)`, boxShadow: 'inset 0 0 0 1px var(--lt-edge-lo)' }} aria-hidden="true">
            <span
              className="grid place-items-center font-[760] tracking-[-0.04em]"
              style={{ width: g.W * 0.085, height: g.W * 0.085, fontSize: g.W * 0.03, color: 'var(--lt-mark)', textShadow: '0 1px 0 oklch(0 0 0 / 0.15)' }}
            >
              ZB
            </span>
          </div>
          {/* edges: top, sides, and the hinge along the bottom */}
          <div className="lt-face lt-edge" style={{ left: 0, top: -g.T / 2, width: g.W, height: g.T, transform: 'rotateX(90deg)' }} aria-hidden="true" />
          <div className="lt-face lt-edge" style={{ left: -g.T / 2, top: 0, width: g.T, height: g.H, transform: 'rotateY(90deg)' }} aria-hidden="true" />
          <div className="lt-face lt-edge" style={{ left: g.W - g.T / 2, top: 0, width: g.T, height: g.H, transform: 'rotateY(90deg)' }} aria-hidden="true" />
          <div
            className="lt-face"
            style={{ left: g.W * 0.08, top: g.H - g.T / 2, width: g.W * 0.84, height: g.T, transform: 'rotateX(90deg)', background: 'linear-gradient(to right, var(--lt-edge-lo), var(--lt-key) 12%, var(--lt-key) 88%, var(--lt-edge-lo))', borderRadius: g.T }}
            aria-hidden="true"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
