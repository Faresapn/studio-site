#!/usr/bin/env node
/**
 * Screenshot pass for the responsive/quality check.
 *
 *   npm run build && npm start            # in one terminal (or point BASE at a preview URL)
 *   npm run screens                        # writes screens/<width>x<height>/*.png
 *
 * For every size it captures the site and the prototype (reference/prototype.html) the same way:
 * the loader mid-run, the hero, each home section, the open menu, a card→project transition
 * mid-flight and the project page. Files are paired as site-<name>.png / proto-<name>.png.
 *
 * Env: BASE (default http://localhost:3000), SIZES (e.g. "1512x945,390x844"), ONLY=site|proto
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE ?? 'http://localhost:3000';
const PROTO = pathToFileURL(path.join(root, 'reference/prototype.html')).href;
const SIZES = (process.env.SIZES ?? '1512x945,1280x800,1024x768,768x1024,390x844')
  .split(',')
  .map((s) => s.split('x').map(Number));
const ONLY = process.env.ONLY;

const sections = [
  { name: 'intro', text: 'Studio Name is a residential' },
  { name: 'works', text: 'Selected Works' },
  { name: 'band', text: 'How we work' },
  { name: 'cta', text: 'Have a site in mind?' },
  { name: 'footer', css: 'footer' },
];

const settle = (page, ms = 1600) => page.waitForTimeout(ms);

/** Scroll so the element sits 15% down the viewport, then let reveals play. */
async function scrollTo(page, loc) {
  await loc.first().evaluate((el) => {
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.15;
    window.scrollTo(0, Math.max(0, y));
  });
  await settle(page);
}

async function capture(browser, kind, [w, h]) {
  const dir = path.join(root, 'screens', `${w}x${h}`);
  await mkdir(dir, { recursive: true });
  const mobile = w < 700;
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    hasTouch: mobile,
    isMobile: mobile,
  });
  const page = await ctx.newPage();
  const shot = (name) => page.screenshot({ path: path.join(dir, `${kind}-${name}.png`) });
  const url = kind === 'site' ? BASE + '/' : PROTO + '#home';

  // loader, mid-run, then the hero once it has opened
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await shot('loader');
  await page.waitForTimeout(4000);
  await shot('hero');

  for (const s of sections) {
    const loc = s.css ? page.locator(s.css) : page.getByText(s.text, { exact: false });
    if ((await loc.count()) === 0) continue;
    await scrollTo(page, loc);
    await shot(s.name);
  }

  // second grid
  const grid2 = kind === 'site' ? page.locator('[data-grid]').nth(1) : page.locator('.grid.r3');
  if (await grid2.count()) {
    await scrollTo(page, grid2);
    await shot('grid2');
  }

  // menu
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page, 900);
  await page.locator(kind === 'site' ? 'button[aria-label="Open menu"]' : '#tab').click();
  await settle(page);
  await shot('menu');
  await page.keyboard.press('Escape');
  await settle(page, 1000);

  if (kind === 'site') {
    // card → project, mid-flight, then the settled project page
    const card = page.locator('[data-flip-id="a-0"]');
    await scrollTo(page, card);
    await card.click();
    await page.waitForTimeout(500);
    await shot('flip-mid');
    await page.waitForTimeout(1800);
    await shot('project');
    await page.mouse.wheel(0, h);
    await settle(page);
    await shot('project-info');
  }
  await ctx.close();
}

if (!existsSync(path.join(root, 'reference/prototype.html')) && ONLY !== 'site') {
  console.warn('reference/prototype.html not found; capturing the site only.');
}

const browser = await chromium.launch();
for (const size of SIZES) {
  if (ONLY !== 'proto') await capture(browser, 'site', size);
  if (ONLY !== 'site' && existsSync(path.join(root, 'reference/prototype.html'))) await capture(browser, 'proto', size);
  console.log(`✓ ${size.join('x')}`);
}
await browser.close();
