// Engine bootstrap. Order matters: three-global sets window.THREE first, then
// each vendored IIFE self-registers on window (anatomy → looks → grade →
// runtime → adapters). We import for side-effects and read the globals back.
import './three-global.js'; // window.THREE (must be first)
import './anatomy.js'; // window.WorldAnatomy  (+ shepherd family)
import './looks.js'; // window.WorldLooks    (+ alpine-dusk)
import './grade.js'; // window.WorldGrade
import './runtime.js'; // window.WorldRuntime
import './adapters/three3d.js'; // window.ThreeWorldAdapter
import './adapters/canvas25d.js'; // window.CanvasWorldAdapter

export function getEngine() {
  return {
    WorldRuntime: window.WorldRuntime,
    WorldLooks: window.WorldLooks,
    WorldAnatomy: window.WorldAnatomy,
    WorldGrade: window.WorldGrade,
    ThreeWorldAdapter: window.ThreeWorldAdapter,
    CanvasWorldAdapter: window.CanvasWorldAdapter,
  };
}

// Resolve a LookPreset object from a world's lookPreset id string.
// (Registry keys are camelCase but ids are kebab — scan by id, per the engine.)
export function resolveLook(WorldLooks, id) {
  const key = Object.keys(WorldLooks).find((k) => WorldLooks[k].id === id);
  return WorldLooks[key || 'cinematic'];
}
