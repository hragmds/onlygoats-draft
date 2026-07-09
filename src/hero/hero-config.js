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
  scrollDriftY: 6,
  scrollDriftZ: 3,
  mouseInfluence: 0.35,
  maxMouseOffset: 0.8,
  pixelRatioCap: 2,
};

// Loose, asymmetric arrangement across mixed Z-depths. Near cards (larger z,
// higher parallax) sit toward the camera and move most on scroll.
export const CARD_LAYOUT = [
  { file: 'Henderson Topps front.jpg',   x:  0.2, y:  0.1, z:  2.4, rotX:  0.00, rotY:  0.10, rotZ:  0.03, parallax: 1.15, floatPhase: 0.7, floatAmp: 0.24 },
  { file: 'Jordan Fleer front.jpg',      x: -3.2, y:  0.6, z:  1.5, rotX:  0.05, rotY:  0.35, rotZ: -0.12, parallax: 1.00, floatPhase: 0.0, floatAmp: 0.22 },
  { file: 'Gretzky OPC front.jpg',       x:  3.0, y: -0.4, z:  0.8, rotX: -0.04, rotY: -0.30, rotZ:  0.10, parallax: 0.85, floatPhase: 1.1, floatAmp: 0.20 },
  { file: 'Trout Bowman Auto front.jpg', x: -1.4, y: -1.1, z: -0.5, rotX:  0.02, rotY:  0.20, rotZ:  0.05, parallax: 0.60, floatPhase: 2.3, floatAmp: 0.16 },
  { file: 'Tiger Woods Front.jpg',       x:  1.6, y:  1.2, z: -1.2, rotX: -0.03, rotY: -0.15, rotZ: -0.08, parallax: 0.45, floatPhase: 3.0, floatAmp: 0.14 },
  { file: 'Jordan Star front.jpg',       x: -2.2, y:  1.6, z: -2.0, rotX:  0.03, rotY:  0.25, rotZ:  0.14, parallax: 0.35, floatPhase: 4.2, floatAmp: 0.12 },
];

export function buildCards(basePath, layout = CARD_LAYOUT) {
  return layout.map((c) => ({ ...c, src: basePath + encodeURIComponent(c.file) }));
}
