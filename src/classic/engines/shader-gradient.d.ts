/** Types for the vendored Atelier shader-gradient engine (shader-gradient.js). */
export interface ShaderGradientOptions {
  preset?: 'tenmoku' | 'oribe' | 'shino' | 'oxblood';
  /** [pool, body, break]: where the glaze is thickest, its body, where it runs thin */
  colors?: [string, string, string];
  /** what the far sheet and the edges sink into; match the page ground */
  ground?: string;
  form?: 'silk' | 'tide';
  speed?: number;
  strength?: number;
  frequency?: number;
  density?: number;
  gloss?: number;
  /** key-light azimuth in degrees */
  light?: number;
  tilt?: number;
  zoom?: number;
  grain?: number;
  renderScale?: number;
  pointer?: number;
  seed?: number;
}

export interface ShaderGradientApi {
  set(partial: ShaderGradientOptions): ShaderGradientApi;
  preset(name: string): ShaderGradientApi;
  pause(): ShaderGradientApi;
  resume(): ShaderGradientApi;
  render(atSeconds?: number): ShaderGradientApi;
  destroy(): void;
  readonly state: 'webgl' | 'fallback';
  readonly options: Required<ShaderGradientOptions>;
}

declare const ShaderGradient: {
  (canvas: HTMLCanvasElement, options?: ShaderGradientOptions): ShaderGradientApi;
  PRESETS: Record<string, ShaderGradientOptions>;
  DEFAULTS: ShaderGradientOptions;
};
export default ShaderGradient;
