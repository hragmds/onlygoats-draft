import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, computeScrollProgress, cardTransform } from '../src/hero/motion.js';

test('clamp bounds a value', () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(clamp(0.5, 0, 1), 0.5);
});

test('computeScrollProgress maps scroll position to 0..1 from the first pixel', () => {
  assert.equal(computeScrollProgress(0, 600), 0);     // top of page
  assert.equal(computeScrollProgress(300, 600), 0.5); // scrolled halfway
  assert.equal(computeScrollProgress(600, 600), 1);   // fully scrolled through
  assert.equal(computeScrollProgress(900, 600), 1);   // past -> clamped
  assert.equal(computeScrollProgress(-50, 600), 0);   // overscroll -> clamped
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

test('cardTransform applies a slow continuous Y spin over time', () => {
  const ranges = { floatSpeed: 0.6, swayAmp: 0, scrollDriftY: 6, scrollDriftZ: 3 };
  const card = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0.1, rotZ: 0, parallax: 1, floatPhase: 0, floatAmp: 0, spin: 0.2 };
  assert.ok(Math.abs(cardTransform(card, 0, 0, ranges).rotY - 0.1) < 1e-9, 'at t=0, rotY is the base tilt');
  assert.ok(Math.abs(cardTransform(card, 0, 10, ranges).rotY - (0.1 + 2.0)) < 1e-9, 'rotY advances by spin*time');
});

test('cardTransform without a spin field does not rotate over time', () => {
  const ranges = { floatSpeed: 0.6, swayAmp: 0, scrollDriftY: 6, scrollDriftZ: 3 };
  const card = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0.3, rotZ: 0, parallax: 1, floatPhase: 0, floatAmp: 0 };
  assert.equal(cardTransform(card, 0, 99, ranges).rotY, 0.3);
});

test('cardTransform: floatSpeedMul makes a card float faster than the base speed', () => {
  const ranges = { floatSpeed: 0.3, swayAmp: 0, scrollDriftY: 0, scrollDriftZ: 0 };
  const base = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, parallax: 1, floatPhase: 0, floatAmp: 1 };
  const fast = { ...base, floatSpeedMul: 3 };
  // A 3x-faster card at t should match a base-speed card at 3t (same phase reached sooner).
  const t = 1.7;
  const fastY = cardTransform(fast, 0, t, ranges).y;
  const equivBaseY = cardTransform(base, 0, t * 3, ranges).y;
  assert.ok(Math.abs(fastY - equivBaseY) < 1e-9, 'floatSpeedMul=3 at t should match base speed at 3t');
});

test('cardTransform: no floatSpeedMul behaves exactly as multiplier 1 (unchanged default)', () => {
  const ranges = { floatSpeed: 0.6, swayAmp: 0.04, scrollDriftY: 6, scrollDriftZ: 3 };
  const card = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, parallax: 1, floatPhase: 0.5, floatAmp: 0.3 };
  const withMul = { ...card, floatSpeedMul: 1 };
  assert.deepEqual(cardTransform(card, 0.4, 2.1, ranges), cardTransform(withMul, 0.4, 2.1, ranges));
});

test('cardTransform: sweepSpeed replaces the up/down bob with a linear diagonal creep', () => {
  const ranges = { floatSpeed: 0.6, swayAmp: 0, scrollDriftY: 0, scrollDriftZ: 0 };
  const card = { x: 5, y: -2, z: 0, rotX: 0, rotY: 0, rotZ: 0, parallax: 0, floatPhase: 0, floatAmp: 0, sweepSpeed: 0.04 };
  // Starts exactly at its own spawn position at t=0 (no jump).
  const t0 = cardTransform(card, 0, 0, ranges);
  assert.equal(t0.x, 5);
  assert.equal(t0.y, -2);
  // Linear, not oscillating: displacement at 2t is exactly double that at t.
  const t1 = cardTransform(card, 0, 10, ranges);
  const t2 = cardTransform(card, 0, 20, ranges);
  const d1x = t1.x - 5, d1y = t1.y - -2;
  const d2x = t2.x - 5, d2y = t2.y - -2;
  assert.ok(Math.abs(d2x - 2 * d1x) < 1e-9, 'x displacement should double when time doubles');
  assert.ok(Math.abs(d2y - 2 * d1y) < 1e-9, 'y displacement should double when time doubles');
  // Direction is bottom-left -> top-right: both x and y increase, by equal amounts (45deg diagonal).
  assert.ok(d1x > 0, 'x should increase (toward top-right)');
  assert.ok(d1y > 0, 'y should increase (toward top-right)');
  assert.ok(Math.abs(d1x - d1y) < 1e-9, 'the sweep is a 45-degree diagonal (equal x/y movement)');
});

test('cardTransform: sweepSpeed ignores floatSpeed/floatSpeedMul/floatAmp entirely', () => {
  const ranges = { floatSpeed: 0.6, swayAmp: 0, scrollDriftY: 0, scrollDriftZ: 0 };
  const card = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, parallax: 0, floatPhase: 3.7, floatAmp: 99, floatSpeedMul: 50, sweepSpeed: 0.03 };
  const a = cardTransform(card, 0, 12, ranges);
  const b = cardTransform({ ...card, floatAmp: 0, floatSpeedMul: 1, floatPhase: 0 }, 0, 12, ranges);
  assert.deepEqual(a, b, 'floatAmp/floatSpeedMul/floatPhase must not affect a sweeping card\'s position');
});

test('cardTransform: without sweepSpeed, behaves exactly as before (regression)', () => {
  const ranges = { floatSpeed: 0.6, swayAmp: 0.04, scrollDriftY: 6, scrollDriftZ: 3 };
  const card = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, parallax: 1, floatPhase: 0.5, floatAmp: 0.3 };
  assert.equal(cardTransform(card, 0.4, 2.1, ranges).x, 0, 'x is untouched without sweepSpeed');
});
