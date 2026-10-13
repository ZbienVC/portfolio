// The vendored engine files reference a global `THREE` (UMD style, no imports).
// Set it once, before any engine file evaluates. Imported first by index.js.
import * as THREE from 'three';

if (typeof window !== 'undefined') {
  window.THREE = THREE;
}

export { THREE };
