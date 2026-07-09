import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveHolderStyle, HOLDER_STYLES, styleNeedsEnvironment } from '../src/hero/holders.js';

test('every named style resolves to itself', () => {
  for (const name of HOLDER_STYLES) {
    assert.equal(resolveHolderStyle(`?ogholder=${name}`), name);
  }
});

test('absent param falls back to default', () => {
  assert.equal(resolveHolderStyle(''), 'default');
  assert.equal(resolveHolderStyle('?ogscroll=0&ogtime=2.5'), 'default');
  assert.equal(resolveHolderStyle(undefined), 'default');
});

test('junk or unknown values fall back to default', () => {
  assert.equal(resolveHolderStyle('?ogholder=sparkle'), 'default');
  assert.equal(resolveHolderStyle('?ogholder='), 'default');
  assert.equal(resolveHolderStyle('?ogholder=ACRYLIC'), 'default'); // case-sensitive by design
});

test('the four shiny styles need an environment map, default does not', () => {
  assert.equal(styleNeedsEnvironment('default'), false);
  for (const name of HOLDER_STYLES) {
    assert.equal(styleNeedsEnvironment(name), true);
  }
});

test('HOLDER_STYLES are exactly the four documented names', () => {
  assert.deepEqual([...HOLDER_STYLES].sort(), ['acrylic', 'frame', 'gloss', 'slab']);
});
