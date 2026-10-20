// Captures the portfolio's three screenshot variants for each live site.
// cover: 1600x1000, full: 960 wide (capped at 3000 tall), mobile: 780x1688.
import { chromium } from 'playwright';
import sharp from 'sharp';

const SITES = [
  ['hookline', 'https://hookline-production-c636.up.railway.app/'],
  ['feast', 'https://feast-league-production.up.railway.app/'],
  ['specimen', 'https://specimen-atlas.vercel.app/'],
];
const only = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function grab(url, opts, full = false) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: 'no-preference', colorScheme: 'dark' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('  pageerror', String(e).slice(0, 140)));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => console.log('  goto', e.message.slice(0, 120)));
  await page.waitForTimeout(7000);
  if (full) {
    // walk down so lazy sections and scroll reveals render, then back up
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < Math.min(h, 4200); y += 500) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);
  }
  const buf = await page.screenshot({ fullPage: full, timeout: 60000 });
  await ctx.close();
  return buf;
}

for (const [id, url] of SITES) {
  if (only.length && !only.includes(id)) continue;
  console.log(id);
  const cover = await grab(url, { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.25 });
  await sharp(cover).resize(1600, 1000, { fit: 'cover', position: 'top' }).webp({ quality: 80 }).toFile(`${process.env.OUT}/${id}.webp`);
  const full = await grab(url, { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.75 }, true);
  const meta = await sharp(full).metadata();
  await sharp(full)
    .extract({ left: 0, top: 0, width: meta.width, height: Math.min(meta.height, 3000) })
    .resize({ width: 960 })
    .webp({ quality: 74 })
    .toFile(`${process.env.OUT}/${id}-full.webp`);
  const mobile = await grab(url, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sharp(mobile).resize(780, 1688, { fit: 'cover', position: 'top' }).webp({ quality: 78 }).toFile(`${process.env.OUT}/${id}-m.webp`);
  console.log('  ok');
}
await browser.close();
