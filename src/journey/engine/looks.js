/* WorldLooks — the LOOK-PRESET registry. Pure data (ARCHITECTURE.md §2).
 * A world names ONE preset by id; adapters read identical fields and map
 * them to their medium. New look = append an object; if it composes only
 * existing post[] types, ZERO adapter code changes.
 * Every post effect declares `static` (its reduced-motion frozen state). */
(function () {
  "use strict";
  window.WorldLooks = {
    cinematic: {
      id: "cinematic",
      // grade is WORLD-NEUTRAL cinema (contrast + haze + soft shadow), not
      // night-in-a-bottle: the cool of a night scene comes from the world's
      // lighting (moonColorMul below), never from blue-washing the frame —
      // a -0.35 tempBias + 0.85 saturation greyed the golden desert to mud
      palette: { tempBias: -0.10, saturation: 1.0, contrast: 1.25,
                 lift: "#0b0e14", gamma: "#2e3138", gain: "#eef3ff", blackPoint: 0.04 },
      lighting: { keyIntensity: 2.4, ambient: 0.25, moonColorMul: "#cfe0ff",
                  shadowSoftness: 10, shadowMapSize: 4096, shadowDarkness: 0.75, shadowColor: "#0a1830" },
      fog: { densityMul: 1.15, colorShift: "#0e1630" },
      material: { model: "physical", roughness: 0.7, metalness: 0.0, envMapIntensity: 0.6,
                  clearcoat: 0.0, toonSteps: 0, rampBias: 0, emissive: 0.25, flatShading: true,
                  outline: { enabled: false, thickness: 0, color: "#000" } },
      tone: { mapping: "AgX", exposure: 1.05 },
      post: [
        { type: "bloom", threshold: 0.55, strength: 0.9, radius: 0.85, static: true },
        { type: "dof", focus: "protagonist", bokeh: 3.5, static: true },
        { type: "grain", amount: 0.09, animated: true, static: 0.09 },
        { type: "vignette", offset: 0.35, darkness: 0.7, static: true },
      ],
      canvasHints: { haloStrength: 1.2, inkWidth: 0, textureBlend: 0.4, blurScale: 1.3 },
      camera: { fovMul: 0.71, swayAmp: 0.28, swayFreq: 0.3, parallax: 0.35, scrollEase: 0.06 },
    },

    webPremium: {
      id: "web-premium",
      palette: { tempBias: -0.10, saturation: 1.15, contrast: 1.35,
                 lift: "#05060a", gamma: "#2a2d38", gain: "#ffffff", blackPoint: 0.02 },
      lighting: { keyIntensity: 3.2, ambient: 0.6, moonColorMul: "#ffffff",
                  shadowSoftness: 3, shadowMapSize: 2048, shadowDarkness: 0.9, shadowColor: "#000000" },
      fog: { densityMul: 0.45, colorShift: "#000000" },
      material: { model: "physical", roughness: 0.25, metalness: 0.05, envMapIntensity: 1.0,
                  clearcoat: 0.4, toonSteps: 0, rampBias: 0, emissive: 0.15, flatShading: true,
                  outline: { enabled: false, thickness: 0, color: "#000" } },
      tone: { mapping: "ACES", exposure: 1.2 },
      post: [
        { type: "bloom", threshold: 0.75, strength: 0.6, radius: 0.4, static: true },
        { type: "vignette", offset: 0.5, darkness: 0.4, static: true },
      ],
      canvasHints: { haloStrength: 0.8, inkWidth: 0, textureBlend: 0.15, blurScale: 0.7 },
      camera: { fovMul: 1.0, swayAmp: 0.1, swayFreq: 0.4, parallax: 0.55, scrollEase: 0.14 },
    },

    storybook: {
      id: "storybook",
      // warm and gentle; toonSteps posterises the CANVAS only (grade.js gates
      // it on the tone path — a 3-step LUT over a photographic 3D frame
      // banded the desert sky into flats). 5 steps keeps the paper feel
      // without crushing bright scenes.
      palette: { tempBias: +0.18, saturation: 1.08, contrast: 0.98,
                 lift: "#241a12", gamma: "#453a2e", gain: "#fff2d6", blackPoint: 0.05 },
      lighting: { keyIntensity: 2.0, ambient: 0.7, moonColorMul: "#ffe9b8",
                  shadowSoftness: 6, shadowMapSize: 1024, shadowDarkness: 0.5, shadowColor: "#3a2a1a" },
      fog: { densityMul: 0.55, colorShift: "#2a1c14" },
      material: { model: "toon", roughness: 1.0, metalness: 0.0, envMapIntensity: 0.0,
                  clearcoat: 0.0, toonSteps: 5, rampBias: 0.05, emissive: 0.4, flatShading: false,
                  outline: { enabled: true, thickness: 0.015, color: "#2a1c14" } },
      tone: { mapping: "Neutral", exposure: 1.0 },
      post: [
        { type: "grain", amount: 0.05, animated: false, static: 0.05 },
        { type: "vignette", offset: 0.6, darkness: 0.35, static: true },
      ],
      canvasHints: { haloStrength: 1.0, inkWidth: 1.6, textureBlend: 0.6, blurScale: 0.8 },
      camera: { fovMul: 1.11, swayAmp: 0.18, swayFreq: 0.35, parallax: 0.30, scrollEase: 0.09 },
    },

    // Alpine dusk — cold moonlit snow that stays CLEAN (the cold lives in the
    // world palette + moonColorMul, never a blue frame-wash) while warm cabin
    // amber and the aurora bloom. Higher ambient than the night forest because
    // snow bounces light; soft cold-blue shadows, not black.
    alpineDusk: {
      id: "alpine-dusk",
      palette: { tempBias: -0.05, saturation: 1.06, contrast: 1.2,
                 lift: "#0b1120", gamma: "#33425e", gain: "#f2f6ff", blackPoint: 0.03 },
      lighting: { keyIntensity: 2.6, ambient: 0.36, moonColorMul: "#dfe9ff",
                  shadowSoftness: 10, shadowMapSize: 4096, shadowDarkness: 0.6, shadowColor: "#12213f" },
      fog: { densityMul: 1.0, colorShift: "#101a30" },
      material: { model: "physical", roughness: 0.78, metalness: 0.0, envMapIntensity: 0.6,
                  clearcoat: 0.0, toonSteps: 0, rampBias: 0, emissive: 0.28, flatShading: true,
                  outline: { enabled: false, thickness: 0, color: "#000" } },
      tone: { mapping: "AgX", exposure: 1.06 },
      post: [
        { type: "bloom", threshold: 0.58, strength: 0.9, radius: 0.85, static: true },
        { type: "dof", focus: "protagonist", bokeh: 3.2, static: true },
        { type: "grain", amount: 0.08, animated: true, static: 0.08 },
        { type: "vignette", offset: 0.4, darkness: 0.62, static: true },
      ],
      canvasHints: { haloStrength: 1.25, inkWidth: 0, textureBlend: 0.42, blurScale: 1.25 },
      camera: { fovMul: 0.72, swayAmp: 0.22, swayFreq: 0.28, parallax: 0.4, scrollEase: 0.06 },
    },
  };
})();
