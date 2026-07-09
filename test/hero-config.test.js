import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE, CARD_LAYOUT, buildCards } from '../src/hero/hero-config.js';

test('CARD_LAYOUT has 7 well-formed cards', () => {
  assert.equal(CARD_LAYOUT.length, 7);
  for (const c of CARD_LAYOUT) {
    for (const k of ['file', 'w', 'h', 'x', 'y', 'z', 'parallax', 'floatPhase', 'floatAmp', 'spin']) {
      assert.ok(k in c, `card missing ${k}`);
    }
  }
});

test('every card w/h matches its real image aspect ratio, not the old bare-card ratio', () => {
  // Measured pixel aspect ratios (width/height) of each source scan — these are
  // photos of the full graded slab, so they run narrower than a bare 2.5x3.5in
  // card (ratio 0.714). w/h on each CARD_LAYOUT entry must reproduce that real
  // ratio (not the old fixed 0.714) so the artwork isn't stretched to fit.
  const measuredRatio = {
    'Jordan Fleer front.jpg': 932 / 1595,
    'Jordan Star front.jpg': 981 / 1550,
    'Gretzky OPC front.jpg': 932 / 1582,
    'Henderson Topps front.jpg': 925 / 1578,
    'Tiger Woods Front.jpg': 1353 / 2140,
    'Trout Bowman Auto front.jpg': 947 / 1612,
    'Kiss Comic Front.jpg': 2747 / 3891,
  };
  for (const c of CARD_LAYOUT) {
    const expected = measuredRatio[c.file];
    assert.ok(expected, `no measured ratio on file for ${c.file}`);
    const actual = c.w / c.h;
    assert.ok(Math.abs(actual - expected) < 0.01,
      `${c.file}: geometry ratio ${actual.toFixed(4)} should match image ratio ${expected.toFixed(4)}`);
  }
  // Sanity: at least the sports-card scans (photos of the full slab, not a bare
  // card) should differ meaningfully from the old fixed 0.714 bare-card ratio.
  const sportsCards = CARD_LAYOUT.filter((c) => c.file !== 'Kiss Comic Front.jpg');
  for (const c of sportsCards) {
    assert.ok(Math.abs(c.w / c.h - 1.5 / 2.1) > 0.02,
      `${c.file}: geometry ratio should no longer be the old fixed bare-card ratio`);
  }
});

test('per-card w/h keep a consistent visual area (no card suddenly looks bigger/smaller)', () => {
  const targetArea = 1.5 * 2.1;
  for (const c of CARD_LAYOUT) {
    const area = c.w * c.h;
    assert.ok(Math.abs(area - targetArea) < 0.05,
      `${c.file}: area ${area.toFixed(3)} should stay close to the original ${targetArea}`);
  }
});

test('cards span a range of depths and parallax factors', () => {
  const zs = CARD_LAYOUT.map((c) => c.z);
  const px = CARD_LAYOUT.map((c) => c.parallax);
  assert.ok(Math.max(...zs) - Math.min(...zs) >= 1.5, 'need real depth spread');
  assert.ok(Math.max(...px) - Math.min(...px) >= 0.5, 'need parallax spread');
});

test('buildCards prefixes and URL-encodes filenames', () => {
  const cards = buildCards('/onlygoats-draft/assets/');
  assert.equal(cards.length, 7);
  assert.ok(cards[0].src.startsWith('/onlygoats-draft/assets/'));
  assert.ok(!cards[0].src.includes(' '), 'spaces must be encoded');
  assert.ok(cards.some((c) => c.src.includes('%20')), 'a filename with a space should encode to %20');
});

test('SCENE carries the constants the engine needs', () => {
  for (const k of ['cameraZ', 'fov', 'background', 'floatSpeed', 'scrollDriftY', 'scrollDriftZ', 'pixelRatioCap']) {
    assert.ok(k in SCENE, `SCENE missing ${k}`);
  }
});
