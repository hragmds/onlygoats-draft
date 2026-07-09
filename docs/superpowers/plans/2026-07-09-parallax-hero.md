# Parallax Depth-Drift Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the onlygoatz.com homepage's low-res 480p video hero with a live, framework-agnostic Three.js hero whose real card scans drift with subtle depth-parallax as the visitor scrolls.

**Architecture:** A single vanilla-JS engine (`initOgHero`) built on pure, unit-tested motion math is consumed by two thin hosts: the Astro replica (for client sign-off) imports the source directly; the Shopify section loads an esbuild-bundled single asset. Same source of truth for both, so what the client approves is what ships.

**Tech Stack:** Three.js 0.128 (already vendored), Astro 5 (demo host), esbuild (Shopify bundle), Node built-in test runner (`node --test`) for motion math, headless Chromium (cached Playwright build) for visual verification.

## Global Constraints

- Three.js version: pin to the vendored `three@0.128.0`. `RoundedBoxGeometry` is imported from `three/examples/jsm/geometries/RoundedBoxGeometry.js` (path valid in 0.128). Do not upgrade Three.
- Module authoring: `src/hero/*.js` must be framework-agnostic vanilla ES modules — no Astro, no Shopify, no bundler-only syntax. The only runtime dependency is Three.
- Repo is `"type": "module"` — all new `.js` files are ESM.
- Card image filenames (verbatim, in `public/assets/` and `src/assets/`): `Gretzky OPC front.jpg`, `Henderson Topps front.jpg`, `Jordan Fleer front.jpg`, `Jordan Star front.jpg`, `Tiger Woods Front.jpg`, `Trout Bowman Auto front.jpg`, plus back texture `back.png`. Filenames contain spaces — URL-encode per-filename, never the base path.
- Astro `base` is `/onlygoats-draft` (from `astro.config.mjs`); demo asset URLs are `/onlygoats-draft/assets/<file>`.
- Hero copy (verbatim): headline lines "Unbox the Legends." / "Discover Your GOAT.", button "Shop Now" → `https://onlygoatz.com/collections/all`.
- Accessibility/perf: honor `prefers-reduced-motion: reduce` (render one static frame, no loop, no mouse listener); cap `devicePixelRatio` at 2; pause the render loop when the hero is off-screen (IntersectionObserver).
- Debug hook: `initOgHero` reads `?ogscroll=<0..1>` from the URL and, when present, forces scroll progress to that value — used by headless screenshots to verify scroll states.

---

## File Structure

**Phase 1 — engine + Astro demo**
- Create `src/hero/motion.js` — pure motion math (no Three, no DOM). Unit-tested.
- Create `test/motion.test.js` — `node --test` suite for `motion.js`.
- Create `src/hero/hero-config.js` — card layout + scene constants + `buildCards(basePath)`.
- Create `src/hero/og-hero.js` — the engine: Three scene/renderer/lights/meshes, rAF loop wired to `motion.js`, lifecycle + safeguards. Exports `initOgHero`.
- Modify `src/components/HeroCanvas.astro` — call `initOgHero` instead of the inline `RegularCards` logic.
- Create `scripts/shoot.mjs` — headless-Chromium screenshot helper for verification.

**Phase 2 — Shopify package**
- Create `src/hero/shopify-entry.js` — bundle entry exposing `window.OGHero.init`.
- Create `build/build-shopify.mjs` — esbuild bundle → `shopify/assets/og-hero.min.js`.
- Create `shopify/og-hero.liquid` — section markup + `{% schema %}` + inline init.
- Create `shopify/test-harness.html` — standalone page mimicking the Shopify embed for verification.
- Create `shopify/README.md` — client install steps.

---

## Task 0: Branch and checkpoint existing WIP

**Files:** none created; git state only.

The working tree has uncommitted WIP (`src/pages/index.astro`, `src/components/HeroCanvas.astro`, `src/scripts/three-setup.js`) and an untracked `.playwright-cli/`. Preserve it and start our work on a clean branch off `main`.

- [ ] **Step 1: Confirm current state**

Run: `git -C /mnt/nvme_fast/workspace/mitten/onlygoats status --short`
Expected: shows ` M src/...` entries and `?? .playwright-cli/`.

- [ ] **Step 2: Ignore the local browser-log dir**

Add `.playwright-cli/` to `.gitignore` (append a line).

- [ ] **Step 3: Create the feature branch**

