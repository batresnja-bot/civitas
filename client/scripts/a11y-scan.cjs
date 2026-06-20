/*
 * Accessibility scan (axe-core, WCAG 2 A/AA) over the key SPA pages.
 *
 * Usage: start the app first (CIVITAS_DEMO_MODE=true npm start) so the demo
 * role buttons exist, then from client/:  npm run a11y
 *
 * Exits non-zero if any violations are found, so it can gate CI.
 */
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = process.env.CIVITAS_BASE_URL || 'http://localhost:3000';
const AXE = require.resolve('axe-core/axe.min.js');

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

  const communities = await (await page.request.get(`${BASE}/api/communities`)).json();
  const slug = communities.communities[0].slug;

  // Sign in as the demo founder so authenticated pages render.
  await page.goto(`${BASE}/app/`, { waitUntil: 'networkidle' });
  await page
    .locator('text=View as Founder')
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(1200);

  const pages = {
    landing: '/app/',
    radar: '/app/radar',
    report: '/app/report',
    dashboard: '/app/dashboard',
    communities: '/app/c',
    community: `/app/c/${slug}`,
    'create-post': `/app/c/${slug}/new`,
    login: '/app/login',
    'case-study': '/app/case-study',
    'about-builder': '/app/about-builder',
  };

  let total = 0;
  for (const [name, route] of Object.entries(pages)) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.addScriptTag({ path: AXE });
    const violations = await page.evaluate(
      async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((v) => ({ id: v.id, n: v.nodes.length })),
    );
    const n = violations.reduce((s, v) => s + v.n, 0);
    total += n;
    console.log(name.padEnd(14), n === 0 ? 'clean' : JSON.stringify(violations));
  }
  console.log('\nTOTAL WCAG A/AA violations:', total);
  await browser.close();
  process.exit(total === 0 ? 0 : 1);
})().catch((e) => {
  console.error('a11y scan failed:', e.message);
  process.exit(2);
});
