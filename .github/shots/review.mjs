// Photographs the built portfolio (vite preview on :4173) for review: the new section,
// the Work header, and the nav menu, at desktop and phone widths, in both themes.
import { chromium } from 'playwright';

const OUT = process.env.OUT;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];

async function shoot(name, { width, height, dpr = 1, mobile = false, theme = 'light' }, fn) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, colorScheme: theme });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name} console: ${m.text()}`));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await fn(page);
  await ctx.close();
}

async function section(page, sel, file) {
  const el = page.locator(sel);
  await el.scrollIntoViewIfNeeded();
  // walk through it so every scroll reveal fires, then let the pings settle
  const box = await el.boundingBox();
  for (let y = 0; y < box.height; y += 400) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(2500);
  await el.screenshot({ path: `${OUT}/${file}`, animations: 'disabled' });
}

await shoot('desktop', { width: 1440, height: 900 }, async (page) => {
  await section(page, '#new', 'review-new-desktop.png');
  await page.locator('#work header').screenshot({ path: `${OUT}/review-work-head.png` });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /^Work/ }).first().hover();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/review-menu.png`, clip: { x: 0, y: 0, width: 1440, height: 760 } });
});
await shoot('dark', { width: 1440, height: 900, theme: 'dark' }, async (page) => {
  await section(page, '#new', 'review-new-dark.png');
});
await shoot('phone', { width: 390, height: 844, dpr: 2, mobile: true }, async (page) => {
  await section(page, '#new', 'review-new-phone.png');
});

await browser.close();
const fs = await import('node:fs');
fs.writeFileSync(`${OUT}/review-errors.txt`, errors.join('\n') || 'none');
console.log(errors.length ? errors.join('\n') : 'no page errors');
