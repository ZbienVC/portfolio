// PlatoMark — Plato brand logo (fork + bowl + leaves + arc swoosh).
// Vector recreation of the app icon; scales cleanly at any size.
export default function PlatoMark({ size = 48, rounded = true, className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Plato"
      role="img"
    >
      <defs>
        <linearGradient id="pmp-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A7D2C" />
          <stop offset="1" stopColor="#235A20" />
        </linearGradient>
        <linearGradient id="pmp-bowl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2EFE0" />
          <stop offset="1" stopColor="#DED9C2" />
        </linearGradient>
        <linearGradient id="pmp-leaf-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A6D86B" />
          <stop offset="1" stopColor="#7CB342" />
        </linearGradient>
        <linearGradient id="pmp-leaf-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5BA82E" />
          <stop offset="1" stopColor="#3C7D1E" />
        </linearGradient>
        <filter id="pmp-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor="#0c2c0c" floodOpacity="0.35" />
        </filter>
      </defs>

      {rounded && <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="url(#pmp-bg)" />}

      <path d="M28 33 A26 26 0 1 1 27 67" stroke="#9CCC65" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.92" filter="url(#pmp-shadow)" />

      <path d="M44 56 C30 54 21 44 21 33 C33 33 43 41 45 53 Z" fill="url(#pmp-leaf-light)" filter="url(#pmp-shadow)" />
      <path d="M22 33 C31 39 39 47 45 54" stroke="#5C9C2C" strokeWidth="1.4" fill="none" opacity="0.5" />

      <path d="M56 58 C70 55 78 45 78 35 C66 36 57 44 55 55 Z" fill="url(#pmp-leaf-dark)" filter="url(#pmp-shadow)" />
      <path d="M77 36 C68 41 61 49 55 56" stroke="#2C6614" strokeWidth="1.4" fill="none" opacity="0.5" />

      <path d="M70 26 C76 20 84 20 86 22 C84 30 76 32 70 28 Z" fill="url(#pmp-leaf-light)" filter="url(#pmp-shadow)" />

      <path d="M20 60 C28 78 42 86 50 86 C58 86 72 78 80 60 C66 66 56 67 50 67 C44 67 34 66 20 60 Z" fill="url(#pmp-bowl)" filter="url(#pmp-shadow)" />

      <g fill="url(#pmp-bowl)" filter="url(#pmp-shadow)">
        <rect x="41.5" y="22" width="2.6" height="20" rx="1.3" />
        <rect x="46.6" y="22" width="2.6" height="20" rx="1.3" />
        <rect x="51.7" y="22" width="2.6" height="20" rx="1.3" />
        <path d="M41.5 40 C41.5 47 44 47 47.4 47 C50.8 47 54.3 47 54.3 40 C54.3 44 51 44 47.9 44 C44.8 44 41.5 44 41.5 40 Z" />
        <path d="M45.6 46 C45.6 56 44 64 50 70 C56 64 54.3 56 49.6 46 Z" />
      </g>
    </svg>
  );
}