Run: `git checkout -b feat/parallax-hero`
Expected: "Switched to a new branch 'feat/parallax-hero'".

- [ ] **Step 4: Commit the pre-existing WIP as a checkpoint**

```bash
git add -A
git commit -m "checkpoint: pre-existing scrape refresh + testimonials WIP"
```
Expected: commit succeeds; `git status` clean.

---

## Task 1: Pure motion math (`motion.js`) — TDD

**Files:**
- Create: `src/hero/motion.js`
- Test: `test/motion.test.js`

**Interfaces:**
- Produces:
  - `clamp(v, lo, hi) → number`
  - `computeScrollProgress(rectTop, heroHeight) → number` in `[0,1]`. `0` when the hero's top is at/below the viewport top (`rectTop >= 0`); `1` once scrolled a full `heroHeight` past (`rectTop <= -heroHeight`); linear between.
  - `cardTransform(card, scrollProgress, timeSec, ranges) → { x, y, z, rotX, rotY, rotZ }` (absolute values). `card` = `{ x, y, z, rotX, rotY, rotZ, parallax, floatPhase, floatAmp }`. `ranges` = `{ floatSpeed, swayAmp, scrollDriftY, scrollDriftZ }`.
  - `cameraOffset(mouseX, mouseY, ranges) → { x, y }` with `mouseX,mouseY ∈ [-1,1]`, result clamped to `±ranges.maxMouseOffset`, scaled by `ranges.mouseInfluence`.

- [ ] **Step 1: Write the failing tests**

Create `test/motion.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, computeScrollProgress, cardTransform, cameraOffset } from '../src/hero/motion.js';

test('clamp bounds a value', () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(clamp(0.5, 0, 1), 0.5);
});

test('computeScrollProgress maps hero rect to 0..1', () => {
  assert.equal(computeScrollProgress(0, 600), 0);      // pinned at top
  assert.equal(computeScrollProgress(-300, 600), 0.5); // halfway out
  assert.equal(computeScrollProgress(-600, 600), 1);   // fully out
  assert.equal(computeScrollProgress(100, 600), 0);    // still below top -> clamped
  assert.equal(computeScrollProgress(-9999, 600), 1);  // way past -> clamped
});

test('cardTransform at rest returns base pose', () => {
  const card = { x: 1, y: 2, z: 3, rotX: 0.1, rotY: 0.2, rotZ: 0.3, parallax: 1, floatPhase: 0, floatAmp: 0.2 };
  const ranges = { floatSpeed: 0.6, swayAmp: 0.04, scrollDriftY: 6, scrollDriftZ: 3 };
  const t = cardTransform(card, 0, 0, ranges); // sin(0)=0 -> no float, no drift
  assert.equal(t.x, 1);
  assert.equal(t.y, 2);
  assert.equal(t.z, 3);
  assert.equal(t.rotZ, 0.3);
});

test('cardTransform: near cards (higher parallax) drift more than far cards', () => {
  const ranges = { floatSpeed: 0.6, swayAmp: 0.04, scrollDriftY: 6, scrollDriftZ: 3 };
  const near = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, parallax: 1.0, floatPhase: 0, floatAmp: 0 };
  const far  = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, parallax: 0.3, floatPhase: 0, floatAmp: 0 };
  const nearY = cardTransform(near, 1, 0, ranges).y;
  const farY  = cardTransform(far, 1, 0, ranges).y;
  assert.ok(nearY < farY, `near ${nearY} should drift above far ${farY}`);
  assert.ok(nearY < 0, 'cards drift upward as scrollProgress increases');
});

test('cameraOffset scales and clamps mouse input', () => {
  const ranges = { mouseInfluence: 0.35, maxMouseOffset: 0.8 };
  const c = cameraOffset(0.5, -0.5, ranges);
  assert.ok(Math.abs(c.x - 0.175) < 1e-9);
  assert.ok(Math.abs(c.y + 0.175) < 1e-9);
  assert.equal(cameraOffset(100, 100, ranges).x, 0.8);   // clamped high
  assert.equal(cameraOffset(-100, -100, ranges).y, -0.8); // clamped low
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/motion.test.js`
Expected: FAIL — "Cannot find module '../src/hero/motion.js'".

- [ ] **Step 3: Implement `src/hero/motion.js`**

