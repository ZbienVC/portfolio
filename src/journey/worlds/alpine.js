/* Alpine Descent — the authored world.
 *
 * A german shepherd trots DOWN a moonlit dusk mountain trail. Snow is cold
 * indigo-white; cabin windows and trail lanterns ignite and STAY lit as the
 * dog passes (memory.latch); an aurora breathes overhead; the walk ends at a
 * timber trailhead gate. Pure JSON-safe data — the runtime + adapters do the
 * rest. Waypoints (one anchor prop per section) sit at ascending `at.s`.
 *
 * Reskin of the atelier night-path world: palette + props + protagonist colors.
 * Keep runtime/anatomy/looks/grade unchanged. family:"shepherd", renderScale 0.9.
 */
export const ALPINE_WORLD = {
  schemaVersion: 3,
  id: 'alpine-descent',
  seed: 20260711,

  travel: { axis: 'x', worldLen: 240, pace: 0.021, keyStep: 120, mode: 'scroll', loop: false },

  terrain: {
    mode: 'undulate',
    terms: [
      { amp: 0.55, freq: 0.06, phase: 0.0 },
      { amp: 0.2, freq: 0.22, phase: 1.3 },
    ],
  },

  // far jagged peaks → mid snow-slopes → the trail → near snowbank
  layers: [
    { id: 'peaks', z: 112, kind: 'ridge', paletteRole: 'ridge',
      profile: [ { amp: 13, freq: 0.045, phase: 0.3 }, { amp: 6, freq: 0.12, phase: 2.0 }, { amp: 3, freq: 0.27, phase: 1.1 } ] },
    { id: 'slopes', z: 46, kind: 'hills', paletteRole: 'hills',
      profile: [ { amp: 6, freq: 0.08, phase: 1.1 }, { amp: 2.5, freq: 0.2, phase: 0.4 } ] },
    { id: 'ground', z: 0, kind: 'ground', paletteRole: 'ground', profile: null },
    { id: 'fore', z: -7, kind: 'foreground', paletteRole: 'fgGrass', profile: null },
  ],

  protagonist: {
    rig: 'creature-rig', species: 'german-shepherd', family: 'shepherd',
    scale: 1.0, renderScale: 0.8, anchor: 'ground',
    gaitProfileRef: 'shepherd.trot',
    behaviors: ['gait', 'breathe', 'blink', 'gaze'],
    personality: { curiosity: 0.85, energy: 0.9 },
  },

  // Props are the trail. Lanterns + cabin windows latch lit. Pines shed snow.
  // Anchor props (cabin/chairlift/frozen-lake/gate) mark the portfolio sections.
  props: [
    { id: 'pine-a', type: 'pine', at: { s: 0.05, layer: 'ground', side: -1 }, scale: 1.2, seedOffset: 2, reactions: ['proximityShed'] },
    { id: 'pine-b', type: 'pine', at: { s: 0.09, layer: 'ground', side: 1 }, scale: 1.05, seedOffset: 3 },
    { id: 'lant-1', type: 'trail-lantern', at: { s: 0.15, layer: 'ground', side: -1 }, scale: 1.0, seedOffset: 11,
      reactions: ['proximityLight'], memory: { latch: true, key: 'lit', persist: 'none' } },
    { id: 'rock-1', type: 'rock', at: { s: 0.20, layer: 'ground', side: 1 }, scale: 1.1, seedOffset: 5 },
    { id: 'pine-c', type: 'pine', at: { s: 0.25, layer: 'ground', side: -1 }, scale: 1.25, seedOffset: 6, reactions: ['proximityShed'] },
    { id: 'pine-d', type: 'pine', at: { s: 0.30, layer: 'ground', side: 1 }, scale: 1.1, seedOffset: 7 },
    { id: 'cabin',  type: 'cabin', at: { s: 0.34, layer: 'ground', side: -1 }, scale: 1.4, seedOffset: 21,
      reactions: ['proximityLight'], memory: { latch: true, key: 'lit', persist: 'none' } },
    { id: 'lant-2', type: 'trail-lantern', at: { s: 0.41, layer: 'ground', side: 1 }, scale: 1.0, seedOffset: 12,
      reactions: ['proximityLight'], memory: { latch: true, key: 'lit', persist: 'none' } },
    { id: 'pine-e', type: 'pine', at: { s: 0.46, layer: 'ground', side: -1 }, scale: 1.15, seedOffset: 8, reactions: ['proximityShed'] },
    { id: 'rock-2', type: 'rock', at: { s: 0.50, layer: 'ground', side: 1 }, scale: 0.95, seedOffset: 9 },
    { id: 'lift',   type: 'chairlift', at: { s: 0.54, layer: 'ground', side: -1 }, scale: 1.3, seedOffset: 31,
      reactions: ['proximityLight'], memory: { latch: true, key: 'lit', persist: 'none' } },
    { id: 'lant-3', type: 'trail-lantern', at: { s: 0.59, layer: 'ground', side: 1 }, scale: 1.0, seedOffset: 13,
      reactions: ['proximityLight'], memory: { latch: true, key: 'lit', persist: 'none' } },
    { id: 'pine-f', type: 'pine', at: { s: 0.63, layer: 'ground', side: -1 }, scale: 1.2, seedOffset: 10, reactions: ['proximityShed'] },
    { id: 'pine-g', type: 'pine', at: { s: 0.67, layer: 'ground', side: 1 }, scale: 1.05, seedOffset: 14 },
    { id: 'lant-4', type: 'trail-lantern', at: { s: 0.70, layer: 'ground', side: -1 }, scale: 1.05, seedOffset: 15,
      reactions: ['proximityLight'], memory: { latch: true, key: 'lit', persist: 'none' } },
    { id: 'rock-3', type: 'rock', at: { s: 0.75, layer: 'ground', side: 1 }, scale: 1.05, seedOffset: 16 },
    { id: 'pine-h', type: 'pine', at: { s: 0.79, layer: 'ground', side: -1 }, scale: 1.1, seedOffset: 17, reactions: ['proximityShed'] },
    { id: 'lake',   type: 'frozen-lake', at: { s: 0.85, layer: 'ground', side: 1 }, scale: 1.7, seedOffset: 41 },
    { id: 'lant-5', type: 'trail-lantern', at: { s: 0.88, layer: 'ground', side: -1 }, scale: 1.1, seedOffset: 18,
      reactions: ['proximityLight'], memory: { latch: true, key: 'lit', persist: 'none' } },
    { id: 'pine-i', type: 'pine', at: { s: 0.92, layer: 'ground', side: 1 }, scale: 1.15, seedOffset: 19 },
    { id: 'lant-6', type: 'trail-lantern', at: { s: 0.95, layer: 'ground', side: 1 }, scale: 1.1, seedOffset: 20,
      reactions: ['proximityLight'], memory: { latch: true, key: 'lit', persist: 'none' } },
    { id: 'gate',   type: 'trail-gate', at: { s: 0.985, layer: 'ground', side: 0 }, scale: 1.7, seedOffset: 0 },
  ],

  reactions: {
    proximityLight: {
      trigger: { type: 'proximity', to: 'protagonist', radius: 9 },
      effect: { type: 'light', params: { warmth: 1.0, radius: 12 } },
      easing: 'outCubic',
    },
    proximityShed: {
      trigger: { type: 'proximity', to: 'protagonist', radius: 12 },
      effect: { type: 'scatter', params: { kind: 'snow', rate: 6 } },
      easing: 'linear',
    },
  },

  palette: {
    sky: '#0e1524',              // deep dusk night sky
    moon: '#eaf1ff',             // cool moonlight
    moonHalo: '205,222,255',     // rgb string (alpha compositing)
    ridge: '#1b2740',            // far peaks (cold indigo)
    hills: '#26374f',            // mid snow-slopes
    ground: '#aebbd4',           // moonlit snow surface (cool light-mid)
    fgGrass: '#8fa0bd',          // near snowbank
    trunk: '#2c2622',            // pine trunk / posts / timber
    canopy: '#22402f',           // evergreen needles (deep)
    blossom: ['#eef4ff', '#dbe7ff', '#ffffff'],  // snow-puff / spindrift tints
    propPaper: '#ffce8a',        // lit core (warm amber)
    propGlow: '#ffbe6e',         // warm gold — halo / point-light / ground glow (hex: 3D passes it to THREE.Color + hexBytes)
    torii: '#5b4636',            // timber trailhead gate
    grass: '#9fb0cd',            // snow tufts / cool ground patch
    // shepherd coat (canid anatomy, black-and-tan/sable)
    protagFur: '#b3843f',        // rich tan — main coat
    protagDark: '#3f3020',       // deep sable — saddle + far legs
    protagCream: '#cdaa6e',      // pale throat tan
    protagInk: '#161210',        // near-black — muzzle, ears, paws, eyes
    firefly: '#dfeafe',
    // optional roles read by new alpine draws (adapter fallbacks exist)
    rock: '#4a5670', rockShade: '#333d54',
    groundTint: '#eef4ff',
    vignette: '16,24,44',
    snow: '#eef4ff',             // snow highlight (hex)
    snowLit: '235,242,255',      // rgb string — pine snow caps
    cabin: '#6d4e38',            // cabin log wall (warm brown)
    cabinRoof: '#3a2c22',        // cabin roof (under snow)
    lakeIce: '#8299bd',          // frozen lake ice
    aurora: '95,214,196',        // rgb string — aurora curtain (teal)
    aurora2: '120,150,255',      // rgb string — aurora curtain (violet-blue)
  },

  atmosphere: {
    timeOfDay: 'dusk',
    fog: { colorRole: 'sky', density: 0.012 },
    haze: 0.6, ambientLevel: 0.32,
    keyLightDir: [-0.42, 0.8, 0.4],
    fireflyCount: 0,
  },

  camera: { kind: 'dolly-rail', follow: 'protagonist', height: 2.9, offset: 18.0, fov: 34, lookAhead: 2.3, dofFocus: 'protagonist' },

  keyMoments: [
    { at: 0.17, id: 'about', fires: 'onProgress' },
    { at: 0.36, id: 'projects', fires: 'onProgress' },
    { at: 0.54, id: 'experience', fires: 'onProgress' },
    { at: 0.70, id: 'skills', fires: 'onProgress' },
    { at: 0.85, id: 'life', fires: 'onProgress' },
    { at: 0.985, id: 'contact', fires: 'onProgress' },
  ],

  lookPreset: 'alpine-dusk',
  audio: null,
};

export default ALPINE_WORLD;
