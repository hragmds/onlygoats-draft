import * as THREE from 'three';
import { SCENE, buildCards, buildBackgroundCards, shouldShowBackgroundCards } from './hero-config.js';
import { computeScrollProgress, cardTransform, clamp } from './motion.js';
import { resolveHolderStyle, createHolderResources, buildCardMesh } from './holders.js';

export function initOgHero(container, options = {}) {
  if (!container) throw new Error('initOgHero: container is required');

  const scene = new THREE.Scene();
  const cfg = { ...SCENE, ...(options.scene || {}) };
  const basePath = options.basePath || '';
  const cards = options.cards || buildCards(basePath);
  // Smaller, faster-drifting duplicate cards behind the main cluster (z < 0),
  // derived from whichever main cards were resolved above. Off by default;
  // ?ogbg=on adds them for a side-by-side view against the main-7-only look.
  const showBackground = options.showBackgroundCards !== undefined
    ? options.showBackgroundCards
    : shouldShowBackgroundCards(location.search);
  const backgroundCards = showBackground ? (options.backgroundCards || buildBackgroundCards(cards)) : [];
  const allCards = cards.concat(backgroundCards);

  const params = new URLSearchParams(location.search);
  const forcedParam = params.get('ogscroll');
  const forcedProgress = forcedParam === null ? null : clamp(parseFloat(forcedParam), 0, 1);
  const forcedTimeParam = params.get('ogtime');
  const forcedTime = forcedTimeParam === null ? null : parseFloat(forcedTimeParam);
  const reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  scene.background = new THREE.Color(cfg.background);

  const camera = new THREE.PerspectiveCamera(cfg.fov, 16 / 9, 0.01, 100);
  camera.position.z = cfg.cameraZ;

  scene.add(new THREE.AmbientLight(0xffffff, cfg.ambient));
  const key = new THREE.DirectionalLight(0xffffff, cfg.keyLight);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, cfg.rimLight);
  rim.position.set(-6, -2, -4);
  scene.add(rim);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, cfg.pixelRatioCap));
  container.appendChild(renderer.domElement);

  // Holder style defaults to 'gloss' (the production look); ?ogholder=<name>
  // switches to an alternate style, including 'default' for the original flat
  // gray edge. Shiny styles reflect a procedural env map (built once, below).
  // The renderer stays in its legacy color path on purpose so the photographic
  // card artwork keeps its exact vividness — the shine comes from the env map
  // + materials, not tone mapping.
  const holderStyle = resolveHolderStyle(location.search);
  const holders = createHolderResources(holderStyle, renderer);
  if (holders.environment) scene.environment = holders.environment;

  const meshes = allCards.map((card) => {
    const obj = buildCardMesh(card, holderStyle, holders);
    if (card.scale) obj.scale.setScalar(card.scale);
    scene.add(obj);
    return obj;
  });

  const ranges = {
    floatSpeed: cfg.floatSpeed, swayAmp: cfg.swayAmp,
    scrollDriftY: cfg.scrollDriftY, scrollDriftZ: cfg.scrollDriftZ,
  };

  camera.position.set(0, 0, cfg.cameraZ);
  camera.lookAt(0, 0, 0);

  let lastW = 0, lastH = 0;
  function resize() {
    const w = container.offsetWidth, h = container.offsetHeight;
    if (!w || !h) return;
    if (w === lastW && h === lastH) return; // ignore no-op ResizeObserver fires
    lastW = w;
    lastH = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    // Repaint immediately at the new size so a cleared buffer never gets shown.
    renderer.render(scene, camera);
  }

  function frame(now, timeSec) {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const progress = forcedProgress !== null
      ? forcedProgress
      : computeScrollProgress(scrollY, container.offsetHeight);

    for (const mesh of meshes) {
      const t = cardTransform(mesh.userData.card, progress, timeSec, ranges);
      mesh.position.set(t.x, t.y, t.z);
      mesh.rotation.set(t.rotX, t.rotY, t.rotZ);
    }

    renderer.render(scene, camera);
  }

  // --- lifecycle ---
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let rafId = null;
  let visible = true;
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    frame(now, forcedTime !== null ? forcedTime : now * 0.001);
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && rafId === null && !reduceMotion) {
      rafId = requestAnimationFrame(loop);
    } else if (!visible && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }, { threshold: 0 });
  io.observe(container);

  if (reduceMotion) {
    frame(0, 0); // one static composed frame, no loop
  } else {
    rafId = requestAnimationFrame(loop);
  }

  return {
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      holders.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
