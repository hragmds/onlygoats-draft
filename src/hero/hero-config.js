// Composition + scene constants for the OG hero. Tweak here to restyle
// without touching engine or math.

export const SCENE = {
  cameraZ: 8,
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

// The Michael Jordan '86 Fleer rookie anchors the center as the hero card;
// the rest fill every quadrant and the far sides. `spin` gives each card a slow
// continuous turn about Y (rad/sec, alternating direction). Near cards (larger
// z, higher parallax) move most on scroll.
export const CARD_LAYOUT = [
  { file: 'Jordan Fleer front.jpg',      x:   0.0, y: -0.1, z:  3.0, rotX:  0.00, rotY:  0.00, rotZ: -0.04, parallax: 1.20, floatPhase: 0.0, floatAmp: 0.18, spin:  0.06 }, // center hero card
  { file: 'Jordan Star front.jpg',       x:  -7.2, y:  3.0, z:  1.0, rotX:  0.03, rotY:  0.30, rotZ:  0.12, parallax: 0.95, floatPhase: 4.2, floatAmp: 0.18, spin: -0.09 }, // upper-left corner
  { file: 'Gretzky OPC front.jpg',       x:   7.4, y:  2.9, z:  1.3, rotX: -0.03, rotY: -0.28, rotZ:  0.10, parallax: 1.00, floatPhase: 1.1, floatAmp: 0.18, spin: -0.07 }, // upper-right corner
  { file: 'Trout Bowman Auto front.jpg', x:  -6.8, y: -3.0, z:  1.6, rotX:  0.03, rotY:  0.24, rotZ:  0.08, parallax: 1.05, floatPhase: 2.3, floatAmp: 0.16, spin:  0.11 }, // lower-left corner
  { file: 'Tiger Woods Front.jpg',       x:   7.0, y: -3.0, z:  0.7, rotX: -0.03, rotY: -0.20, rotZ: -0.10, parallax: 0.85, floatPhase: 3.0, floatAmp: 0.16, spin:  0.10 }, // lower-right corner
  { file: 'Kiss Comic Front.jpg',        x: -10.6, y:  0.3, z: -1.2, rotX:  0.00, rotY:  0.18, rotZ: -0.05, parallax: 0.50, floatPhase: 5.5, floatAmp: 0.13, spin:  0.08 }, // far-left, deep
  { file: 'Henderson Topps front.jpg',   x:  10.6, y: -0.2, z: -1.6, rotX:  0.00, rotY: -0.16, rotZ:  0.05, parallax: 0.45, floatPhase: 0.7, floatAmp: 0.12, spin: -0.05 }, // far-right, deep
];

export function buildCards(basePath, layout = CARD_LAYOUT) {
  return layout.map((c) => ({ ...c, src: basePath + encodeURIComponent(c.file) }));
}
