/* WorldAnatomy — canonical quadruped skeleton + per-family anatomy DATA + FK.
 *
 * ARCHITECTURE.md §6.2: anatomy is a DATA CONTRACT shared by every renderer.
 * Joints are PLACED (directed offsets from the hip→paw chord in the sagittal
 * plane) — never solved by IK, so limbs bow the species' way by construction
 * in every gait phase (PLAYBOOK anatomy law; no spider legs).
 *
 * The FK output is a dictionary of POINT CHAINS in protagonist-local space
 * (x = travel axis, y = up, all in the sagittal plane; the near/far pair is
 * separated by lateral z stance width). The 3D adapter turns point chains
 * into bone cylinders; a 2.5D adapter draws the same points as strokes —
 * ONE anatomy, two paints.
 *
 * Canid data encodes: hind hip → STIFLE (bows FORWARD) → HOCK (bows
 * BACKWARD) → digitigrade paw; fore shoulder → ELBOW (bows BACKWARD) →
 * CARPUS (drifts forward) → paw. Zero dependencies; pure data + math.
 */
(function () {
  "use strict";
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---- the canonical family registry (additive; a feline adds its own entry) ----
  const FAMILIES = {
    canid: {
      // segment proportions relative to shoulder height = 1.0
      shoulderHeight: 1.0,
      body: { length: 1.35, chestDrop: 0.16, rumpDrop: 0.10, thickness: 0.42 },
      head: { neckLen: 0.42, neckPitch: 0.6, skull: 0.30, snout: 0.34, earLen: 0.26 },
      tail: { segments: 4, length: 0.95, droop: -0.25, thickness: 0.30 },
      limbs: {
        // directed-offset anatomy: j1/j2 fractions along the hip→paw chord,
        // bow = signed sagittal offset (+ = toward the head)
        hind: { hipX: -0.52, hipY: -0.06, j1t: 0.42, j1bow: +0.17, j2t: 0.78, j2bow: -0.15,
                upperR: 0.105, midR: 0.066, lowR: 0.044 },
        fore: { hipX: +0.48, hipY: -0.10, j1t: 0.42, j1bow: -0.13, j2t: 0.80, j2bow: +0.05,
                upperR: 0.09, midR: 0.06, lowR: 0.042 },
        stanceZ: 0.14,                    // lateral half-distance between limb pairs
      },
      gaitProfiles: {
        trot: {
          // diagonal pairs; phase offsets per limb key
          phase: { hindNear: 0, foreNear: Math.PI * 1.1, hindFar: Math.PI * 0.9, foreFar: -0.2 },
          stride: 0.42, lift: 0.30, bobAmp: 0.05, bobFreq: 2, headNod: 0.05,
          tailWave: 0.16,
          // FOOT-LOCK cadence (rad of gait per world unit travelled): chosen so
          // the planted foot's backward counter-swing ≈ body speed —
          // stride·cyclePerUnit·renderScale ≈ 1 — otherwise feet glide with
          // the body and the walk reads as a moonwalk (the #1 amateur tell).
          cyclePerUnit: 3.4,
        },
      },
    },
    // German Shepherd — a canid re-tuned: leggier/longer body, high withers +
    // low croup slope, more rear angulation, a long LOW saber tail, and a
    // reaching ground-covering trot (bigger stride). Set renderScale ~0.9 in the
    // world so it reads bigger than a fox AND strides longer (gaitK ∝ 1/stride).
    shepherd: {
      shoulderHeight: 1.0,
      body: { length: 1.5, chestDrop: 0.18, rumpDrop: 0.14, thickness: 0.44 },
      head: { neckLen: 0.5, neckPitch: 0.42, skull: 0.30, snout: 0.5, earLen: 0.34 },
      tail: { segments: 4, length: 1.0, droop: 0.35, thickness: 0.34 }, // droop +0.35 → tail hangs LOW
      limbs: {
        hind: { hipX: -0.52, hipY: -0.10, j1t: 0.42, j1bow: +0.20, j2t: 0.80, j2bow: -0.18,
                upperR: 0.10, midR: 0.062, lowR: 0.042 },   // more stifle/hock angulation, lower croup
        fore: { hipX: +0.50, hipY: -0.05, j1t: 0.42, j1bow: -0.11, j2t: 0.80, j2bow: +0.05,
                upperR: 0.095, midR: 0.06, lowR: 0.042 },    // high straight front (withers)
        stanceZ: 0.16,
      },
      gaitProfiles: {
        trot: {
          phase: { hindNear: 0, foreNear: Math.PI * 1.1, hindFar: Math.PI * 0.9, foreFar: -0.2 },
          stride: 0.5, lift: 0.26, bobAmp: 0.045, bobFreq: 2, headNod: 0.06,
          tailWave: 0.12,
          cyclePerUnit: 2.2,
        },
      },
    },
  };

  // one limb: hip + paw target → placed joint chain (sagittal plane).
  // FOOT-LOCK stance profile: during ground contact the paw sweeps back
  // LINEARLY (constant counter-velocity that the runtime's cadence matches
  // to body speed), then returns forward through the air with a smooth
  // lift — a sinusoid can never lock feet (its counter-velocity hits zero
  // at the stance edges and the feet skate).
  function limbChain(fam, kind, gaitPhase, phaseOff, run, reduce) {
    const L = fam.limbs[kind], G = fam.gaitProfiles.trot;
    const TAU = Math.PI * 2;
    const hip = { x: L.hipX * fam.body.length * 0.5 * 2, y: fam.shoulderHeight + L.hipY };
    let swing = 0, liftT = 0;
    if (!reduce && run > 0.001) {
      // stride length stays FULL whenever moving (foot-lock demands it —
      // cadence, not stride, carries speed); `engage` only fades the gait
      // in/out near standstill so feet settle instead of snapping
      const engage = Math.min(run * 2.5, 1);
      const ph = ((gaitPhase + phaseOff) % TAU + TAU) % TAU;
      if (ph < Math.PI) {                       // STANCE: linear back-sweep, planted
        swing = G.stride * (1 - 2 * (ph / Math.PI)) * engage;
        liftT = 0;
      } else {                                  // SWING: smooth forward return, lifted
        const u = (ph - Math.PI) / Math.PI;
        const sm = u * u * (3 - 2 * u);
        swing = G.stride * (-1 + 2 * sm) * engage;
        liftT = Math.sin(u * Math.PI) * G.lift * engage;
      }
    }
    const paw = { x: hip.x + swing, y: liftT };
    const j1 = { x: lerp(hip.x, paw.x, L.j1t) + L.j1bow, y: lerp(hip.y, paw.y, L.j1t * 0.95) };
    const j2 = { x: lerp(hip.x, paw.x, L.j2t) + L.j2bow, y: lerp(hip.y, paw.y, L.j2t) };
    return { points: [hip, j1, j2, paw], radii: [L.upperR, L.midR, L.lowR], pawH: clamp(liftT / (G.lift || 1), 0, 1) };
  }

  /* pose(familyId, gaitPhase, run, t, reduce) → the canonical pose dict.
   * All values in protagonist-local units (shoulder height = 1), facing +x. */
  function pose(familyId, gaitPhase, run, t, reduce) {
    const fam = FAMILIES[familyId];
    const G = fam.gaitProfiles.trot;
    const bob = reduce ? 0 : Math.sin(gaitPhase * G.bobFreq) * G.bobAmp * run;
    const breath = reduce ? 0 : Math.sin(t * 1.8) * 0.02 * (1 - run);
    const limbs = {
      hindNear: limbChain(fam, "hind", gaitPhase, G.phase.hindNear, run, reduce),
      foreNear: limbChain(fam, "fore", gaitPhase, G.phase.foreNear, run, reduce),
      hindFar: limbChain(fam, "hind", gaitPhase, G.phase.hindFar, run, reduce),
      foreFar: limbChain(fam, "fore", gaitPhase, G.phase.foreFar, run, reduce),
    };
    const tailBase = { x: -fam.body.length * 0.52, y: fam.shoulderHeight + 0.02 + bob };
    const wave = reduce ? 0 : Math.sin(gaitPhase * 1.1 + 1) * G.tailWave * run + Math.sin(t * 1.7) * 0.06;
    const tail = [];
    for (let i = 0; i <= fam.tail.segments; i++) {
      const u = i / fam.tail.segments;
      tail.push({
        x: tailBase.x - u * fam.tail.length * Math.cos(fam.tail.droop),
        y: tailBase.y - u * fam.tail.length * Math.sin(fam.tail.droop) + Math.sin(u * 2.2) * 0.1 + wave * u * u,
      });
    }
    const nod = reduce ? 0 : Math.sin(gaitPhase * 2 + 0.8) * G.headNod * run;
    const neckRoot = { x: fam.body.length * 0.46, y: fam.shoulderHeight + 0.12 + bob };
    const headC = { x: neckRoot.x + fam.head.neckLen * 0.8, y: neckRoot.y + fam.head.neckLen * fam.head.neckPitch + nod };
    return { fam, limbs, tail, neckRoot, headC, bob, breath, stanceZ: fam.limbs.stanceZ };
  }

  window.WorldAnatomy = { FAMILIES, pose };
})();
