// Local visual verification and poster export for the procedural industry scenes.
// Run against the single existing dev server: node scripts/preview/industries.mjs --posters
import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
if (process.argv.includes('--hero')) {
  await import('./hero.mjs');
} else if (process.argv.includes('--engineering')) {
  await import('./engineering.mjs');
} else {
const nextRequire = createRequire(require.resolve('next/package.json'));
const sharp = nextRequire('sharp');
const baseURL = 'http://localhost:3000';
const exportPosters = process.argv.includes('--posters');
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.locator('#industries').scrollIntoViewIfNeeded();
  for (const kind of ['semiconductor', 'battery']) {
    await page.locator(`[data-industry-visual="${kind}"] canvas`).waitFor({ state: 'visible', timeout: 60000 });
  }
  if (exportPosters) {
    for (const kind of ['semiconductor', 'battery']) {
      await page.evaluate((kind) => {
        const visual = document.querySelector(`[data-industry-visual="${kind}"]`);
        const marker = document.createElement('span');
        marker.id = 'poster-marker';
        visual.before(marker);
        const stage = document.createElement('div');
        stage.id = 'poster-stage';
        stage.style.cssText = 'position:fixed;top:0;left:0;width:1100px;height:800px;z-index:2147483647';
        document.body.append(stage);
        stage.append(visual);
        const style = document.createElement('style');
        style.id = 'poster-style';
        style.textContent = 'html,body {background:transparent!important} body > :not(#poster-stage):not(#poster-style) {visibility:hidden!important} #poster-stage, #poster-stage * {visibility:visible!important} #poster-stage img {display:none!important}';
        document.head.append(style);
      }, kind);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const png = await page.locator('#poster-stage').screenshot({ omitBackground: true, animations: 'disabled' });
      const poster = await sharp(png).webp({ quality: 93, alphaQuality: 100 }).toBuffer();
      await writeFile(`public/industries/${kind}-concept.webp`, poster);
      console.log(`Poster ${kind}: ${poster.byteLength} bytes`);
      await page.evaluate(() => {
        const visual = document.querySelector('#poster-stage > div');
        document.querySelector('#poster-marker').replaceWith(visual);
        document.querySelector('#poster-stage').remove();
        document.querySelector('#poster-style').remove();
      });
    }
  }
  await page.locator('#industries').screenshot({ path: '/tmp/h3-industries-desktop.png', animations: 'disabled' });
  const panels = await page.locator('#industries article').evaluateAll((items) => items.map((el) => {
    const r = el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height};
  }));
  if (panels[0].y !== panels[1].y || panels[1].x <= panels[0].x) failures.push('Desktop panels are not side by side');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push('Desktop overflow');
  console.log('Desktop:', JSON.stringify(panels));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#industries').screenshot({ path: '/tmp/h3-industries-mobile.png', animations: 'disabled' });
  const mobilePanels = await page.locator('#industries article').evaluateAll((items) => items.map((el) => {
    const r = el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height};
  }));
  if (mobilePanels[1].y <= mobilePanels[0].y) failures.push('Mobile panels do not stack');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push('Mobile overflow');
  console.log('Mobile:', JSON.stringify(mobilePanels));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${baseURL}/en`, { waitUntil: 'domcontentloaded' });
  await page.locator('#industries').scrollIntoViewIfNeeded();
  for (const kind of ['semiconductor', 'battery']) {
    await page.locator(`[data-industry-visual="${kind}"] canvas`).waitFor({ state: 'visible', timeout: 60000 });
  }
  await page.locator('#industries').screenshot({ path: '/tmp/h3-industries-en.png', animations: 'disabled' });
  console.log('English:', await page.locator('#industries h2').allTextContents());
  for (const link of await page.locator('#industries a').all()) {
    if (await link.getAttribute('href') !== '/en/contact') failures.push('English CTA is not localized');
  }

  // Force real context loss on each live canvas and verify the rendered posters take over.
  await page.locator('[data-industry-visual] canvas').evaluateAll((canvases) => {
    for (const canvas of canvases) canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  for (const kind of ['semiconductor', 'battery']) {
    const img = page.locator(`[data-industry-visual="${kind}"] img`);
    await img.waitFor({ state:'visible', timeout:10000 });
    await img.evaluate(async (el) => { await el.decode(); });
  }
  await page.locator('#industries').screenshot({ path: '/tmp/h3-industries-fallback.png', animations:'disabled' });
  console.log('Context-loss fallback: both posters visible and decoded');
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('PASS: KR/EN, desktop/mobile, reduced motion, fallback, no page errors.');
} finally {
  await browser.close();
}
}
