// Card-holder variants for the OG hero. resolveHolderStyle is pure (no THREE,
// no DOM) so it can be unit-tested; everything else builds Three objects.
//
// Styles: 'gloss' is the production look (clearcoated faces, polished metal
// edge). 'acrylic' / 'slab' / 'frame' are the alternate shiny variants; all
// four rely on a shared PMREM environment (createHolderResources) for their
// reflections. 'default' reproduces the original flat-gray-edge card exactly.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { HOLDERS } from './hero-config.js';

export const HOLDER_STYLES = ['acrylic', 'slab', 'gloss', 'frame'];

// Pure: read ?ogholder=<name> out of a location.search string. 'gloss' is the
// chosen production look, so unknown or missing values land there; the other
// styles (and 'default', the original flat-gray edge) remain reachable by name
// for side-by-side comparison.
export function resolveHolderStyle(searchString) {
  let value = null;
  try {
    value = new URLSearchParams(searchString || '').get('ogholder');
  } catch {
    value = null;
  }
  if (value === 'default' || HOLDER_STYLES.includes(value)) return value;
  return 'gloss';
}

export function styleNeedsEnvironment(style) {
  return style !== 'default';
}

// --- environment ------------------------------------------------------------

// Render a small dark room with bright light panels into a PMREM cube so shiny
// materials have crisp highlights to reflect. Returns the WebGLRenderTarget;
// use .texture as scene.environment and .dispose() when tearing down.
export function buildEnvironmentTarget(renderer) {
  const cfg = HOLDERS.env;
  const envScene = new THREE.Scene();

  const room = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.roomSize, cfg.roomSize, cfg.roomSize),
    new THREE.MeshBasicMaterial({ color: cfg.roomColor, side: THREE.BackSide }),
  );
  envScene.add(room);

  for (const p of cfg.panels) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(p.size[0], p.size[1]),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(p.color).multiplyScalar(p.intensity),
        side: THREE.DoubleSide,
      }),
    );
    panel.position.set(p.pos[0], p.pos[1], p.pos[2]);
    panel.lookAt(0, 0, 0);
    envScene.add(panel);
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, cfg.blur);
  pmrem.dispose();
  for (const child of envScene.children) {
    child.geometry.dispose();
    child.material.dispose();
  }
  return rt;
}

// --- shared resources -------------------------------------------------------

// One bundle per hero: a texture loader, the env map (non-default styles), and
// a cache so geometry/materials that don't depend on the artwork are built once
// and shared across all seven cards.
export function createHolderResources(style, renderer) {
  const cache = {};
  let envRT = null;
  if (styleNeedsEnvironment(style)) envRT = buildEnvironmentTarget(renderer);
  return {
    style,
    loader: new THREE.TextureLoader(),
    environment: envRT ? envRT.texture : null,
    cache,
    dispose() {
      if (envRT) envRT.dispose();
      for (const key of Object.keys(cache)) cache[key].dispose();
    },
  };
}

function cached(shared, key, factory) {
  if (!(key in shared.cache)) shared.cache[key] = factory();
  return shared.cache[key];
}

// Front + mirrored-back artwork textures for one card. The back repeats with
// x = -1 so the image reads upright when the slow spin turns the card around.
function loadFaces(shared, card) {
  const front = shared.loader.load(card.src);
  const back = shared.loader.load(card.src);
  back.wrapS = THREE.RepeatWrapping;
  back.repeat.x = -1;
  return { front, back };
}

// A thin artwork card (front/back maps, discreet dark edge) reused by the
// acrylic, slab and frame styles. Fresh face materials per card, shared edge.
function buildInnerCard(shared, card) {
  const c = HOLDERS.innerCard;
  const geo = cached(shared, 'innerGeo',
    () => new RoundedBoxGeometry(c.w, c.h, c.d, 4, c.radius));
  const edge = cached(shared, 'innerEdge',
    () => new THREE.MeshStandardMaterial({
      color: c.edgeColor, metalness: 0.3, roughness: c.edgeRoughness,
    }));
  const { front, back } = loadFaces(shared, card);
  const face = (map) => new THREE.MeshStandardMaterial({
    map, metalness: 0, roughness: c.faceRoughness, envMapIntensity: c.faceEnvIntensity,
  });
  return new THREE.Mesh(geo, [edge, edge, edge, edge, face(front), face(back)]);
}

// One transparent glass material from a spec. Used for both the near-invisible
// front/back faces and the reflective edge band of the clear shells. Primitive
// `transmission` is avoided in r128 in favour of opacity blending + clearcoat.
function glassMaterial(spec) {
  return new THREE.MeshPhysicalMaterial({
    color: spec.tint, metalness: 0, roughness: spec.roughness,
    transparent: true, opacity: spec.opacity,
    clearcoat: spec.clearcoat, clearcoatRoughness: spec.clearcoatRoughness,
    envMapIntensity: spec.envMapIntensity,
  });
}

