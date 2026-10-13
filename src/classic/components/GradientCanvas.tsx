import { useEffect, useRef } from 'react';
import type { ShaderGradientApi, ShaderGradientOptions } from '../engines/shader-gradient.js';

interface GradientCanvasProps {
  options: ShaderGradientOptions;
  className?: string;
}

/**
 * Atelier's WebGL shader gradient (motion lab), mounted once. The engine is
 * fetched after first paint; until then, and wherever WebGL is missing, the
 * canvas shows the engine's own CSS still in the same colours.
 */
export function GradientCanvas({ options, className }: GradientCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<ShaderGradientApi | null>(null);
  const latest = useRef(options);
  const key = JSON.stringify(options);

  useEffect(() => {
    latest.current = options;
    api.current?.set(options);
    // `key` stands in for a deep compare of the options object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    // after the page is interactive: the engine's still covers the wait
    const start = () =>
      import('../engines/shader-gradient.js').then(({ default: ShaderGradient }) => {
        if (cancelled || !canvas.current) return;
        api.current = ShaderGradient(canvas.current, latest.current);
      });
    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 400);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
      api.current?.destroy();
      api.current = null;
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className={className} />;
}