```js
// Pure motion math for the OG hero. No Three, no DOM — unit-testable.

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// rectTop: hero getBoundingClientRect().top; heroHeight: hero pixel height.
// 0 while the hero sits at/below the viewport top, ramping to 1 once it has
// scrolled a full height past the top.
export function computeScrollProgress(rectTop, heroHeight) {
  if (heroHeight <= 0) return 0;
  return clamp(-rectTop / heroHeight, 0, 1);
}

// Absolute pose for a card given scroll + time. Cards drift UP as progress
// rises, scaled by their parallax factor (near cards move more).
export function cardTransform(card, scrollProgress, timeSec, ranges) {
  const float = Math.sin(timeSec * ranges.floatSpeed + card.floatPhase) * card.floatAmp;
  const sway = Math.sin(timeSec * ranges.floatSpeed * 0.7 + card.floatPhase) * ranges.swayAmp;
  const driftY = scrollProgress * card.parallax * ranges.scrollDriftY;
  const driftZ = scrollProgress * card.parallax * ranges.scrollDriftZ;
  return {
    x: card.x,
    y: card.y + float - driftY,
    z: card.z + driftZ,
    rotX: card.rotX,
    rotY: card.rotY,
    rotZ: card.rotZ + sway,
  };
}

// Mouse in [-1,1] -> small clamped camera offset for subtle parallax tilt.
export function cameraOffset(mouseX, mouseY, ranges) {
  const m = ranges.maxMouseOffset;
  return {
    x: clamp(mouseX * ranges.mouseInfluence, -m, m),
    y: clamp(mouseY * ranges.mouseInfluence, -m, m),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/motion.test.js`
Expected: PASS — 5 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/hero/motion.js test/motion.test.js
git commit -m "feat(hero): pure parallax motion math with tests"
```

---

## Task 2: Hero composition config (`hero-config.js`)

**Files:**
- Create: `src/hero/hero-config.js`
- Test: `test/hero-config.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `SCENE` — object of scene/motion constants: `{ cameraZ, fov, background, ambient, keyLight, rimLight, floatSpeed, swayAmp, scrollDriftY, scrollDriftZ, mouseInfluence, maxMouseOffset, pixelRatioCap }`.
  - `CARD_LAYOUT` — array of 6 `{ file, x, y, z, rotX, rotY, rotZ, parallax, floatPhase, floatAmp }`.
  - `buildCards(basePath, layout = CARD_LAYOUT) → [{ ...layoutEntry, src }]` where `src = basePath + encodeURIComponent(file)`.

- [ ] **Step 1: Write the failing test**

Create `test/hero-config.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE, CARD_LAYOUT, buildCards } from '../src/hero/hero-config.js';

test('CARD_LAYOUT has 6 well-formed cards', () => {
  assert.equal(CARD_LAYOUT.length, 6);
  for (const c of CARD_LAYOUT) {
    for (const k of ['file', 'x', 'y', 'z', 'parallax', 'floatPhase', 'floatAmp']) {
      assert.ok(k in c, `card missing ${k}`);
    }
  }
});

test('cards span a range of depths and parallax factors', () => {
  const zs = CARD_LAYOUT.map((c) => c.z);
  const px = CARD_LAYOUT.map((c) => c.parallax);
  assert.ok(Math.max(...zs) - Math.min(...zs) >= 2, 'need real depth spread');
  assert.ok(Math.max(...px) - Math.min(...px) >= 0.5, 'need parallax spread');
});

test('buildCards prefixes and URL-encodes filenames', () => {
  const cards = buildCards('/onlygoats-draft/assets/');
  assert.equal(cards.length, 6);
  assert.ok(cards[0].src.startsWith('/onlygoats-draft/assets/'));
  assert.ok(!cards[0].src.includes(' '), 'spaces must be encoded');
  assert.ok(cards.some((c) => c.src.includes('%20')), 'a filename with a space should encode to %20');
});

test('SCENE carries the constants the engine needs', () => {
  for (const k of ['cameraZ', 'fov', 'background', 'floatSpeed', 'scrollDriftY', 'maxMouseOffset', 'pixelRatioCap']) {
    assert.ok(k in SCENE, `SCENE missing ${k}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/hero-config.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/hero/hero-config.js`**

```js
// Composition + scene constants for the OG hero. Tweak here to restyle
// without touching engine or math.

export const SCENE = {
  cameraZ: 8,
  fov: 55,
  background: 0x0b0b0f,
  ambient: 0.55,
  keyLight: 0.85,
  rimLight: 0.6,
  floatSpeed: 0.6,
  swayAmp: 0.045,
  scrollDriftY: 6,
  scrollDriftZ: 3,
  mouseInfluence: 0.35,
  maxMouseOffset: 0.8,
  pixelRatioCap: 2,
};

