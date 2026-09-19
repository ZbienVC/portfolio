import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { HoverArrow, Icon } from '../components/Icon';
import { Ink } from '../components/Ink';
import { SectionHead } from '../components/SectionHead';
import { canDrawBasecamp, onOpenBasecamp } from '../lib/basecamp';
import { ease, fade } from '../lib/motion';
import { cn } from '../lib/cn';

/**
 * The 3D mode, in a window. It's the same content as the rest of the page, as a
 * place: a React Three Fiber basecamp where a fox walks you between landmarks.
 * It stays shut until asked (it's ~1.5 MB of three.js), then runs in an iframe
 * so its own stylesheet and WebGL context never touch this page.
 */
// The scene lays itself out for a desktop screen, so on wide windows it renders
// at this width and is scaled down to fit: the whole basecamp, in miniature.
const VIRTUAL_WIDTH = 1440;

export function Basecamp() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [noWebGL, setNoWebGL] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const door = useRef<HTMLButtonElement>(null);
  const [fit, setFit] = useState({ scale: 1, w: 0, h: 0 });

  // no WebGL, no 1.5 MB download: say so in the window instead
  const walkIn = () => (canDrawBasecamp() ? setOpen(true) : setNoWebGL(true));
  useEffect(() => onOpenBasecamp(() => (canDrawBasecamp() ? setOpen(true) : setNoWebGL(true))), []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      // phones keep the scene's own small-screen layout
      const scale = width >= 700 ? Math.min(1, width / VIRTUAL_WIDTH) : 1;
      setFit({ scale, w: width / scale, h: height / scale });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const close = () => {
    setOpen(false);
    setReady(false);
    // the close button goes with the scene; focus returns to the door
    requestAnimationFrame(() => door.current?.focus({ preventScroll: true }));
  };
  const fullscreen = () => {
    const el = frame.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => window.location.assign('/?3d'));
    else window.location.assign('/?3d');
  };

  return (
    <section id="basecamp" aria-labelledby="basecamp-title" className="section-y relative">
      <div className="guides" aria-hidden="true" />
      <div className="container-x relative">
        <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-12 [&>*]:min-w-0">
          <SectionHead
            id="basecamp-title"
            className="lg:col-span-7"
            label="The other version"
            title="Same site, as a place."
            lede="A 3D basecamp I built with React Three Fiber. A fox walks you between landmarks: the cabin, the monoliths, the cairn, the gear cache, the frozen lake and the signpost. Each one opens a part of this page."
          />
          <p className="font-mono text-[12px] leading-relaxed text-ink-3 lg:col-span-5 lg:pb-1.5">
            Click a landmark and the fox walks there. Drag to look around. It&apos;s about 1.5 MB, so it stays shut until you open it.
          </p>
        </div>

        <Ink
          id="basecamp-window"
          type="bracket"
          side="left"
          pen="red"
          target="box"
          place="above"
          className="mt-12"
          noteClassName="!bottom-[calc(100%+14px)] !left-auto !right-0 !max-w-[360px] text-right"
          note="Its own document in an iframe: three.js, its stylesheet and its WebGL context load only when you walk in, and leave when you close it."
          spec="<iframe src='/?3d&embed'> · lazy · 0 bytes until asked"
        >
          <div className="overflow-hidden rounded-xl bg-term shadow-[0_0_0_1px_var(--term-rule),var(--shadow-float)]">
            <div className="flex h-11 items-center gap-3 border-b border-term-rule px-4 font-mono text-[11.5px] text-term-dim">
              <span className={cn('size-2 rounded-full', open ? 'bg-term-amber' : 'bg-term-rule')} aria-hidden="true" />
              <span className="text-term-ink">basecamp</span>
              <span className="hidden sm:inline">React Three Fiber · three.js</span>
              <span className="ml-auto flex items-center gap-1">
                {open && (
                  <button type="button" onClick={fullscreen} className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-term-2 hover:text-term-ink">
                    Full screen
                  </button>
                )}
                <a href="/?3d" className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-term-2 hover:text-term-ink">
                  Full page
                </a>
                {open && (
                  <button type="button" onClick={close} className="grid size-7 place-items-center rounded-md transition-colors hover:bg-term-2 hover:text-term-ink" aria-label="Close the basecamp">
                    <Icon name="close" size={15} />
                  </button>
                )}
              </span>
            </div>

            <div ref={stage} className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/9] sm:max-h-[78vh]">
              {open && fit.w > 0 && (
                <iframe
                  ref={frame}
                  src="/?3d&embed"
                  title="The 3D basecamp: this site as a walkable scene"
                  className="absolute top-0 left-0 origin-top-left border-0"
                  style={{ width: fit.w, height: fit.h, transform: fit.scale < 1 ? `scale(${fit.scale})` : undefined }}
                  allow="fullscreen"
                  allowFullScreen
                  onLoad={() => {
                    setReady(true);
                    frame.current?.focus({ preventScroll: true });
                  }}
                />
              )}
              <AnimatePresence>
                {!ready && (
                  <motion.div
                    key="poster"
                    className="absolute inset-0"
                    initial={false}
                    exit={{ opacity: 0, transition: { duration: 0.6, ease: ease.out } }}
                  >
                    <Poster state={noWebGL ? 'no-webgl' : open ? 'loading' : 'idle'} onOpen={walkIn} doorRef={door} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Ink>
      </div>
    </section>
  );
}

interface PosterProps {
  state: 'idle' | 'loading' | 'no-webgl';
  onOpen: () => void;
  doorRef: RefObject<HTMLButtonElement | null>;
}
function Poster({ state, onOpen, doorRef }: PosterProps) {
  return (
    <div className="group relative size-full overflow-hidden">
      <img
        src="/work/basecamp.webp"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out)] group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(8_6_4/0.72),rgb(8_6_4/0.15)_55%,rgb(8_6_4/0.3))]" />
      <div className="absolute inset-0 grid place-items-center p-6 text-center">
        <AnimatePresence mode="wait" initial={false}>
          {state === 'no-webgl' ? (
            <motion.p
              key="no-webgl"
              className="max-w-[27rem] rounded-lg bg-term/90 px-4 py-3 text-[14.5px] leading-relaxed text-term-ink"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={fade}
              role="status"
            >
              This browser isn&apos;t drawing WebGL, so the basecamp can&apos;t open here. Everything inside it is already on this page.
            </motion.p>
          ) : state === 'loading' ? (
            <motion.p
              key="waking"
              className="flex items-center gap-2.5 font-mono text-[13px] text-term-ink"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade}
              role="status"
            >
              <span className="dot" data-state="pending" aria-hidden="true" />
              Waking the basecamp…
            </motion.p>
          ) : (
            <motion.div key="door" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
              <button ref={doorRef} type="button" onClick={onOpen} className="btn bg-term-amber px-6 text-term shadow-[0_10px_30px_-10px_var(--term-amber)] hover:bg-[oklch(0.84_0.14_70)]">
                <Icon name="cube" size={17} />
                Walk in
                <HoverArrow />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
