import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const [, , url, out] = process.argv;
if (!url || !out) { console.error('usage: node scripts/shoot.mjs <url> <outfile>'); process.exit(1); }

const root = join(homedir(), '.cache', 'ms-playwright');
// headless-shell first (lighter), then full chrome; newest build dir first.
const dirs = readdirSync(root)
  .filter((d) => d.startsWith('chromium'))
  .sort()
  .reverse();
const candidates = [
  'chrome-headless-shell-linux64/chrome-headless-shell',
  'chrome-linux64/chrome',
  'chrome-linux/headless_shell',
  'chrome-linux/chrome',
];
let bin = null;
for (const d of dirs) {
  for (const cand of candidates) {
    const p = join(root, d, cand);
    if (existsSync(p)) { bin = p; break; }
  }
  if (bin) break;
}
if (!bin) { console.error('no chromium found under', root); process.exit(1); }

const r = spawnSync(bin, [
  '--headless', '--no-sandbox',
  // Software WebGL: modern chrome-headless-shell needs these to give Three a context.
  '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--use-gl=angle', '--use-angle=swiftshader',
  '--window-size=1600,900', '--hide-scrollbars',
  `--screenshot=${out}`, '--virtual-time-budget=6000', url,
], { encoding: 'utf8' });
console.log(r.stderr || '', 'wrote', out);
