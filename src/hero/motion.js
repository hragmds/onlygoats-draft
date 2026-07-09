// Pure motion math for the OG hero. No Three, no DOM — unit-testable.

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// scrollY: window scroll position; driftDistance: pixels of scroll over which
// the parallax completes. 0 at the top of the page, ramping to 1 as the visitor
// scrolls — so the effect responds from the first pixel of scroll.
export function computeScrollProgress(scrollY, driftDistance) {
  if (driftDistance <= 0) return 0;
  return clamp(scrollY / driftDistance, 0, 1);
}

// Sweep direction for cards with sweepSpeed: bottom-left -> top-right, a
// 45-degree world-space diagonal (x and y increase together).
const SWEEP_DIR_X = Math.SQRT1_2;
const SWEEP_DIR_Y = Math.SQRT1_2;

// Absolute pose for a card given scroll + time. Cards drift UP as progress
// rises, scaled by their parallax factor (near cards move more). A card's own
// floatSpeedMul (default 1) scales its idle float/sway speed independent of
// every other card — used to make background filler cards drift faster.
//
// A card with sweepSpeed set trades the usual up/down bob for a continuous,
// one-directional diagonal creep instead (used by background filler cards) —
// linear in time, starting exactly at the card's own x/y at t=0. Sway (the
// rotZ wobble) and everything else still applies on top, unchanged.
export function cardTransform(card, scrollProgress, timeSec, ranges) {
  const speed = ranges.floatSpeed * (card.floatSpeedMul || 1);
  const sway = Math.sin(timeSec * speed * 0.7 + card.floatPhase) * ranges.swayAmp;
  const driftY = scrollProgress * card.parallax * ranges.scrollDriftY;
  const driftZ = scrollProgress * card.parallax * ranges.scrollDriftZ;
  const spin = (card.spin || 0) * timeSec; // slow continuous turn about Y

  let dx = 0, dy = 0;
  if (card.sweepSpeed) {
    const dist = card.sweepSpeed * timeSec;
    dx = dist * SWEEP_DIR_X;
    dy = dist * SWEEP_DIR_Y;
  } else {
    dy = Math.sin(timeSec * speed + card.floatPhase) * card.floatAmp;
  }

  return {
    x: card.x + dx,
    y: card.y + dy - driftY,
    z: card.z + driftZ,
    rotX: card.rotX,
    rotY: card.rotY + spin,
    rotZ: card.rotZ + sway,
  };
}
