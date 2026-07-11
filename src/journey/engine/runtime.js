/* WorldRuntime — deterministic, renderer-BLIND (ARCHITECTURE.md §0/§3).
 * Owns ALL layout, RNG, trigger evaluation, memory latching, travel pursuit
 * and gait phase; emits a pure-data Frame each step. Adapters only paint.
 *
 * Motion laws honored (living/worlds/PLAYBOOK.md):
 *  - one target value (scroll → travel target), dt-normalized smoothing
 *  - OVERSHOOT-FREE exponential pursuit (discrete facing reads the gap sign)
 *  - facing from destination gap with hysteresis; distance-driven gait
 *  - capped sprint + jump-cut beyond ~1.5 viewports of travel
 * Reduced-motion contract (§2.3): narrative motion (travel, latches) is
 * PRESERVED; ambient channels (breath/blink/gaze/fireflies/petals/sway)
 * are frozen; the host renders on scroll/resize only (no idle rAF).
 */
(function () {
  "use strict";
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ksm = (k, dt) => 1 - Math.pow(1 - k, dt * 60);
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function WorldRuntime(world, opts) {
    opts = opts || {};
    const reduce = !!opts.reduce;
    const LEN = world.travel.worldLen;

    // ---- deterministic layout (built once from the seed) ----
    const R = mulberry32(world.seed);
    const groundAt = (x) => {
      let y = 0;
      for (const t of world.terrain.terms) y += t.amp * Math.sin(x * t.freq + t.phase);
      return y;
    };
    const layerProfileAt = (layer, x) => {
      if (!layer.profile) return groundAt(x);
      let y = 0;
      for (const t of layer.profile) y += t.amp * (0.5 + 0.5 * Math.sin(x * t.freq + t.phase));
      return y;
    };
    const props = world.props.map((p) => ({
      def: p,
      x: p.at.s * LEN,
      z: (p.at.side || 0) * (1.1 + R() * 0.8),
      seed: world.seed + (p.seedOffset || 0),
      activation: 0, latched: false,
    }));
    const stars = Array.from({ length: 90 }, () => ({ u: R(), v: R() * 0.6, r: 0.5 + R() * 1.2, ph: R() * 6.28 }));
    // ambient firefly population is world-controllable (default 24 keeps
    // night-path byte-identical; the desert sets 0 — no fireflies in the sand)
    const flyN = world.atmosphere.fireflyCount != null ? world.atmosphere.fireflyCount : 24;
    const flies = Array.from({ length: flyN }, () => ({ x: R() * LEN, y: 0.4 + R() * 1.8, z: (R() - 0.5) * 6, ph: R() * 6.28 }));
    const tufts = Array.from({ length: 160 }, () => ({ x: R() * LEN, z: (R() - 0.5) * 7, h: 0.25 + R() * 0.5, lean: (R() - 0.5) * 0.5 }));
    const petals = Array.from({ length: 40 }, () => ({ life: 0 }));

    // ---- mutable WorldState (separate from the immutable World) ----
    let wx = 0, facing = 1, run = 0, speed = 0, t = 0, idleT = 0;
    let gaitPhase = 0, vel = 0;
    let blink = 0, blinkAt = 2.5, petalAcc = 0;
    let camX = null, camY = null, camFace = 1;   // the smoothed dolly rail lives HERE (runtime-owned)
    // FOOT-LOCK cadence: with the linear stance sweep, the planted paw's
    // counter-velocity is 2·stride·scale per π of phase; matching it to body
    // speed exactly → gaitK = π / (2 · stride · renderScale)
    const trot = window.WorldAnatomy.FAMILIES[world.protagonist.family].gaitProfiles.trot;
    const renderScale = (world.protagonist.renderScale || 0.72) * (world.protagonist.scale || 1);
    const gaitK = Math.PI / (2 * trot.stride * renderScale);
    // CADENCE CEILING: real canids top out near ~3 strides/s. Above the
    // corresponding body speed the legs hold max cadence and the feet
    // lightly skate under the motion — far better than blur-fast legs.
    const MAX_CADENCE = 3.0 * Math.PI * 2;   // rad/s

    function step(travelTarget, pointer, dt) {
      t += dt;
      const tw = clamp(travelTarget, 2, LEN - 2);
      const wxBefore = wx;             // triggers test the SWEPT interval (below)
      // jump-cut beyond ~1.5 view-widths of travel, then capped pursuit
      const VIEW = 16;
      if (Math.abs(tw - wx) > VIEW * 1.5) {
        wx = tw - Math.sign(tw - wx) * VIEW * 1.2;
        camX = camY = null;            // a jump-cut CUTS the camera too — never a whip-pan
      }
      const gap = tw - wx;
      const stepMax = 0.12 * dt * 60;  // sprint cap ≈ 7 body-lengths/s
      const move = clamp(gap * ksm(0.12, dt), -stepMax, stepMax);
      wx += move;
      // gait advances by DISTANCE (direction-blind — walking left never plays
      // the cycle in reverse), capped at MAX_CADENCE
      gaitPhase += Math.min(Math.abs(move) * gaitK, MAX_CADENCE * dt);
      vel = lerp(vel, move / Math.max(dt, 1e-6), ksm(0.16, dt));   // signed units/s
      if (Math.abs(tw - wx) < 0.01) wx = tw;
      speed = lerp(speed, Math.abs(move) / Math.max(dt * 60, 1e-6), ksm(0.16, dt));
      run = lerp(run, clamp(speed / 0.12, 0, 1), ksm(speed > run * 0.12 ? 0.12 : 0.07, dt));
      if (Math.abs(gap) > 0.6) facing = gap > 0 ? 1 : -1;   // hysteresis; pursuit can't overshoot
      idleT = run < 0.05 ? idleT + dt : 0;

      // ambient channels (frozen under reduced-motion)
      if (!reduce) {
        blinkAt -= dt;
        if (blinkAt <= 0) { blink = 0.16; blinkAt = 2 + Math.abs(Math.sin(t * 7)) * 3.5; }
        blink = Math.max(0, blink - dt);
      }
      const gaze = (!reduce && pointer && idleT > 0.35)
        ? [clamp(pointer.x * 2 - 1, -1, 1), clamp(pointer.y * 2 - 1, -1, 1)] : [0, 0];

      // reactions + memory — ONE shared clock, renderer-independent (§0).
      // Proximity tests the SWEPT interval [wxBefore, wx], not the point:
      // sprints and jump-cuts must never tunnel past a trigger untouched —
      // if the walk swept over it, the world remembers being visited.
      const lo = Math.min(wxBefore, wx), hi = Math.max(wxBefore, wx);
      for (const p of props) {
        const rx = (p.def.reactions || [])[0];
        if (!rx) continue;
        const spec = world.reactions[rx];
        const near = p.x > lo - spec.trigger.radius && p.x < hi + spec.trigger.radius;
        if (spec.effect.type === "light") {
          if (near && p.def.memory && p.def.memory.latch) p.latched = true;
          const target = (p.latched || near) ? 1 : 0;
          p.activation = reduce ? target : lerp(p.activation, target, ksm(0.06, dt));
        } else if (spec.effect.type === "scatter" && !reduce) {
          if (near && run > 0.15) {
            petalAcc += spec.effect.params.rate * dt;
            while (petalAcc >= 1) {
              petalAcc -= 1;
              const q = petals.find((z) => z.life <= 0);
              if (q) {
                q.life = 1; q.x = p.x + (R() - 0.5) * 4; q.y = 3.4 + R() * 1.2;
                q.z = (R() - 0.5) * 3; q.vx = (R() - 0.5) * 0.3; q.vy = -(0.25 + R() * 0.2);
                q.rot = R() * 6.28; q.spin = (R() - 0.5) * 2;
              }
            }
          }
        }
      }
      if (!reduce) for (const q of petals) {
        if (q.life <= 0) continue;
        q.life -= dt * 0.22;
        q.x += q.vx * dt * 3 + Math.sin(t * 2 + q.rot) * 0.01;
        q.y += q.vy * dt * 3; q.rot += q.spin * dt;
        if (q.y < groundAt(q.x) + 0.05) q.life = Math.min(q.life, 0.2);
      }

      // protagonist pose from the shared anatomy contract
      const pose = window.WorldAnatomy.pose(world.protagonist.family, gaitPhase, run, t, reduce);
      const gy = groundAt(wx);

      // dolly-rail camera — smoothed, with VELOCITY FEED-FORWARD so the rig
      // leads a moving subject instead of trailing it (unled, the fox drifts
      // to the frustum edge during sprints and the world seems to lag)
      const cam = world.camera;
      // the camera re-frames on its OWN smoothed facing — the fox's discrete
      // flip must never step the rail target
      camFace = lerp(camFace, facing, ksm(0.05, dt));
      const txC = wx + cam.lookAhead * camFace + vel * 0.10;
      const tyC = gy + cam.height + 1.0;
      if (camX == null) { camX = txC; camY = tyC; }
      camX = lerp(camX, txC, ksm(0.12, dt));
      camY = lerp(camY, tyC, ksm(0.08, dt));
      return {
        schemaVersion: 3,
        t, wx, facing, run, speed, idleT,
        camera: {
          pos: [camX + 0.6, camY, cam.offset],
          lookAt: [camX, camY - 1.6, 0],
          fov: cam.fov,
        },
        protagonist: {
          root: [wx, gy, 0], facing, gaitPhase,
          pose, blink, gaze,
          breath: pose.breath,
        },
        props: props.map((p) => ({
          id: p.def.id, type: p.def.type, x: p.x, y: groundAt(p.x), z: p.z,
          scale: p.def.scale || 1, seed: p.seed, activation: p.activation,
        })),
        particles: {
          petals: petals.filter((q) => q.life > 0),
          flies, stars,
        },
        tufts,
        progress: clamp(wx / (LEN - 4), 0, 1),
      };
    }

    return {
      step, groundAt, layerProfileAt,
      get len() { return LEN; },
      get reduce() { return reduce; },
    };
  }

  window.WorldRuntime = WorldRuntime;
})();
