import type { SVGProps } from 'react';

/** A small, hand-drawn-on-a-grid icon set: 20px box, 1.6px strokes, round joins. */
const PATHS = {
  external: <path d="M7 13 13 7M8 7h5v5" />,
  arrowRight: <path d="M4 10h11M11 6l4 4-4 4" />,
  arrowDown: <path d="M10 4v11M6 11l4 4 4-4" />,
  chevronDown: <path d="m6 8 4 4 4-4" />,
  search: (
    <>
      <circle cx="9" cy="9" r="5" />
      <path d="m13 13 3.5 3.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M4.7 15.3 6 14M14 6l1.3-1.3" />
    </>
  ),
  moon: <path d="M15.5 12.4A6.2 6.2 0 0 1 7.6 4.5a6.3 6.3 0 1 0 7.9 7.9Z" />,
  pencil: (
    <>
      <path d="M12.8 4.2 15.8 7.2 7.4 15.6 3.8 16.2 4.4 12.6Z" />
      <path d="m11.3 5.7 3 3" />
    </>
  ),
  close: <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />,
  copy: (
    <>
      <rect x="7" y="7" width="9" height="9" rx="1.8" />
      <path d="M13 4.5H5.8A1.3 1.3 0 0 0 4.5 5.8V13" />
    </>
  ),
  check: <path d="m4.5 10.5 3.5 3.5 7.5-8" />,
  mail: (
    <>
      <rect x="3" y="4.8" width="14" height="10.4" rx="1.8" />
      <path d="m3.6 6 6.4 4.9L16.4 6" />
    </>
  ),
  menu: <path d="M3.5 6.5h13M3.5 13.5h13" />,
  refresh: (
    <>
      <path d="M15.8 9.2A5.9 5.9 0 0 0 5.4 6" />
      <path d="M4.2 10.8A5.9 5.9 0 0 0 14.6 14" />
      <path d="M5 3v3.3h3.3M15 17v-3.3h-3.3" />
    </>
  ),
  file: (
    <>
      <path d="M5.5 2.8h6l3.2 3.2v11.2h-9.2Z" />
      <path d="M11.3 2.8v3.4h3.4M7.8 10.5h4.6M7.8 13.3h4.6" />
    </>
  ),
  ask: (
    <>
      <path d="M4 5.6A1.6 1.6 0 0 1 5.6 4h8.8A1.6 1.6 0 0 1 16 5.6v6.2a1.6 1.6 0 0 1-1.6 1.6H9.2L6 16v-2.6h-.4A1.6 1.6 0 0 1 4 11.8Z" />
      <path d="M8.2 8.1a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.5-.8 1" />
    </>
  ),
  cube: (
    <>
      <path d="m10 2.8 6.2 3.5v7.4L10 17.2l-6.2-3.5V6.3Z" />
      <path d="M3.9 6.3 10 9.8l6.1-3.5M10 9.8v7.3" />
    </>
  ),
  drag: (
    <>
      <circle cx="7.5" cy="6" r="1" />
      <circle cx="12.5" cy="6" r="1" />
      <circle cx="7.5" cy="10" r="1" />
      <circle cx="12.5" cy="10" r="1" />
      <circle cx="7.5" cy="14" r="1" />
      <circle cx="12.5" cy="14" r="1" />
    </>
  ),
  play: <path d="M6.5 4.8v10.4L15 10Z" />,
  pause: <path d="M7.5 5.5v9M12.5 5.5v9" />,
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M10 1.8a8.2 8.2 0 0 0-2.6 16c.4.1.6-.2.6-.4v-1.4c-2.3.5-2.8-1.1-2.8-1.1-.4-1-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.3.9 1.3.9.7 1.3 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.7-.9-3.7-4 0-.9.3-1.6.9-2.2-.1-.2-.4-1 .1-2.2 0 0 .7-.2 2.3.8a7.8 7.8 0 0 1 4.1 0c1.6-1 2.3-.8 2.3-.8.4 1.2.2 2 .1 2.2.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.3.6.8.6 1.5v2.3c0 .2.1.5.6.4A8.2 8.2 0 0 0 10 1.8Z"
    />
  ),
  linkedin: (
    <path
      fill="currentColor"
      stroke="none"
      d="M16.2 16.2h-2.6v-4.1c0-1 0-2.2-1.4-2.2s-1.6 1.1-1.6 2.2v4.2H8V7.8h2.5v1.1c.4-.7 1.2-1.4 2.5-1.4 2.7 0 3.2 1.8 3.2 4v4.7ZM5.1 6.7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm1.3 9.5H3.8V7.8h2.6v8.4Z"
    />
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Stripe's arrow: on hover the chevron slides right and a stem draws in behind it. */
export function HoverArrow({ size = 10 }: { size?: number }) {
  return (
    <svg className="hover-arrow" width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path className="ha-line" d="M0 5h7" />
        <path className="ha-tip" d="M1 1l4 4-4 4" />
      </g>
    </svg>
  );
}