// Loose, asymmetric arrangement across mixed Z-depths. Near cards (larger z,
// higher parallax) sit toward the camera and move most on scroll.
export const CARD_LAYOUT = [
  { file: 'Henderson Topps front.jpg',   x:  0.2, y:  0.1, z:  2.4, rotX:  0.00, rotY:  0.10, rotZ:  0.03, parallax: 1.15, floatPhase: 0.7, floatAmp: 0.24 },
  { file: 'Jordan Fleer front.jpg',      x: -3.2, y:  0.6, z:  1.5, rotX:  0.05, rotY:  0.35, rotZ: -0.12, parallax: 1.00, floatPhase: 0.0, floatAmp: 0.22 },
  { file: 'Gretzky OPC front.jpg',       x:  3.0, y: -0.4, z:  0.8, rotX: -0.04, rotY: -0.30, rotZ:  0.10, parallax: 0.85, floatPhase: 1.1, floatAmp: 0.20 },
  { file: 'Trout Bowman Auto front.jpg', x: -1.4, y: -1.1, z: -0.5, rotX:  0.02, rotY:  0.20, rotZ:  0.05, parallax: 0.60, floatPhase: 2.3, floatAmp: 0.16 },
  { file: 'Tiger Woods Front.jpg',       x:  1.6, y:  1.2, z: -1.2, rotX: -0.03, rotY: -0.15, rotZ: -0.08, parallax: 0.45, floatPhase: 3.0, floatAmp: 0.14 },
  { file: 'Jordan Star front.jpg',       x: -2.2, y:  1.6, z: -2.0, rotX:  0.03, rotY:  0.25, rotZ:  0.14, parallax: 0.35, floatPhase: 4.2, floatAmp: 0.12 },
];

