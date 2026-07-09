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
  mouseInfluence: 0.35,
  maxMouseOffset: 0.8,
  pixelRatioCap: 2,
};

// Cards frame the centered headline: near cards in the four corners, deep
// cards out on the far sides. The central text zone is left clear. Near cards
// (larger z, higher parallax) move most on scroll.
export const CARD_LAYOUT = [
  { file: 'Jordan Fleer front.jpg',      x: -6.6, y:  2.5, z:  2.2, rotX:  0.02, rotY:  0.28, rotZ: -0.14, parallax: 1.10, floatPhase: 0.0, floatAmp: 0.20 }, // upper-left, near
  { file: 'Gretzky OPC front.jpg',       x:  6.4, y:  2.1, z:  1.4, rotX: -0.03, rotY: -0.26, rotZ:  0.12, parallax: 0.95, floatPhase: 1.1, floatAmp: 0.18 }, // upper-right, near-mid
  { file: 'Trout Bowman Auto front.jpg', x: -5.6, y: -2.6, z:  1.8, rotX:  0.03, rotY:  0.22, rotZ:  0.10, parallax: 1.00, floatPhase: 2.3, floatAmp: 0.18 }, // lower-left, near
  { file: 'Tiger Woods Front.jpg',       x:  5.9, y: -2.5, z:  0.6, rotX: -0.02, rotY: -0.18, rotZ: -0.10, parallax: 0.80, floatPhase: 3.0, floatAmp: 0.16 }, // lower-right, mid
  { file: 'Henderson Topps front.jpg',   x: -9.0, y:  0.3, z: -1.6, rotX:  0.00, rotY:  0.14, rotZ:  0.05, parallax: 0.45, floatPhase: 0.7, floatAmp: 0.12 }, // far-left, deep
  { file: 'Jordan Star front.jpg',       x:  8.8, y: -0.2, z: -2.0, rotX:  0.02, rotY: -0.12, rotZ:  0.08, parallax: 0.35, floatPhase: 4.2, floatAmp: 0.11 }, // far-right, deep
];

export function buildCards(basePath, layout = CARD_LAYOUT) {
  return layout.map((c) => ({ ...c, src: basePath + encodeURIComponent(c.file) }));
}
