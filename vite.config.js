import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { EXPERIENCE, PROFILE, PROJECTS } from './src/content/portfolio.js';

const SITE = 'https://zachbienstock.com';

// llms.txt for AI agents and crawlers, written at build time from the same
// content module the pages render, so it can't disagree with them.
function llmsTxt() {
  const project = (p) => {
    const url = p.url ?? `${SITE}/#work/${p.id}`;
    const sites = p.collection ? ` Sites: ${p.collection.map((s) => `[${s.name}](${s.url})`).join(', ')}.` : '';
    return `- [${p.name}](${url}): ${p.short}${sites}`;
  };
  const text = [
    `# ${PROFILE.name}`,
    '',
    `> ${PROFILE.summary}`,
    '',
    `Based in ${PROFILE.location}. The portfolio is a reading-first site (${SITE}) with a 3D version at ${SITE}/?3d.`,
    '',
    '## Projects',
    ...PROJECTS.map(project),
    '',
    '## Experience',
    ...EXPERIENCE.map((r) => `- ${r.role}, ${r.company} (${r.period})`),
    '',
    '## Contact',
    `- [Résumé (PDF)](${SITE}${PROFILE.resumePdfNamed})`,
    `- [GitHub](${PROFILE.socials.github})`,
    `- [LinkedIn](${PROFILE.socials.linkedin})`,
    `- [Email](mailto:${PROFILE.email})`,
    '',
  ].join('\n');
  return {
    name: 'llms-txt',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: text });
    },
  };
}

// The classic page's two faces and the headshot at the top of it, asked for
// while the HTML is still parsing. Otherwise they start downloading only once
// the page's JS and CSS arrive: the headline swapped fonts mid-render (a layout
// shift) and the portrait came in late. The 3D mode uses none of them, so the
// preload is skipped there.
const HEADSHOT = '/me/headshot.webp';
function preloadClassicFonts() {
  const faces = [/^assets\/mona-sans-latin-standard-normal-[\w-]+\.woff2$/, /^assets\/jetbrains-mono-latin-wght-normal-[\w-]+\.woff2$/];
  return {
    name: 'preload-classic-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((f) => faces.some((re) => re.test(f)));
        if (!files.length) return;
        const hrefs = JSON.stringify(files.map((f) => `/${f}`));
        const code =
          `(function(){var p=new URLSearchParams(location.search);if(p.has('3d')||p.has('embed'))return;` +
          `function pre(h,as,x){var l=document.createElement('link');l.rel='preload';l.as=as;l.href=h;for(var k in x)l[k]=x[k];document.head.appendChild(l)}` +
          `${hrefs}.forEach(function(h){pre(h,'font',{type:'font/woff2',crossOrigin:'anonymous'})});` +
          `pre('${HEADSHOT}','image',{type:'image/webp',fetchPriority:'high'})})()`;
        return [{ tag: 'script', children: code, injectTo: 'head-prepend' }];
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  // Tailwind only reaches the classic site: its stylesheet opts in with
  // `@import "tailwindcss"`, and the 3D modes keep their own plain CSS.
  plugins: [react(), tailwindcss(), llmsTxt(), preloadClassicFonts()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Some filesystems don't emit native watch events reliably — poll so edits hot-reload.
  server: {
    watch: { usePolling: true, interval: 250 },
  },
});
