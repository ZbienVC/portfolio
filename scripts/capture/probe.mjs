// For each live site: can it be shown inside an <iframe> on another site, and what
// can a demo click on? Writes JSON to $OUT/probe.json. Run with Playwright installed.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const SITES = JSON.parse(process.env.SITES);
const out = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

for (const [id, url] of SITES) {
  const row = { id, url };
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    row.status = res.status;
    row.finalUrl = res.url;
    row.xfo = res.headers.get('x-frame-options');
    row.csp = (res.headers.get('content-security-policy') || '').match(/frame-ancestors[^;]*/)?.[0] ?? null;
  } catch (e) {
    row.error = String(e).slice(0, 160);
  }
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    row.title = await page.title();
    row.height = await page.evaluate(() => document.documentElement.scrollHeight);
    row.clickables = await page.evaluate(() =>
      [...document.querySelectorAll('button, a, [role=button]')]
        .filter((el) => el.offsetParent !== null)
        .map((el) => (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 50))
        .filter(Boolean)
        .slice(0, 45),
    );
    await ctx.close();
  } catch (e) {
    row.pageError = String(e).slice(0, 160);
  }
  out.push(row);
  console.log(id, row.status, row.xfo, row.csp, row.height);
}
await browser.close();
writeFileSync(`${process.env.OUT}/probe.json`, JSON.stringify(out, null, 2));
