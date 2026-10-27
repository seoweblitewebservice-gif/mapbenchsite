import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
// On minimal Linux images Chromium needs the shared libraries bundled by this package.
const libDir = join(process.cwd(), '.cache', 'browser-libs');
mkdirSync(libDir, { recursive: true });
if (process.platform === 'linux') {
  const tar = join(libDir, 'runtime.tar');
  writeFileSync(tar, brotliDecompressSync(readFileSync('node_modules/@sparticuz/chromium/bin/al2023.tar.br')));
  execFileSync('tar', ['-xf', tar, '-C', libDir]);
}
import { chromium as playwright } from 'playwright-core';
import chromium from '@sparticuz/chromium';
const browser = await playwright.launch({args:chromium.args, executablePath:await chromium.executablePath(), headless:true, env:{...process.env,LD_LIBRARY_PATH:[join(libDir,"lib"),process.env.LD_LIBRARY_PATH].filter(Boolean).join(":")}});
const page = await browser.newPage({viewport:{width:375,height:812}});
// External services are intentionally blocked; these checks exercise local UI only.
await page.route('**/*', route => route.request().url().startsWith('http://localhost:3000') ? route.continue() : route.abort());
const failures=[];
page.on('pageerror', e=>failures.push(e.message));
await page.goto('http://localhost:3000/tools/center-of-polygon');
await page.locator('textarea').first().fill('0,0\n0,0.01\n0.01,0.01\n0.01,0');
await page.getByText('0.005000, 0.005000', {exact:true}).waitFor();
console.log('PASS mobile polygon centroid: interactive input returns expected centroid');
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Mobile horizontal overflow');
console.log('PASS centroid page fits 375px viewport');
await page.goto('http://localhost:3000/tools/heatmap-from-points');
await page.getByRole('button',{name:'…or paste CSV text'}).click();
await page.locator('textarea').first().fill('name,lat,lng\nA,0,0\nB,0,0.001\nBad,91,0');
await page.getByRole('button',{name:'Map pasted CSV'}).click();
await page.getByText('2 of 3 rows mapped',{exact:true}).waitFor();
await page.getByText('1 rows skipped (invalid coordinates)',{exact:true}).waitFor();
console.log('PASS mobile CSV heatmap: input parsed and invalid coordinate rejected');
await page.goto('http://localhost:3000/tools/true-north-vs-magnetic');
console.log('magnetic workspace',await page.locator('input[type=date]').count());
if(!await page.locator('input[type=date]').count()) throw new Error('Expected date in WMM workspace');
await page.goto('http://localhost:3000/tools/embed-map-link-helper');
if(!await page.locator('textarea').count())throw new Error('Expected iframe output');
console.log('PASS embed engine exposes iframe output');
console.log('page errors',JSON.stringify(failures));
await browser.close();
if(failures.length)process.exitCode=1;