export function buildCards(basePath, layout = CARD_LAYOUT) {
  return layout.map((c) => ({ ...c, src: basePath + encodeURIComponent(c.file) }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/hero-config.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/hero/hero-config.js test/hero-config.test.js
git commit -m "feat(hero): card layout and scene config"
```

---

## Task 3: The engine (`og-hero.js`)

**Files:**
- Create: `src/hero/og-hero.js`

**Interfaces:**
- Consumes: `SCENE`, `buildCards` from `hero-config.js`; `computeScrollProgress`, `cardTransform`, `cameraOffset`, `clamp` from `motion.js`; `THREE`, `RoundedBoxGeometry`.
- Produces: `initOgHero(container, options = {}) → { destroy() }`.
  - `options.basePath` (string, default `''`) — prefix for default card + back-texture URLs.
  - `options.cards` (array) — overrides `buildCards(basePath)`.
  - `options.backSrc` (string) — overrides `basePath + 'back.png'`.
  - `options.scene` (object) — shallow-merged over `SCENE`.
  - Reads `?ogscroll=` for forced scroll progress (verification hook).

- [ ] **Step 1: Implement `src/hero/og-hero.js`**

```js
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { SCENE, buildCards } from './hero-config.js';
import { computeScrollProgress, cardTransform, cameraOffset, clamp } from './motion.js';

export function initOgHero(container, options = {}) {
  if (!container) throw new Error('initOgHero: container is required');

  const scene = new THREE.Scene();
  const cfg = { ...SCENE, ...(options.scene || {}) };
  const basePath = options.basePath || '';
  const cards = options.cards || buildCards(basePath);
  const backSrc = options.backSrc || basePath + 'back.png';

  const forcedParam = new URLSearchParams(location.search).get('ogscroll');
  const forcedProgress = forcedParam === null ? null : clamp(parseFloat(forcedParam), 0, 1);
  const reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  scene.background = new THREE.Color(cfg.background);

  const camera = new THREE.PerspectiveCamera(cfg.fov, 16 / 9, 0.01, 100);
  camera.position.z = cfg.cameraZ;

  scene.add(new THREE.AmbientLight(0xffffff, cfg.ambient));
  const key = new THREE.DirectionalLight(0xffffff, cfg.keyLight);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, cfg.rimLight);
  rim.position.set(-6, -2, -4);
  scene.add(rim);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, cfg.pixelRatioCap));
  container.appendChild(renderer.domElement);

  const loader = new THREE.TextureLoader();
  const backTexture = loader.load(backSrc);
  const edge = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7, roughness: 0.25 });
  const geometry = new RoundedBoxGeometry(1.5, 2.1, 0.05, 4, 0.06);

  const meshes = cards.map((card) => {
    const front = loader.load(card.src);
    const materials = [edge, edge, edge, edge,
      new THREE.MeshStandardMaterial({ map: front }),
      new THREE.MeshStandardMaterial({ map: backTexture })];
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.userData.card = card;
    scene.add(mesh);
    return mesh;
  });

  const ranges = {
    floatSpeed: cfg.floatSpeed, swayAmp: cfg.swayAmp,
    scrollDriftY: cfg.scrollDriftY, scrollDriftZ: cfg.scrollDriftZ,
    mouseInfluence: cfg.mouseInfluence, maxMouseOffset: cfg.maxMouseOffset,
  };

  let mouseX = 0, mouseY = 0, camX = 0, camY = 0;
  function onMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
  }

  function resize() {
    const w = container.offsetWidth, h = container.offsetHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function frame(now, timeSec) {
    const rect = container.getBoundingClientRect();
    const progress = forcedProgress !== null
      ? forcedProgress
      : computeScrollProgress(rect.top, rect.height || container.offsetHeight);

    for (const mesh of meshes) {
      const t = cardTransform(mesh.userData.card, progress, timeSec, ranges);
      mesh.position.set(t.x, t.y, t.z);
      mesh.rotation.set(t.rotX, t.rotY, t.rotZ);
    }

    const target = cameraOffset(mouseX, mouseY, ranges);
    camX += (target.x - camX) * 0.08;
    camY += (target.y - camY) * 0.08;
    camera.position.set(camX, camY, cfg.cameraZ);
    camera.lookAt(camX * 0.5, camY * 0.5, 0);

    renderer.render(scene, camera);
  }

  // --- lifecycle ---
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let rafId = null;
  let visible = true;
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    frame(now, now * 0.001);
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && rafId === null && !reduceMotion) {
      rafId = requestAnimationFrame(loop);
    } else if (!visible && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }, { threshold: 0 });
  io.observe(container);

  if (reduceMotion) {
    frame(0, 0); // one static composed frame, no loop, no mouse tracking
  } else {
    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(loop);
  }

  return {
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
```

- [ ] **Step 2: Type-check the module parses (no test harness for WebGL yet)**

Run: `node --check src/hero/og-hero.js`
Expected: no output, exit 0 (syntax valid).

- [ ] **Step 3: Confirm the pure suites still pass**

Run: `node --test test/`
Expected: PASS — all tests from Tasks 1–2.

- [ ] **Step 4: Commit**

```bash
git add src/hero/og-hero.js
git commit -m "feat(hero): three.js engine with scroll parallax + safeguards"
```

---

## Task 4: Wire the engine into the Astro demo

**Files:**
- Modify: `src/components/HeroCanvas.astro`

Replace the inline `RegularCards` orbit logic with a call to `initOgHero`, passing the Astro asset base path. Leave `src/scripts/RegularCards.js` in place (unused, out of scope).

**Interfaces:**
- Consumes: `initOgHero` from `../hero/og-hero.js`.

- [ ] **Step 1: Replace the component script**

Full new contents of `src/components/HeroCanvas.astro`:
```astro
---
---

<div id="hero-canvas-container"></div>

<style>
  #hero-canvas-container {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: 16px;
    overflow: hidden;
  }
  /* CSS vignette for depth — cheaper than a WebGL pass */
  #hero-canvas-container::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(0,0,0,0.55) 100%);
  }
</style>

<script>
  import { initOgHero } from '../hero/og-hero.js';

  const container = document.getElementById('hero-canvas-container');
  if (container) {
    initOgHero(container, { basePath: '/onlygoats-draft/assets/' });
  }
</script>
```

- [ ] **Step 2: Build the site**

Run: `npm run build`
Expected: build completes, `dist/` regenerated, no errors. Three + hero modules are bundled by Vite.

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroCanvas.astro
git commit -m "feat(hero): mount parallax hero in Astro demo"
```

---

## Task 5: Visual verification harness + screenshots

**Files:**
- Create: `scripts/shoot.mjs`

Drive the cached headless Chromium to load the built demo at forced scroll positions and save screenshots for eyeballing. Locate the Chromium binary under `~/.cache/ms-playwright/` (a `chromium_headless_shell-*/chrome-linux/headless_shell` build exists).

