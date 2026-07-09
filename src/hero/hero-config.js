// Composition + scene constants for the OG hero. Tweak here to restyle
// without touching engine or math.

export const SCENE = {
  cameraZ: 6,
  fov: 55,
  background: 0x0b0b0f,
  ambient: 0.55,
  keyLight: 0.85,
  rimLight: 0.6,
  floatSpeed: 0.6,
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
  { file: 'Jordan Star front.jpg',       x: -1.75, y:  3.03, z:  0.9, rotX:  0.02, rotY:  0.16, rotZ:  0.10, parallax: 0.95, floatPhase: 4.2, floatAmp: 0.15, spin: -0.09 }, // upper-left
  { file: 'Gretzky OPC front.jpg',       x:  1.75, y:  3.03, z:  0.8, rotX:  0.02, rotY: -0.16, rotZ: -0.08, parallax: 1.05, floatPhase: 1.1, floatAmp: 0.15, spin: -0.07 }, // upper-right
  { file: 'Henderson Topps front.jpg',   x:  5.40, y:  0.00, z:  0.6, rotX:  0.00, rotY: -0.22, rotZ:  0.05, parallax: 0.70, floatPhase: 0.7, floatAmp: 0.14, spin: -0.05 }, // right side card
  { file: 'Tiger Woods Front.jpg',       x:  1.75, y: -3.03, z:  0.9, rotX: -0.02, rotY: -0.16, rotZ: -0.10, parallax: 0.90, floatPhase: 3.0, floatAmp: 0.15, spin:  0.10 }, // lower-right
  { file: 'Trout Bowman Auto front.jpg', x: -1.75, y: -3.03, z:  1.0, rotX: -0.02, rotY:  0.16, rotZ:  0.08, parallax: 1.00, floatPhase: 2.3, floatAmp: 0.15, spin:  0.11 }, // lower-left
  { file: 'Kiss Comic Front.jpg',        x: -5.39, y:  0.00, z:  0.7, rotX:  0.00, rotY:  0.22, rotZ: -0.05, parallax: 0.80, floatPhase: 5.5, floatAmp: 0.14, spin:  0.08 }, // left side card
];

export function buildCards(basePath, layout = CARD_LAYOUT) {
  return layout.map((c) => ({ ...c, src: basePath + encodeURIComponent(c.file) }));
}
