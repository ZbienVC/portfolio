/* desert — the SECOND authored WORLD, and the repeatability proof
 * (ARCHITECTURE.md §7.1). Pure data, exactly like night-path: no functions,
 * no renderer concerns, JSON.parse(JSON.stringify(world)) round-trips clean.
 *
 * The whole point: this file renders in BOTH adapters on the SAME runtime,
 * anatomy and looks, with ZERO engine forks. The only code the desert needed
 * that night-path did not is one draw-per-adapter for each genuinely-new prop
 * TYPE (cactus/campfire/skull/arch — §6.4's acknowledged seam). Everything
 * else — dune terrain, the golden-dusk palette, the low warm sun, the reused
 * proximity reactions, the identical fox — is authored here as data.
 *
 * Design: a lone fox crosses rolling dunes at golden hour. Campfires flare to
 * life and STAY lit as it passes (the same `light` reaction + memory latch the
 * night lanterns use), saguaros shed cream blossom on the wind (the same
 * `scatter` reaction the cherry trees use), and the walk ends at a wind-carved
 * sandstone arch. */
(function () {
  "use strict";
  window.WORLDS = window.WORLDS || {};
  window.WORLDS["desert"] = {
    schemaVersion: 3,
    id: "desert",
    seed: 20260711,

    // identical travel spec to night-path — one wheel notch ≈ 2 body lengths.
    // Keeping it byte-identical is deliberate: the gait/foot-lock is derived
    // from these numbers × renderScale, so the fox trots the dunes on exactly
    // the cadence it trots the night path. Same creature, same motion, proven.
    travel: { axis: "x", worldLen: 220, pace: 0.022, keyStep: 110, mode: "scroll", loop: false },

    // rolling dunes: longer, higher swells than the night forest's undulation.
    // Still terrain.mode "undulate" (1-D, parallax-safe — the supported path
    // both adapters read the same way, ARCHITECTURE §8).
    terrain: {
      mode: "undulate",
      terms: [ { amp: 0.72, freq: 0.055, phase: 0.4 },
               { amp: 0.26, freq: 0.19, phase: 1.3 } ],
    },

    // SAME z-band structure as night-path (ridge/hills/ground/fore); only the
    // dune profiles + palette roles differ. That sameness is the proof.
    layers: [
      { id: "dunes-far", z: 90, kind: "ridge",      paletteRole: "ridge",
        profile: [ { amp: 8, freq: 0.045, phase: 0.6 }, { amp: 3.5, freq: 0.12, phase: 1.9 } ] },
      { id: "dunes-mid", z: 38, kind: "hills",      paletteRole: "hills",
        profile: [ { amp: 4, freq: 0.07, phase: 1.4 }, { amp: 1.8, freq: 0.2, phase: 0.3 } ] },
      { id: "ground",    z: 0,  kind: "ground",     paletteRole: "ground", profile: null },
      { id: "fore",      z: -7, kind: "foreground", paletteRole: "fgGrass", profile: null },
    ],

    // the IDENTICAL fox — same rig, family, scale, renderScale, gait ref,
    // behaviors, personality. An orange fox against warm sand needs not one
    // number changed. Creature reuse is a one-field decision (species), and
    // here it is not even that: it is the same species verbatim.
    protagonist: {
      rig: "creature-rig", species: "fox", family: "canid",
      scale: 1.0, renderScale: 0.72, anchor: "ground",
      gaitProfileRef: "canid.trot",
      behaviors: ["gait", "breathe", "blink", "gaze"],
      personality: { curiosity: 0.95, energy: 1.0 },
    },

    props: [
      { id: "cact-1", type: "cactus", at: { s: 0.13, layer: "ground", side: 1 }, scale: 1.2, seedOffset: 2,
        reactions: ["proximityShed"] },
      { id: "rock-1", type: "rock", at: { s: 0.21, layer: "ground", side: -1 }, scale: 1.1, seedOffset: 5 },
      { id: "fire-1", type: "campfire", at: { s: 0.30, layer: "ground", side: -1 }, scale: 1.0, seedOffset: 21,
        reactions: ["proximityLight"], memory: { latch: true, key: "lit", persist: "none" } },
      { id: "skull-1", type: "skull", at: { s: 0.39, layer: "ground", side: 1 }, scale: 1.0, seedOffset: 8 },
      { id: "cact-2", type: "cactus", at: { s: 0.5, layer: "ground", side: -1 }, scale: 0.95, seedOffset: 4,
        reactions: ["proximityShed"] },
      { id: "fire-2", type: "campfire", at: { s: 0.6, layer: "ground", side: 1 }, scale: 1.05, seedOffset: 22,
        reactions: ["proximityLight"], memory: { latch: true, key: "lit", persist: "none" } },
      { id: "rock-2", type: "rock", at: { s: 0.68, layer: "ground", side: -1 }, scale: 0.9, seedOffset: 6 },
      { id: "fire-3", type: "campfire", at: { s: 0.78, layer: "ground", side: -1 }, scale: 1.0, seedOffset: 23,
        reactions: ["proximityLight"], memory: { latch: true, key: "lit", persist: "none" } },
      { id: "fire-4", type: "campfire", at: { s: 0.9, layer: "ground", side: 1 }, scale: 1.1, seedOffset: 24,
        reactions: ["proximityLight"], memory: { latch: true, key: "lit", persist: "none" } },
      { id: "arch", type: "arch", at: { s: 0.96, layer: "ground", side: 0 }, scale: 1.25, seedOffset: 0 },
      { id: "fire-5", type: "campfire", at: { s: 0.995, layer: "ground", side: 1 }, scale: 1.1, seedOffset: 25,
        reactions: ["proximityLight"], memory: { latch: true, key: "lit", persist: "none" } },
    ],

    // the SAME reaction vocabulary as night-path, verbatim. proximityLight
    // lights campfires here exactly as it lit lanterns there; proximityShed
    // sheds saguaro blossom here exactly as it shed cherry petals there. The
    // runtime interprets these declaratively — it never knew or cared which
    // world or prop type they attach to.
    reactions: {
      proximityLight: { trigger: { type: "proximity", to: "protagonist", radius: 9 },
                        effect: { type: "light", params: { warmth: 1.0, radius: 12 } }, easing: "outCubic" },
      proximityShed:  { trigger: { type: "proximity", to: "protagonist", radius: 14 },
                        effect: { type: "scatter", params: { kind: "petal", rate: 6 } }, easing: "linear" },
    },

    // SEMANTIC role tokens — golden-hour desert. Same role names as night-path
    // (adapters + looks read roles, never literal colors, ARCHITECTURE §1), so
    // the palette is a pure recolor. The fox roles (protagFur/Dark/Cream/Ink)
    // are IDENTICAL to night-path — same fox. `moon`/`moonHalo` now read as the
    // low sun + its warm haze (role names outlive the night; §1 field table).
    palette: {
      sky: "#d98c5a", moon: "#ffe6b4", moonHalo: "255,206,140",
      ridge: "#b0855c", hills: "#c99a68", ground: "#d9b47e", fgGrass: "#9c8850",
      // rock generalization (E3): both adapters now read these; night-path
      // omits them and falls back to its literals, staying pixel-identical.
      rock: "#a9865c", rockShade: "#7c5f3e",
      // 3D ground-material multiplier: white lets the warm sand texture pass
      // through untinted (night-path omits this and falls back to its
      // baked lavender, unchanged). Vignette is a warm ember tone, r,g,b.
      groundTint: "#ffffff", vignette: "40,16,10",
      // new prop-type palette roles (only the desert's new draws read these).
      cactusBody: "#5e7d52", cactusShade: "#3f5a38",
      bone: "#e8ddc4", boneShade: "#b6a888",
      arch: "#c0895a", archShade: "#8a5f38",
      // fire — reuses propPaper (flame core) + propGlow (firelight / point
      // light / halo), the same roles the lanterns used.
      propPaper: "#ff7a3c", propGlow: "#ffc27a",
      trunk: "#6b4a2e", canopy: "#5e7d52", blossom: ["#f6ead0", "#fff4e0", "#ffe8c8"],
      torii: "#b06a3e", grass: "#9c8850",
      protagFur: "#d96428", protagDark: "#b04a1c", protagCream: "#f7e9d2", protagInk: "#33241c",
      firefly: "#ffd45e",
    },

    atmosphere: {
      timeOfDay: "dusk",
      fog: { colorRole: "sky", density: 0.015 },        // dust haze softening the far dunes
      haze: 0.5, ambientLevel: 0.34,                    // brighter than night (0.25)
      keyLightDir: [-0.48, 0.74, 0.30],                 // late-afternoon sun — long-ish shadows without smearing
      fireflyCount: 0,                                  // no fireflies in a desert (E1)
    },

    camera: { kind: "dolly-rail", follow: "protagonist",
              height: 1.5, offset: 8.5, fov: 34, lookAhead: 1.6, dofFocus: "protagonist" },

    keyMoments: [ { at: 0.96, id: "arrival", fires: "onProgress" } ],

    lookPreset: "cinematic",
    audio: null,
  };
})();