**Interfaces:**
- CLI: `node scripts/shoot.mjs <url> <outfile>`.

- [ ] **Step 1: Write the screenshot helper**

Create `scripts/shoot.mjs`:
```js
import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const [, , url, out] = process.argv;
if (!url || !out) { console.error('usage: node scripts/shoot.mjs <url> <outfile>'); process.exit(1); }

const root = join(homedir(), '.cache', 'ms-playwright');
const dirs = readdirSync(root).filter((d) => d.startsWith('chromium'));
let bin = null;
for (const d of dirs) {
  for (const cand of ['chrome-linux/headless_shell', 'chrome-linux/chrome']) {
    const p = join(root, d, cand);
    if (existsSync(p)) { bin = p; break; }
  }
  if (bin) break;
}
if (!bin) { console.error('no chromium found under', root); process.exit(1); }

const r = spawnSync(bin, [
  '--headless', '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader',
  '--window-size=1600,900', '--hide-scrollbars',
  `--screenshot=${out}`, '--virtual-time-budget=4000', url,
], { encoding: 'utf8' });
console.log(r.stderr || '', 'wrote', out);
```

- [ ] **Step 2: Start a static server for the built demo (background)**

Run: `npm run preview -- --port 4321 &` then wait ~2s.
Expected: Astro preview serving `dist/` at `http://localhost:4321/onlygoats-draft/`.

- [ ] **Step 3: Capture three scroll states**

```bash
node scripts/shoot.mjs "http://localhost:4321/onlygoats-draft/?ogscroll=0"   /home/hrag/.claude/jobs/91ca1940/tmp/hero-0.png
node scripts/shoot.mjs "http://localhost:4321/onlygoats-draft/?ogscroll=0.5" /home/hrag/.claude/jobs/91ca1940/tmp/hero-50.png
node scripts/shoot.mjs "http://localhost:4321/onlygoats-draft/?ogscroll=1"   /home/hrag/.claude/jobs/91ca1940/tmp/hero-100.png
```
Expected: three PNGs written.

- [ ] **Step 4: Read the screenshots and confirm**

Read each PNG. Confirm: cards render with front scans, are spread at varied depths/sizes (not a ring), and the arrangement visibly shifts upward from `ogscroll=0` → `1` with near cards moving more than far. Kill the preview server.

- [ ] **Step 5: Commit**

```bash
git add scripts/shoot.mjs
git commit -m "chore(hero): headless screenshot verification helper"
```

---

## Task 6: Deploy the demo for client sign-off

**Files:** none (uses existing `.github/workflows/deploy.yml`).

- [ ] **Step 1: Push the branch and open review**

The repo auto-deploys `main` to GitHub Pages. To get a shareable link, merge to `main` (fast-forward) once screenshots look right, or push `feat/parallax-hero` and confirm with the user before merging.

Run: `git push -u origin feat/parallax-hero`
Expected: branch pushed.

- [ ] **Step 2: Report the pending client link**

Tell the user: once merged to `main`, the demo is at `https://hragmds.github.io/onlygoats-draft/`. Ask whether to merge now or after their review of the local screenshots.

---

## Task 7: Shopify bundle entry + build

**Files:**
- Create: `src/hero/shopify-entry.js`
- Create: `build/build-shopify.mjs`

**Interfaces:**
- `shopify-entry.js` exports `init(container, options)` → forwards to `initOgHero`. Bundled under global `OGHero`, so production calls `window.OGHero.init(...)`.

- [ ] **Step 1: Write the bundle entry**

Create `src/hero/shopify-entry.js`:
```js
import { initOgHero } from './og-hero.js';
export function init(container, options) {
  return initOgHero(container, options);
}
```

- [ ] **Step 2: Write the esbuild bundler**

Create `build/build-shopify.mjs`:
```js
import { build } from 'esbuild';

await build({
  entryPoints: ['src/hero/shopify-entry.js'],
  bundle: true,
  format: 'iife',
  globalName: 'OGHero',
  minify: true,
  target: ['es2019'],
  outfile: 'shopify/assets/og-hero.min.js',
});
console.log('built shopify/assets/og-hero.min.js');
```

- [ ] **Step 3: Produce the bundle**

Run: `node build/build-shopify.mjs`
Expected: "built shopify/assets/og-hero.min.js"; file exists and is non-trivial in size (Three is included).

