// Composition + scene constants for the OG hero. Tweak here to restyle
// without touching engine or math.

export const SCENE = {
  cameraZ: 6,
  fov: 55,
  background: 0x0b0b0f,
  ambient: 0.55,
  keyLight: 0.85,
  rimLight: 0.6,
  floatSpeed: 0.3,
  swayAmp: 0.045,
  scrollDriftY: 2.6,
  scrollDriftZ: 1.4,
  pixelRatioCap: 2,
};

// The Michael Jordan '86 Fleer rookie anchors the center; the other six sit on
// a regular hexagon ring around it (radius 3.5), so every card is equidistant
// from the center and from its neighbours. `spin` gives each card a slow
// continuous turn about Y (rad/sec, alternating direction). Higher-parallax
// cards move most on scroll.
export const CARD_LAYOUT = [
  { file: 'Jordan Fleer front.jpg',      x:  0.00, y:  0.00, z:  2.4, rotX:  0.00, rotY:  0.00, rotZ: -0.03, parallax: 1.25, floatPhase: 0.0, floatAmp: 0.16, spin:  0.06 }, // center
  { file: 'Jordan Star front.jpg',       x: -2.75, y:  2.00, z:  0.9, rotX:  0.02, rotY:  0.16, rotZ:  0.10, parallax: 0.95, floatPhase: 4.2, floatAmp: 0.15, spin: -0.09 }, // upper-left
  { file: 'Gretzky OPC front.jpg',       x:  2.75, y:  2.00, z:  0.8, rotX:  0.02, rotY: -0.16, rotZ: -0.08, parallax: 1.05, floatPhase: 1.1, floatAmp: 0.15, spin: -0.07 }, // upper-right
  { file: 'Henderson Topps front.jpg',   x:  5.40, y:  0.00, z:  0.4, rotX:  0.00, rotY: -0.22, rotZ:  0.05, parallax: 0.70, floatPhase: 0.7, floatAmp: 0.14, spin: -0.05 }, // right side card
  { file: 'Tiger Woods Front.jpg',       x:  2.50, y: -2.00, z:  0.9, rotX: -0.02, rotY: -0.16, rotZ: -0.10, parallax: 0.90, floatPhase: 3.0, floatAmp: 0.15, spin:  0.10 }, // lower-right
  { file: 'Trout Bowman Auto front.jpg', x: -2.50, y: -2.00, z:  0.2, rotX: -0.02, rotY:  0.16, rotZ:  0.08, parallax: 1.00, floatPhase: 2.3, floatAmp: 0.15, spin:  0.11 }, // lower-left
  { file: 'Kiss Comic Front.jpg',        x: -5.39, y:  0.00, z:  0.7, rotX:  0.00, rotY:  0.22, rotZ: -0.05, parallax: 0.80, floatPhase: 5.5, floatAmp: 0.14, spin:  0.08 }, // left side card
];

export function buildCards(basePath, layout = CARD_LAYOUT) {
  return layout.map((c) => ({ ...c, src: basePath + encodeURIComponent(c.file) }));
}

// Smaller, faster-drifting duplicate cards scattered behind the main cluster
// for background depth. Fraction of the main cards' size, and how much faster
// their idle float runs (a floatSpeedMul multiplier on top of SCENE.floatSpeed,
// applied per-card by cardTransform).
export const BACKGROUND_CARD_COUNT = 14;
export const BACKGROUND_SCALE_RANGE = [0.25, 0.5];
export const BACKGROUND_SPEED_MUL_RANGE = [2.0, 3.5];
export const BACKGROUND_SPIN_RANGE = [0.16, 0.34]; // rad/sec magnitude — faster than the main 7 (~0.05-0.11)
export const BACKGROUND_X_RANGE = [-10, 10];
export const BACKGROUND_Y_RANGE = [-5, 5];
export const BACKGROUND_Z_RANGE = [-3.6, -0.6]; // z < 0: behind the main cluster (z 0.2-2.4)

function between(rng, [lo, hi]) {
  return lo + rng() * (hi - lo);
}

// Derives .src from the already-resolved `sourceCards` (whatever those are —
// Astro basePath-relative or Shopify CDN URLs) so this needs no per-host
// wiring; it just duplicates whichever artwork was actually passed in.
// `rng` is injectable so tests can pass a deterministic generator.
export function buildBackgroundCards(sourceCards, count = BACKGROUND_CARD_COUNT, rng = Math.random) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    const source = sourceCards[Math.floor(rng() * sourceCards.length)];
    const sign = () => (rng() < 0.5 ? -1 : 1);
    cards.push({
      src: source.src,
      x: between(rng, BACKGROUND_X_RANGE),
      y: between(rng, BACKGROUND_Y_RANGE),
      z: between(rng, BACKGROUND_Z_RANGE),
      rotX: sign() * rng() * 0.12,
      rotY: sign() * rng() * 0.35,
      rotZ: sign() * rng() * 0.18,
      parallax: 0.2 + rng() * 0.25,
      floatPhase: rng() * Math.PI * 2,
      floatAmp: 0.10 + rng() * 0.16,
      spin: sign() * between(rng, BACKGROUND_SPIN_RANGE),
      floatSpeedMul: between(rng, BACKGROUND_SPEED_MUL_RANGE),
      scale: between(rng, BACKGROUND_SCALE_RANGE),
    });
  }
  return cards;
}

