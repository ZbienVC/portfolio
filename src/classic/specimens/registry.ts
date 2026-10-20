/**
 * Signature materials: one living Specimen Atlas style per project, picked for
 * what the project is about. The style files are copied unchanged from
 * ZbienVC/specimen-atlas (src/modules); each one registers itself on
 * window.SPECIMENS when its chunk loads, so only the styles on screen download.
 */
export interface Material {
  /** the file in ./modules, without .js */
  file: string;
  /** the id the file registers */
  id: string;
  /** the style's name in the Atlas */
  name: string;
  family: string;
  /** why this material belongs to this project, in a few words */
  why: string;
}

export const MATERIALS: Record<string, Material> = {
  hookline: { file: 'fluid-caustics', id: 'caustics', name: 'Water Caustics', family: 'Fluid', why: 'light through water, where the fish are' },
  feast: { file: 'physics-soft-body', id: 'soft-body-jelly', name: 'Soft Body Jelly', family: 'Physics', why: 'candy that squishes when you poke it' },
  unearth: { file: 'geo-topographic', id: 'topographic-lines', name: 'Topographic Lines', family: 'Geometry', why: 'contour lines, for digging into data' },
  specimen: { file: 'shader-mandelbulb', id: 'mandelbulb', name: 'Raymarched Mandelbulb', family: 'Shader', why: 'the Atlas’s own cover specimen' },
  fieldsense: { file: 'geo-voronoi', id: 'voronoi-stained-glass', name: 'Voronoi Stained Glass', family: 'Geometry', why: 'zones of a field, each owned by its nearest point' },
  oikos: { file: 'particles-physarum', id: 'physarum', name: 'Physarum Slime Mold', family: 'Particles', why: 'tiny agents that feed, spread and die off, like Oikos’s' },
  splash: { file: 'particles-flow-field', id: 'flow-field', name: 'Flow Field', family: 'Particles', why: 'money moving along currents' },
  wakerush: { file: 'fluid-ink-water', id: 'ink-water', name: 'Ink in Water', family: 'Fluid', why: 'a wake spreading behind a boat' },
  plato: { file: 'organic-marbling', id: 'marbling', name: 'Ink Marbling', family: 'Organic', why: 'swirls, like a sauce on a plate' },
  dipper: { file: 'organic2-fireflies', id: 'bioluminescence', name: 'Bioluminescence', family: 'Organic', why: 'many small agents, each with its own glow' },
  careeva: { file: 'geo2-string-art', id: 'geo2-string-art', name: 'String Art Weave', family: 'Geometry', why: 'lines drawn between a résumé and a job' },
  reflect: { file: 'fluid-mesh-gradient', id: 'mesh-gradient', name: 'Mesh Gradient', family: 'Fluid', why: 'soft color, like good skin care' },
  cryptosites: { file: 'print-halftone', id: 'print-halftone', name: 'CMYK Halftone Dots', family: 'Print', why: 'meme print, four inks deep' },
  wayfound: { file: 'geo-truchet', id: 'truchet-tiles', name: 'Truchet Tiles', family: 'Geometry', why: 'paths that join up into a route' },
  staywestpalm: { file: 'print-risograph', id: 'print-risograph', name: 'Risograph Print', family: 'Print', why: 'a postcard from Florida' },
};

export const materialFor = (projectId: string): Material | undefined => MATERIALS[projectId];