Run: `test -s shopify/assets/og-hero.min.js && echo OK`
Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/hero/shopify-entry.js build/build-shopify.mjs shopify/assets/og-hero.min.js
git commit -m "feat(hero): shopify iife bundle + build script"
```

---

## Task 8: Shopify section + standalone verification

**Files:**
- Create: `shopify/og-hero.liquid`
- Create: `shopify/test-harness.html`

**Interfaces:**
- Consumes: `window.OGHero.init` from the bundle; theme `{{ 'og-hero.min.js' | asset_url }}` and per-card `{{ '<file>' | asset_url }}`.

Shopify theme asset filenames cannot contain spaces, so cards ship as renamed assets. Mapping (upload these to theme assets):
`henderson-topps.jpg, jordan-fleer.jpg, gretzky-opc.jpg, trout-bowman.jpg, tiger-woods.jpg, jordan-star.jpg, og-card-back.png` — same order as `CARD_LAYOUT`.

- [ ] **Step 1: Write the section**

Create `shopify/og-hero.liquid`:
```liquid
{%- comment -%} OnlyGoatz parallax hero — replaces the video slideshow. {%- endcomment -%}
<section class="og-hero" data-og-hero
  style="position:relative;width:100%;height:{{ section.settings.height }}px;background:#0b0b0f;overflow:hidden;">
  <div class="og-hero__canvas" style="position:absolute;inset:0;"></div>
  <div class="og-hero__vignette" style="position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(0,0,0,.55) 100%);"></div>
  <div class="og-hero__content" style="position:absolute;inset:0;z-index:2;display:flex;
    flex-direction:column;align-items:center;justify-content:center;gap:32px;text-align:center;">
    <h2 style="color:#fff;font:700 clamp(32px,5vw,56px)/1.1 Inter,sans-serif;margin:0;">
      {{ section.settings.line1 }}<br>{{ section.settings.line2 }}
    </h2>
    <a href="{{ section.settings.button_url }}"
      style="padding:14px 32px;background:#fff;color:#000;border-radius:50px;
      font:600 14px Inter,sans-serif;text-decoration:none;">{{ section.settings.button_text }}</a>
  </div>
</section>

<script src="{{ 'og-hero.min.js' | asset_url }}" defer></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    var el = document.querySelector('#shopify-section-{{ section.id }} [data-og-hero] .og-hero__canvas');
    if (el && window.OGHero) {
      window.OGHero.init(el, {
        cards: [
          { src: "{{ 'henderson-topps.jpg' | asset_url }}", x: 0.2, y: 0.1, z: 2.4, rotX: 0, rotY: 0.1, rotZ: 0.03, parallax: 1.15, floatPhase: 0.7, floatAmp: 0.24 },
          { src: "{{ 'jordan-fleer.jpg' | asset_url }}", x: -3.2, y: 0.6, z: 1.5, rotX: 0.05, rotY: 0.35, rotZ: -0.12, parallax: 1.0, floatPhase: 0.0, floatAmp: 0.22 },
          { src: "{{ 'gretzky-opc.jpg' | asset_url }}", x: 3.0, y: -0.4, z: 0.8, rotX: -0.04, rotY: -0.3, rotZ: 0.1, parallax: 0.85, floatPhase: 1.1, floatAmp: 0.2 },
          { src: "{{ 'trout-bowman.jpg' | asset_url }}", x: -1.4, y: -1.1, z: -0.5, rotX: 0.02, rotY: 0.2, rotZ: 0.05, parallax: 0.6, floatPhase: 2.3, floatAmp: 0.16 },
          { src: "{{ 'tiger-woods.jpg' | asset_url }}", x: 1.6, y: 1.2, z: -1.2, rotX: -0.03, rotY: -0.15, rotZ: -0.08, parallax: 0.45, floatPhase: 3.0, floatAmp: 0.14 },
          { src: "{{ 'jordan-star.jpg' | asset_url }}", x: -2.2, y: 1.6, z: -2.0, rotX: 0.03, rotY: 0.25, rotZ: 0.14, parallax: 0.35, floatPhase: 4.2, floatAmp: 0.12 }
        ],
        backSrc: "{{ 'og-card-back.png' | asset_url }}"
      });
    }
  });
</script>