// Card-holder styles selectable via ?ogholder=<name>. When the param is absent
// the engine uses 'gloss', the production look; ?ogholder=default restores the
// original flat gray edge. All non-default styles share a procedural PMREM studio
// (HOLDERS.env) so metal/acrylic surfaces have something bright to reflect
// against the near-black scene. The renderer stays in its legacy color path
// (no tone mapping) so the card artwork keeps its default vividness; shine
// comes from the env map + materials. Restyle here without touching holders.js.
export const HOLDERS = {
  // Procedural reflection environment: a dark room with a few bright "light
  // cards" that show up as glints/streaks on shiny surfaces. Panels look at the
  // origin. `blur` is the PMREM sigma — small = sharper reflections.
  env: {
    roomSize: 16,
    roomColor: 0x24242e,
    blur: 0.022,
    panels: [
      { pos: [2.5, 3.0, 6.5], size: [6.5, 4.5], color: 0xffffff, intensity: 2.8 }, // soft key, upper-front
      { pos: [-6.0, 0.5, 4.0], size: [3.0, 6.5], color: 0xaecbff, intensity: 2.2 }, // cool rim, left
      { pos: [6.0, -1.0, 3.5], size: [2.6, 5.5], color: 0xfff0da, intensity: 2.0 }, // warm rim, right
      { pos: [0.0, 6.5, 1.5], size: [8.0, 1.3], color: 0xffffff, intensity: 2.4 }, // overhead streak
    ],
  },

  // Inner card used by acrylic/slab/frame: a thin RoundedBox carrying the
  // artwork on front/back, with a discreet dark edge that hides behind shells.
  // Low env intensity so the artwork stays as vivid as the default look.
  innerCard: { w: 1.5, h: 2.1, d: 0.05, radius: 0.06, edgeColor: 0x0e0e12,
    edgeRoughness: 0.6, faceRoughness: 0.5, faceEnvIntensity: 0.12 },

  // The clear encased styles (acrylic, slab) split the shell into two materials
  // via the RoundedBox face groups: `face` (front/back, near-invisible so the
  // card reads at full vividness) and `edge` (the four side/bevel faces, where
  // grazing-angle Fresnel reflections make a bright glassy rim). This is what
  // keeps the front crystal-clear instead of a milky film over the art.

  // 1) Crystal-clear one-touch acrylic holder: a chunky rounded clear block.
  acrylic: {
    shell: { w: 1.78, h: 2.42, d: 0.2, radius: 0.09, segments: 6 },
    face: { tint: 0xffffff, opacity: 0.05, roughness: 0.015,
      clearcoat: 1.0, clearcoatRoughness: 0.02, envMapIntensity: 2.5 },
    edge: { tint: 0xeaf2ff, opacity: 0.45, roughness: 0.01,
      clearcoat: 1.0, clearcoatRoughness: 0.02, envMapIntensity: 4.0 },
  },

  // 2) Sealed graded case (PSA-style): thin, squarish, tighter to the card, with
  // a lightly frosted sealed edge. Differs from acrylic by silhouette + finish,
  // not by a label — the artwork already shows its printed grading label.
  slab: {
    shell: { w: 1.68, h: 2.3, d: 0.11, radius: 0.035, segments: 2 },
    face: { tint: 0xffffff, opacity: 0.05, roughness: 0.03,
      clearcoat: 1.0, clearcoatRoughness: 0.06, envMapIntensity: 1.6 },
    edge: { tint: 0xeef1f6, opacity: 0.6, roughness: 0.4,
      clearcoat: 0.3, clearcoatRoughness: 0.35, envMapIntensity: 1.2 },
  },

  // 3) Glossy clear-coated card: today's silhouette, a soft clearcoat sheen and
  // a polished bright-metal edge that gleams on spin. Face env intensity is kept
  // low so the printed white label areas do not blow out.
  gloss: {
    edgeColor: 0xf7f7f7, edgeRoughness: 0.035, edgeEnvIntensity: 3.2,
    faceRoughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.12,
    faceEnvIntensity: 0.15,
  },

  // 4) Display frame: polished chrome bevel around the card plus a thin glass
  // front pane that catches a fresnel-ish sheen.
  frame: {
    chromeColor: 0xdfe3ea, chromeRoughness: 0.08, chromeEnvIntensity: 1.6,
    frameWidth: 0.14, frameDepth: 0.13,
    glassRoughness: 0.04, glassOpacity: 0.12, glassEnvIntensity: 1.8,
    glassOffset: 0.06,
  },
};
