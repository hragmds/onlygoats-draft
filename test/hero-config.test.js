import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE, CARD_LAYOUT, buildCards } from '../src/hero/hero-config.js';

test('CARD_LAYOUT has 7 well-formed cards', () => {
  assert.equal(CARD_LAYOUT.length, 7);
  for (const c of CARD_LAYOUT) {
    for (const k of ['file', 'x', 'y', 'z', 'parallax', 'floatPhase', 'floatAmp', 'spin']) {
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
