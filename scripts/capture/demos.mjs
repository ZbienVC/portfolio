// Records the Work stage's automated demos: a short scripted visit to each live
// site, at laptop size and at phone size, trimmed to start once the page has
// loaded, then compressed for the web. Run in CI (needs Playwright, sharp, ffmpeg):
//   OUT=public/demos node demos.mjs [id ...]
//
// Recorded at retina scale. Playwright's own video, and the browser's frame
// stream under it, both come out at 1x (CSS pixels) whatever deviceScaleFactor
// says, which is why the old clips looked soft on the 3D laptop and phone. A
// browser started with --force-device-scale-factor streams frames at the full
// device size, so each view gets its own browser at its own scale, the frames
// are captured straight from that stream with their timestamps, and ffmpeg
// stitches them into the clip (holding each frame until the next one arrived).
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const OUT = process.env.OUT;
const TMP = '/tmp/demo-raw';
const LENGTH = 15; // seconds kept per clip

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Scroll by `dy` over `ms` with an ease-in-out, the way a person scrolls a page
 * they're reading. It turns the mouse wheel over the middle of the screen, so
 * pages that scroll inside a panel (app shells) move too, not just the window.
 */
async function glide(page, dy, ms = 1800) {
  const vp = page.viewportSize() ?? (await page.evaluate(() => ({ width: innerWidth, height: innerHeight })));
  await page.mouse.move(vp.width * 0.5, vp.height * 0.55);
  const steps = Math.max(8, Math.round(ms / 40));
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  let done = 0;
  for (let i = 1; i <= steps; i++) {
    const want = dy * ease(i / steps);
    await page.mouse.wheel(0, want - done).catch(() => {});
    done = want;
    await sleep(ms / steps);
  }
}

/** The old window-only scroll, kept for pages that ignore synthetic wheels. */
async function glideWindow(page, dy, ms = 1800) {
  await page.evaluate(
    ([dy, ms]) =>
      new Promise((done) => {
        const y0 = window.scrollY;
        const t0 = performance.now();
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
        const step = (now) => {
          const t = Math.min(1, (now - t0) / ms);
          window.scrollTo(0, y0 + dy * ease(t));
          if (t < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      }),
    [dy, ms],
  );
}

/** Move the pointer along a gentle arc so hover effects show. */
async function wander(page, w, h, steps = 24) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(w * (0.2 + 0.6 * t), h * (0.45 + 0.18 * Math.sin(t * Math.PI * 2)));
    await sleep(45);
  }
}

async function clickText(page, re, timeout = 2500) {
  const el = page.getByRole('button', { name: re }).or(page.getByRole('link', { name: re })).first();
  await el.click({ timeout });
}

// The generic visit: settle, look around, read down the page, come back up a little.
async function generic(page, { w, h, phone }) {
  await sleep(1800);
  if (!phone) await wander(page, w, h);
  await glide(page, h * 0.9, 2200);
  await sleep(1400);
  await glide(page, h * 0.9, 2200);
  await sleep(1600);
  await glide(page, -h * 1.8, 2400);
  await sleep(1200);
}

const SCRIPTS = {
  async feast(page, v) {
    // the 3D board takes a while to bake in a software renderer: wait out the loading screen
    await page.waitForFunction(() => !document.body.innerText.includes('Frosting the donut'), null, { timeout: 60000 }).catch(() => {});
    await sleep(2500);
    if (v.phone) return generic(page, v);
    try {
      await clickText(page, /add bot/i);
      await sleep(700);
      await clickText(page, /add bot/i);
      await sleep(700);
      await clickText(page, /start the feast/i);
      await sleep(11000);
    } catch {
      await generic(page, v);
    }
  },
  async specimen(page, v) {
    await sleep(3200);
    if (!v.phone) await wander(page, v.w, v.h);
    await glide(page, v.h * 1.1, 2400);
    await sleep(1800);
    if (!v.phone) {
      try {
        await page.keyboard.press('t');
        await sleep(2600);
        await page.keyboard.press('ArrowRight');
        await sleep(2600);
        await page.keyboard.press('Escape');
        await sleep(600);
      } catch {
        /* no theater: keep scrolling */
      }
    }
    await glide(page, v.h * 0.9, 2000);
    await sleep(1500);
  },
  async unearth(page, v) {
    await sleep(1500);
    try {
      const sample = page.locator('section[aria-label="Try a sample"] button.sample').first();
      await sample.scrollIntoViewIfNeeded({ timeout: 4000 });
      await sleep(700);
      await sample.click({ timeout: 4000 });
      await sleep(4500);
      if (!v.phone) {
        await wander(page, v.w, v.h);
        await page.keyboard.press('ArrowRight');
        await sleep(1600);
        await page.keyboard.press('ArrowRight');
        await sleep(1600);
      } else {
        await glide(page, v.h * 0.8, 2000);
        await sleep(2000);
      }
    } catch {
      await generic(page, v);
    }
  },
  // FieldSense is an app shell: walk its pages from the sidebar
  async fieldsense(page, v) {
    await sleep(1500);
    if (v.phone) return generic(page, v);
    for (const name of [/^board$/i, /^rankings$/i, /^props$/i]) {
      try {
        await clickText(page, name, 3000);
        await sleep(1200);
        await glide(page, v.h * 0.6, 1600);
        await sleep(900);
      } catch {
        /* that page isn't there: try the next */
      }
    }
  },
};

