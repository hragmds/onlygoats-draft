import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { SCENE, buildCards } from './hero-config.js';
import { computeScrollProgress, cardTransform, clamp } from './motion.js';

export function initOgHero(container, options = {}) {
  if (!container) throw new Error('initOgHero: container is required');

  const scene = new THREE.Scene();
  const cfg = { ...SCENE, ...(options.scene || {}) };
  const basePath = options.basePath || '';
  const cards = options.cards || buildCards(basePath);

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

  const loader = new THREE.TextureLoader();
  const edge = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7, roughness: 0.25 });
  const geometry = new RoundedBoxGeometry(1.5, 2.1, 0.05, 4, 0.06);

  const meshes = cards.map((card) => {
    const front = loader.load(card.src);
    // Same card face on the back too, mirrored horizontally so it reads
    // upright (not reversed) when the slow spin turns the card around.
    const back = loader.load(card.src);
    back.wrapS = THREE.RepeatWrapping;
    back.repeat.x = -1;
    const materials = [edge, edge, edge, edge,
      new THREE.MeshStandardMaterial({ map: front }),
      new THREE.MeshStandardMaterial({ map: back })];
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.userData.card = card;
    scene.add(mesh);
    return mesh;
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
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
