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
