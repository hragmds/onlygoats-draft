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

// Absolute pose for a card given scroll + time. Cards drift UP as progress
// rises, scaled by their parallax factor (near cards move more). A card's own
// floatSpeedMul (default 1) scales its idle float/sway speed independent of
// every other card — used to make background filler cards drift faster.
export function cardTransform(card, scrollProgress, timeSec, ranges) {
  const speed = ranges.floatSpeed * (card.floatSpeedMul || 1);
  const float = Math.sin(timeSec * speed + card.floatPhase) * card.floatAmp;
  const sway = Math.sin(timeSec * speed * 0.7 + card.floatPhase) * ranges.swayAmp;
  const driftY = scrollProgress * card.parallax * ranges.scrollDriftY;
  const driftZ = scrollProgress * card.parallax * ranges.scrollDriftZ;
  const spin = (card.spin || 0) * timeSec; // slow continuous turn about Y
  return {
    x: card.x,
    y: card.y + float - driftY,
    z: card.z + driftZ,
    rotX: card.rotX,
    rotY: card.rotY + spin,
    rotZ: card.rotZ + sway,
  };
}