// A card sealed inside a clear RoundedBox shell (acrylic, slab). The shell's six
// face groups take two materials: the front/back (indices 4,5) get the clear
// `face`, the four sides (0-3, which own the grazing outer bevel) get the
// reflective `edge`. So the artwork shows through cleanly while the rim glints.
function buildEncased(shared, card, c, key) {
  const group = new THREE.Group();
  const geo = cached(shared, key + 'Geo',
    () => new RoundedBoxGeometry(c.shell.w, c.shell.h, c.shell.d, c.shell.segments, c.shell.radius));
  const face = cached(shared, key + 'Face', () => glassMaterial(c.face));
  const edge = cached(shared, key + 'Edge', () => glassMaterial(c.edge));
  const shell = new THREE.Mesh(geo, [edge, edge, edge, edge, face, face]);
  group.add(buildInnerCard(shared, card), shell);
  group.userData.card = card;
  return group;
}

// --- per-style builders -----------------------------------------------------

function buildDefault(shared, card) {
  const geo = cached(shared, 'defaultGeo',
    () => new RoundedBoxGeometry(1.5, 2.1, 0.05, 4, 0.06));
  const edge = cached(shared, 'defaultEdge',
    () => new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7, roughness: 0.25 }));
  const { front, back } = loadFaces(shared, card);
  const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge,
    new THREE.MeshStandardMaterial({ map: front }),
    new THREE.MeshStandardMaterial({ map: back })]);
  mesh.userData.card = card;
  return mesh;
}

function buildGloss(shared, card) {
  const c = HOLDERS.gloss;
  const geo = cached(shared, 'glossGeo',
    () => new RoundedBoxGeometry(1.5, 2.1, 0.05, 4, 0.06));
  const edge = cached(shared, 'glossEdge',
    () => new THREE.MeshStandardMaterial({
      color: c.edgeColor, metalness: 1.0, roughness: c.edgeRoughness,
      envMapIntensity: c.edgeEnvIntensity,
    }));
  const { front, back } = loadFaces(shared, card);
  const face = (map) => new THREE.MeshPhysicalMaterial({
    map, metalness: 0, roughness: c.faceRoughness,
    clearcoat: c.clearcoat, clearcoatRoughness: c.clearcoatRoughness,
    envMapIntensity: c.faceEnvIntensity,
  });
  const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, face(front), face(back)]);
  mesh.userData.card = card;
  return mesh;
}

function buildAcrylic(shared, card) {
  return buildEncased(shared, card, HOLDERS.acrylic, 'acrylic');
}

function buildSlab(shared, card) {
  return buildEncased(shared, card, HOLDERS.slab, 'slab');
}

function buildFrame(shared, card) {
  const c = HOLDERS.frame;
  const ic = HOLDERS.innerCard;
  const group = new THREE.Group();

  const chrome = cached(shared, 'frameChrome',
    () => new THREE.MeshStandardMaterial({
      color: c.chromeColor, metalness: 1.0, roughness: c.chromeRoughness,
      envMapIntensity: c.chromeEnvIntensity,
    }));
  const fw = c.frameWidth, fd = c.frameDepth, r = Math.min(fw, fd) * 0.45;
  const hbar = cached(shared, 'frameHBar',
    () => new RoundedBoxGeometry(ic.w + 2 * fw, fw, fd, 3, r));
  const vbar = cached(shared, 'frameVBar',
    () => new RoundedBoxGeometry(fw, ic.h, fd, 3, r));

  const top = new THREE.Mesh(hbar, chrome); top.position.y = ic.h / 2 + fw / 2;
  const bottom = new THREE.Mesh(hbar, chrome); bottom.position.y = -(ic.h / 2 + fw / 2);
  const left = new THREE.Mesh(vbar, chrome); left.position.x = -(ic.w / 2 + fw / 2);
  const right = new THREE.Mesh(vbar, chrome); right.position.x = ic.w / 2 + fw / 2;

  const glass = new THREE.Mesh(
    cached(shared, 'frameGlassGeo', () => new THREE.PlaneGeometry(ic.w, ic.h)),
    cached(shared, 'frameGlassMat',
      () => new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0, roughness: c.glassRoughness,
        transparent: true, opacity: c.glassOpacity,
        clearcoat: 1.0, clearcoatRoughness: 0.02, envMapIntensity: c.glassEnvIntensity,
      })),
  );
  glass.position.z = ic.d / 2 + c.glassOffset;

  group.add(buildInnerCard(shared, card), top, bottom, left, right, glass);
  group.userData.card = card;
  return group;
}

const BUILDERS = {
  default: buildDefault,
  acrylic: buildAcrylic,
  slab: buildSlab,
  gloss: buildGloss,
  frame: buildFrame,
};

// Build the Object3D (Mesh for default/gloss, Group for the layered styles) for
// one card. The result carries userData.card and is positioned as a whole by
// the animation loop, so layered styles move together.
export function buildCardMesh(card, style, shared) {
  return (BUILDERS[style] || buildDefault)(shared, card);
}
