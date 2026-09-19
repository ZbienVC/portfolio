import { motion } from 'motion/react';
import { GradientCanvas } from '../components/GradientCanvas';
import { HoverArrow, Icon } from '../components/Icon';
import { Ink, InkNote } from '../components/Ink';
import { LiveBoard } from '../components/LiveBoard';
import { LIVE_COUNT, PROFILE } from '../lib/data';
import { ease } from '../lib/motion';
import { useTheme } from '../lib/theme';
import type { ShaderGradientOptions } from '../engines/shader-gradient.js';

// The gradient re-glazed for this page: oxblood where the silk pools, vermilion
// on the slopes, terminal amber breaking to gold over the crests.
const GLAZE: ShaderGradientOptions = {
  colors: ['#4a1116', '#d8432a', '#ffb347'],
  form: 'silk',
  speed: 0.22,
  strength: 1.05,
  frequency: 0.78,
  density: 1.35,
  gloss: 0.78,
  light: 128,
  tilt: 44,
  zoom: 0.96,
  grain: 0.045,
  pointer: 0.45,
  seed: 7,
};

// Hero text is visible from the very first frame (it's the LCP): entrances move it, never hide it.
const rise = (delay: number, distance = 10) => ({
  initial: { y: distance },
  animate: { y: 0 },
  transition: { duration: 0.8, ease: ease.out, delay },
});

export function Hero({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const { theme } = useTheme();
  const glaze = { ...GLAZE, ground: theme === 'dark' ? '#160c0a' : '#2a0d0f' };
  const words = PROFILE.headline.replace(/\.$/, '').split(' ');
  const split = 3; // "I build the" / "systems the work runs on."

  return (
    <section id="top" className="hero relative isolate overflow-hidden pt-[calc(var(--nav-h)+clamp(40px,7vw,96px))] pb-[clamp(72px,9vw,120px)]">
      <div className="guides" aria-hidden="true" />

      {/* the glaze: a skewed slab behind the board, Stripe's move in this page's heat */}
      <div className="hero-glaze">
        <GradientCanvas options={glaze} className="size-full" />
        <InkNote
          id="glaze"
          className="top-4 right-[4%] max-lg:hidden"
          note="A WebGL shader I wrote for Atelier: one draw call, a sheet of simplex-noise folds lit like silk. No WebGL? You get a CSS still in the same colors."
          spec="16,261 vertices · 1 draw call · 0 dependencies"
        />
      </div>

      <div className="container-x relative grid items-start gap-x-8 gap-y-14 lg:grid-cols-12 [&>*]:min-w-0">
        <div className="lg:col-span-6 lg:pt-4">
          <Ink
            id="headline"
            type="bracket"
            side="left"
            pen="red"
            target="box"
            place="above"
            noteClassName="!bottom-[calc(100%+26px)] !left-0 !max-w-[420px]"
            note="Mona Sans at 116% width and weight 720: wide like a statement header, tight like a ledger. GitHub's typeface, since that's where the work lives."
            spec="font-stretch: 116%; letter-spacing: -0.038em"
          >
          <motion.p className="label-type flex items-center gap-2.5" {...rise(0, 6)}>
            <span className="dot" data-state="up" aria-hidden="true" />
            {PROFILE.location} · open to the right role
          </motion.p>

            <h1 className="display-type mt-6 max-w-[11ch] text-ink">
              <span className="sr-only">{PROFILE.headline}</span>
              <span aria-hidden="true">
                {[words.slice(0, split), words.slice(split)].map((group, i) => (
                  <motion.span key={i} className="block" {...rise(0.04 + i * 0.08, 14)}>
                    {group.join(' ')}
                    {i === 1 && <span className="text-amber">.</span>}
                  </motion.span>
                ))}
              </span>
            </h1>
          </Ink>

          <motion.p className="lede mt-7 max-w-[34rem]" {...rise(0.18)}>
            Finance and operations by training, builder by habit. By day I run the books for two telecom companies, and I wrote
            the automation that now does most of the filing. On my own time I've shipped{' '}
            <strong className="font-[620] text-ink">{LIVE_COUNT} sites and products</strong>, from AI agents to a 20-player boat racer.
            The status board is checking on every one of them, from your browser, right now.
          </motion.p>

          <motion.div className="mt-9 flex flex-wrap items-center gap-3" {...rise(0.26)}>
            <a href="#work" className="btn btn-primary">
              See the work
              <HoverArrow />
            </a>
            <a href={PROFILE.resumePdfNamed} target="_blank" rel="noopener" className="btn btn-quiet">
              <Icon name="file" size={16} />
              Résumé
            </a>
          </motion.div>

          <p className="label-type mt-12 max-w-[29rem] leading-relaxed">
            Before this: surveillance data at Bloomberg LP, $25M to $1B raises at Cambridge Wilkinson, savings models at Grapevine.
          </p>
        </div>

        <motion.div
          className="lg:col-span-6 lg:col-start-7"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: ease.out, delay: 0.25 }}
        >
          <LiveBoard onOpenProject={onOpenProject} />
        </motion.div>
      </div>
    </section>
  );
}