{% schema %}
{
  "name": "OG Parallax Hero",
  "settings": [
    { "type": "text", "id": "line1", "label": "Headline line 1", "default": "Unbox the Legends." },
    { "type": "text", "id": "line2", "label": "Headline line 2", "default": "Discover Your GOAT." },
    { "type": "text", "id": "button_text", "label": "Button text", "default": "Shop Now" },
    { "type": "url", "id": "button_url", "label": "Button link" },
    { "type": "range", "id": "height", "label": "Height (px)", "min": 400, "max": 800, "step": 20, "default": 600 }
  ],
  "presets": [{ "name": "OG Parallax Hero" }]
}
{% endschema %}
```

- [ ] **Step 2: Write a standalone harness mirroring the embed**

Create `shopify/test-harness.html` (loads the bundle + local repo card assets so we can verify the production code path without Shopify):
```html
<!doctype html>
<meta charset="utf-8">
<title>OG Hero harness</title>
<body style="margin:0;background:#000">
  <div style="height:40vh"></div>
  <section style="position:relative;width:100%;height:600px;background:#0b0b0f;overflow:hidden">
    <div id="c" style="position:absolute;inset:0"></div>
  </section>
  <div style="height:200vh"></div>
  <script src="./assets/og-hero.min.js"></script>
  <script>
    OGHero.init(document.getElementById('c'), { basePath: '../public/assets/' });
  </script>
</body>
```

- [ ] **Step 3: Verify the bundled path renders**

```bash
npm run preview -- --port 4321 &
# serve repo root so ../public/assets resolves; simplest: use a plain static server at repo root
npx --yes serve -l 5055 . &
sleep 2
node scripts/shoot.mjs "http://localhost:5055/shopify/test-harness.html?ogscroll=0.3" /home/hrag/.claude/jobs/91ca1940/tmp/shopify-harness.png
```
Read `shopify-harness.png`. Confirm cards render via the minified bundle (global `OGHero`). Kill servers.

- [ ] **Step 4: Commit**

```bash
git add shopify/og-hero.liquid shopify/test-harness.html
git commit -m "feat(hero): shopify section + standalone harness"
```

---

## Task 9: Client install guide

**Files:**
- Create: `shopify/README.md`

- [ ] **Step 1: Write the handoff doc**

Create `shopify/README.md` covering, as concrete numbered steps:
1. In Shopify admin → Online Store → Themes → Edit code → Assets → **Add a new asset**, upload `og-hero.min.js` and the 7 renamed card images (`henderson-topps.jpg`, `jordan-fleer.jpg`, `gretzky-opc.jpg`, `trout-bowman.jpg`, `tiger-woods.jpg`, `jordan-star.jpg`, `og-card-back.png`).
2. Under Sections → **Add a new section** named `og-hero`, paste `og-hero.liquid`.
3. Theme editor → homepage → **Add section → OG Parallax Hero**; set the button link to `/collections/all`; drag it to the top; **remove/hide** the existing video slideshow section.
4. Save. Note the `prefers-reduced-motion` fallback and that re-running `node build/build-shopify.mjs` regenerates the asset after any engine change.

- [ ] **Step 2: Commit**

```bash
git add shopify/README.md
git commit -m "docs(hero): shopify install guide"
```

---

## Self-Review Notes

- **Spec coverage:** parallax depth drift (Task 1 `cardTransform` + Task 3 loop), 6 cards mixed depth (Task 2 `CARD_LAYOUT`), idle float (Task 1 sin float), scroll-linked per-card parallax keyed to depth (Task 1 parallax-ordering test), subtle mouse tilt (Task 1 `cameraOffset`, Task 3 camera lerp), lighting/vignette polish (Task 3 key+rim lights, Task 4/8 CSS vignette), reduced-motion + offscreen-pause (Task 3), headline/button overlay preserved (Task 4 Astro / Task 8 Liquid), Astro demo (Tasks 4–6), Shopify plug-and-play package (Tasks 7–9). No gaps.
- **Type consistency:** `cardTransform`/`cameraOffset`/`computeScrollProgress`/`clamp` signatures match between `motion.js` (Task 1), its tests, and the engine (Task 3). `buildCards(basePath)` and `SCENE` keys used in Task 3 match Task 2. `window.OGHero.init` global (Task 7) matches the call sites (Task 8).
- **Placeholders:** none — every code step is complete. Task 9 lists exact numbered content rather than prose "write docs".
- **Verification honesty:** WebGL rendering is verified by reading real headless screenshots (Tasks 5, 8), not asserted; only the pure math is unit-tested.
