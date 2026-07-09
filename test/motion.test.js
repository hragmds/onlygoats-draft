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
