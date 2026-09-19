import type { Transition } from 'motion/react';

/**
 * One motion language for the whole page. The springs were tuned on Atelier's
 * spring bench (motion/spring-presets) and exported in Motion's physics form;
 * ζ is the damping ratio (1 = arrives without overshoot).
 *
 * - crisp  (ζ 0.95, settles ~0.4 s): UI state — the nav pill, tabs, the menu morph
 * - sheet  (ζ 0.9): panels that the hand can grab and throw
 * - stiff  (ζ 0.69, 5% overshoot): small things that should feel pressed
 * - gentle (ζ 0.64, 7% overshoot): the photo pile settling back
 *
 * Springs move transforms only; colour and opacity use plain eases.
 */
export const spring = {
  crisp: { type: 'spring', stiffness: 400, damping: 38, mass: 1 },
  sheet: { type: 'spring', stiffness: 300, damping: 31, mass: 1 },
  stiff: { type: 'spring', stiffness: 210, damping: 20, mass: 1 },
  gentle: { type: 'spring', stiffness: 120, damping: 14, mass: 1 },
} as const satisfies Record<string, Transition>;

export const ease = {
  out: [0.22, 1, 0.36, 1],
  snap: [0.2, 0.7, 0.2, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const fade = { duration: 0.18, ease: ease.snap } as const satisfies Transition;