const SITES = JSON.parse(process.env.DEMOS);
const only = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });

// w × h is the page's size in CSS pixels; dpr is how many device pixels each one gets; out is the clip's size
const VIEWS = [
  { suffix: 'laptop', w: 1280, h: 800, dpr: 1.5, phone: false, out: '1920:1200', crf: 27 },
  { suffix: 'phone', w: 390, h: 844, dpr: 2, phone: true, out: '780:1688', crf: 26 },
];
const PHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/** Stream the page's frames at device size to disk; stop() returns them with their timestamps. */
async function startRecording(page, dir) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = `${dir}/f${String(frames.length).padStart(6, '0')}.jpg`;
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 4096, maxHeight: 4096, everyNthFrame: 1 });
  return async () => {
    await cdp.send('Page.stopScreencast').catch(() => {});
    return { frames, end: Date.now() / 1000 };
  };
}

/** An ffconcat list that holds each frame on screen until the next one came in. */
function concatList({ frames, end }) {
  const lines = ['ffconcat version 1.0'];
  frames.forEach((f, i) => {
    const next = frames[i + 1]?.t ?? end;
    lines.push(`file '${f.file}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`);
  });
  lines.push(`file '${frames.at(-1).file}'`); // the demuxer drops the last entry's duration otherwise
  return lines.join('\n');
}

for (const v of VIEWS) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [
      '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
      `--force-device-scale-factor=${v.dpr}`, `--window-size=${v.w},${v.h}`,
    ],
  });
  for (const [id, url] of SITES) {
    if (only.length && !only.includes(id)) continue;
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(TMP, { recursive: true });
    // no viewport: the window is the viewport, so the browser's own scale factor stands
    const ctx = await browser.newContext({
      viewport: null,
      hasTouch: v.phone,
      userAgent: v.phone ? PHONE_UA : undefined,
      colorScheme: 'dark',
    });
    const page = await ctx.newPage();
    const stop = await startRecording(page, TMP);
    let loaded = 0;
    try {
      // 'load', not 'networkidle': apps with live connections never go quiet
      await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await sleep(2200);
      loaded = Date.now() / 1000;
      await (SCRIPTS[id] ?? generic)(page, v);
    } catch (e) {
      console.log(`  ${id} ${v.suffix}: ${String(e).slice(0, 120)}`);
    }
    const rec = await stop();
    await ctx.close();
    if (rec.frames.length < 2) {
      console.log(`  ${id} ${v.suffix}: no video`);
      continue;
    }
    writeFileSync(`${TMP}/list.txt`, concatList(rec));
    const base = `${OUT}/${id}-${v.suffix}`;
    // start just before the page finished loading, measured on the frames' own clock
    const start = Math.max(0, loaded - 0.4 - rec.frames[0].t).toFixed(2);
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${TMP}/list.txt`, '-ss', start, '-t', String(LENGTH),
      '-an', '-vf', `fps=24,scale=${v.out}:flags=lanczos,format=yuv420p`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(v.crf), '-profile:v', 'high', '-movflags', '+faststart',
      `${base}.mp4`,
    ]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '0.3', '-i', `${base}.mp4`, '-frames:v', '1', `${TMP}/poster.png`]);
    await sharp(`${TMP}/poster.png`).webp({ quality: 82 }).toFile(`${base}.webp`);
    const fps = rec.frames.length / Math.max(1, rec.end - rec.frames[0].t);
    console.log(`  ${id} ${v.suffix}: ${(statSync(`${base}.mp4`).size / 1024).toFixed(0)} KB, ${v.out}, ${fps.toFixed(1)} frames/s captured, trimmed ${start}s`);
  }
  await browser.close();
}
