// Tailwind v4 runs through its Vite plugin (see vite.config.js); PostCSS only
// adds vendor prefixes to the plain stylesheets the 3D modes use.
export default {
  plugins: {
    autoprefixer: {},
  },
};
