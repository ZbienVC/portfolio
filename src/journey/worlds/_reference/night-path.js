/* night-path — the flagship authored WORLD. Pure data (ARCHITECTURE.md §1):
 * JSON-round-trippable, zero functions, zero renderer concerns. Shipped as a
 * .js global (not .json) only because file:// demos cannot fetch; the object
 * itself must always survive JSON.parse(JSON.stringify(world)) unchanged. */
(function () {
  "use strict";
  window.WORLDS = window.WORLDS || {};
  window.WORLDS["night-path"] = {
    schemaVersion: 3,
    id: "night-path",
    seed: 20260710,

    // pace: world units per scrolled px. Sized so one wheel notch ≈ 2 body
    // lengths — scale this wrong and EVERYTHING downstream reads broken
    // (camera can't hold the subject, honest foot-lock demands blur-fast legs)
    travel: { axis: "x", worldLen: 220, pace: 0.022, keyStep: 110, mode: "scroll", loop: false },

    terrain: {
      mode: "undulate",
      terms: [ { amp: 0.5, freq: 0.09, phase: 0.0 },
               { amp: 0.22, freq: 0.31, phase: 1.7 } ],
    },

    layers: [
      { id: "ridge",  z: 90, kind: "ridge",      paletteRole: "ridge",
        profile: [ { amp: 9, freq: 0.05, phase: 0.2 }, { amp: 4, freq: 0.13, phase: 2.1 } ] },
      { id: "hills",  z: 38, kind: "hills",      paletteRole: "hills",
        profile: [ { amp: 4.5, freq: 0.08, phase: 1.1 }, { amp: 2, freq: 0.21, phase: 0.4 } ] },
      { id: "ground", z: 0,  kind: "ground",     paletteRole: "ground", profile: null },
      { id: "fore",   z: -7, kind: "foreground", paletteRole: "fgGrass", profile: null },
    ],

    protagonist: {
      rig: "creature-rig", species: "fox", family: "canid",
      scale: 1.0, renderScale: 0.72, anchor: "ground",
      gaitProfileRef: "canid.trot",
      behaviors: ["gait", "breathe", "blink", "gaze"],
      personality: { curiosity: 0.95, energy: 1.0 },
    },

    props: [
      { id: "tree-1", type: "cherry-tree", at: { s: 0.16, layer: "ground", side: 1 }, scale: 1.25, seedOffset: 3,
        reactions: ["proximityShed"] },
      { id: "lant-1", type: "paper-lantern", at: { s: 0.30, layer: "ground", side: -1 }, scale: 1.0, seedOffset: 11,
        reactions: ["proximityLight"], memory: { latch: true, key: "lit", persist: "none" } },
      { id: "rock-1", type: "rock", at: { s: 0.38, layer: "ground", side: 1 }, scale: 1.0, seedOffset: 5 },
      { id: "lant-2", type: "paper-lantern", at: { s: 0.5, layer: "ground", side: 1 }, scale: 1.0, seedOffset: 12,
        reactions: ["proximityLight"], memory: { latch: true, key: "lit", persist: "none" } },
      { id: "tree-2", type: "cherry-tree", at: { s: 0.62, layer: "ground", side: -1 }, scale: 1.05, seedOffset: 7,
        reactions: ["proximityShed"] },
      { id: "lant-3", type: "paper-lantern", at: { s: 0.74, layer: "ground", side: -1 }, scale: 1.0, seedOffset: 13,
        reactions: ["proximityLight"], memory: { latch: true, key: "lit", persist: "none" } },
      { id: "lant-4", type: "paper-lantern", at: { s: 0.92, layer: "ground", side: -1 }, scale: 1.1, seedOffset: 14,
        reactions: ["proximityLight"], memory: { latch: true, key: "lit", persist: "none" } },
      { id: "torii",  type: "torii", at: { s: 0.97, layer: "ground", side: 0 }, scale: 1.6, seedOffset: 0 },
      { id: "lant-5", type: "paper-lantern", at: { s: 0.995, layer: "ground", side: 1 }, scale: 1.1, seedOffset: 15,
        reactions: ["proximityLight"], memory: { latch: true, key: "lit", persist: "none" } },
    ],

    reactions: {
      proximityLight: { trigger: { type: "proximity", to: "protagonist", radius: 9 },
                        effect: { type: "light", params: { warmth: 1.0, radius: 12 } }, easing: "outCubic" },
      proximityShed:  { trigger: { type: "proximity", to: "protagonist", radius: 14 },
                        effect: { type: "scatter", params: { kind: "petal", rate: 8 } }, easing: "linear" },
    },

    palette: {
      sky: "#0b1026", moon: "#fff2cf", moonHalo: "255,217,160",
      ridge: "#221a30", hills: "#2c2140", ground: "#241b33", fgGrass: "#1f2a21",
      trunk: "#3a2a38", canopy: "#4a2c44", blossom: ["#f79ab7", "#ffbcd3", "#ffd7e6"],
      propPaper: "#e8543f", propGlow: "#ffd9a0", torii: "#8a3040", grass: "#33413a",
      protagFur: "#d96428", protagDark: "#b04a1c", protagCream: "#f7e9d2", protagInk: "#33241c",
      firefly: "#ffd45e",
    },

    atmosphere: {
      timeOfDay: "night",
      fog: { colorRole: "sky", density: 0.016 },
      haze: 0.6, ambientLevel: 0.25,
      keyLightDir: [-0.4, 0.82, 0.41],
    },

    camera: { kind: "dolly-rail", follow: "protagonist",
              height: 1.6, offset: 8.5, fov: 34, lookAhead: 1.6, dofFocus: "protagonist" },

    keyMoments: [ { at: 0.97, id: "arrival", fires: "onProgress" } ],

    lookPreset: "cinematic",
    audio: null,
  };
})();
