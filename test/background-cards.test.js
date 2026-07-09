import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBackgroundCards,
  shouldShowBackgroundCards,
  BACKGROUND_CARD_COUNT,
  BACKGROUND_SCALE_RANGE,
  BACKGROUND_SPEED_MUL_RANGE,
  BACKGROUND_SWEEP_SPEED_RANGE,
} from '../src/hero/hero-config.js';

// Deterministic seeded PRNG (mulberry32) so buildBackgroundCards' randomness
// is reproducible in tests instead of relying on true Math.random().
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SOURCE_CARDS = [
  { src: '/assets/card-a.jpg', w: 1.357, h: 2.322 },
  { src: '/assets/card-b.jpg', w: 1.412, h: 2.231 },
  { src: '/assets/card-c.jpg', w: 1.491, h: 2.112 },
];

test('buildBackgroundCards returns the requested count', () => {
  const cards = buildBackgroundCards(SOURCE_CARDS, 10, mulberry32(1));
  assert.equal(cards.length, 10);
});

test('buildBackgroundCards defaults to BACKGROUND_CARD_COUNT when count is omitted', () => {
  const cards = buildBackgroundCards(SOURCE_CARDS, undefined, mulberry32(2));
  assert.equal(cards.length, BACKGROUND_CARD_COUNT);
});

test('every background card sits behind the main cluster (z < 0)', () => {
  const cards = buildBackgroundCards(SOURCE_CARDS, 30, mulberry32(3));
  for (const c of cards) assert.ok(c.z < 0, `expected z < 0, got ${c.z}`);
});

test('every background card is scaled within BACKGROUND_SCALE_RANGE (smaller than the main cards)', () => {
  const cards = buildBackgroundCards(SOURCE_CARDS, 30, mulberry32(4));
  const [lo, hi] = BACKGROUND_SCALE_RANGE;
  for (const c of cards) {
    assert.ok(c.scale >= lo && c.scale <= hi, `expected scale in [${lo},${hi}], got ${c.scale}`);
  }
});

test('every background card floats faster than the main cards (floatSpeedMul > 1, within range)', () => {
  const cards = buildBackgroundCards(SOURCE_CARDS, 30, mulberry32(5));
  const [lo, hi] = BACKGROUND_SPEED_MUL_RANGE;
  assert.ok(lo > 1, 'BACKGROUND_SPEED_MUL_RANGE must itself be faster than the base speed');
  for (const c of cards) {
    assert.ok(c.floatSpeedMul >= lo && c.floatSpeedMul <= hi, `expected floatSpeedMul in [${lo},${hi}], got ${c.floatSpeedMul}`);
  }
});

test('every background card sweeps bottom-left -> top-right instead of bobbing up/down', () => {
  const cards = buildBackgroundCards(SOURCE_CARDS, 30, mulberry32(8));
  const [lo, hi] = BACKGROUND_SWEEP_SPEED_RANGE;
  assert.ok(lo > 0, 'BACKGROUND_SWEEP_SPEED_RANGE must be a positive (forward) speed');
  for (const c of cards) {
    assert.ok(c.sweepSpeed >= lo && c.sweepSpeed <= hi, `expected sweepSpeed in [${lo},${hi}], got ${c.sweepSpeed}`);
    assert.ok(!('floatAmp' in c), 'background cards should no longer carry an unused floatAmp (replaced by the sweep)');
  }
});

test('every background card reuses one of the provided source images', () => {
  const cards = buildBackgroundCards(SOURCE_CARDS, 20, mulberry32(6));
  const validSrcs = new Set(SOURCE_CARDS.map((c) => c.src));
  for (const c of cards) assert.ok(validSrcs.has(c.src), `unexpected src ${c.src}`);
});

test('every background card keeps the true w/h of the source image it duplicates (not stretched)', () => {
  const cards = buildBackgroundCards(SOURCE_CARDS, 20, mulberry32(9));
  const validPairs = new Set(SOURCE_CARDS.map((c) => `${c.w}x${c.h}`));
  for (const c of cards) {
    assert.ok(validPairs.has(`${c.w}x${c.h}`), `${c.src} got w/h ${c.w}x${c.h}, not matching any source card's real ratio`);
  }
});

test('buildBackgroundCards is deterministic for a given rng seed', () => {
  const a = buildBackgroundCards(SOURCE_CARDS, 8, mulberry32(42));
  const b = buildBackgroundCards(SOURCE_CARDS, 8, mulberry32(42));
  assert.deepEqual(a, b);
});

test('background cards carry the fields cardTransform needs', () => {
  const cards = buildBackgroundCards(SOURCE_CARDS, 5, mulberry32(7));
  for (const c of cards) {
    for (const k of ['x', 'y', 'z', 'rotX', 'rotY', 'rotZ', 'parallax', 'floatPhase', 'sweepSpeed', 'spin', 'floatSpeedMul', 'scale', 'src']) {
      assert.ok(k in c, `background card missing ${k}`);
    }
  }
});

test('shouldShowBackgroundCards defaults to true (the "all cards" production look)', () => {
  assert.equal(shouldShowBackgroundCards(''), true);
  assert.equal(shouldShowBackgroundCards(undefined), true);
  assert.equal(shouldShowBackgroundCards('?ogscroll=0&ogtime=5'), true);
  assert.equal(shouldShowBackgroundCards('?ogbg=on'), true);
  assert.equal(shouldShowBackgroundCards('?ogbg=anything-else'), true);
});

test('shouldShowBackgroundCards is false only for ?ogbg=off (main-7-only view)', () => {
  assert.equal(shouldShowBackgroundCards('?ogbg=off'), false);
  assert.equal(shouldShowBackgroundCards('?ogholder=gloss&ogbg=off'), false);
});
