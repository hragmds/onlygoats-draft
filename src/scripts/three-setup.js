import * as THREE from 'three';
import { CategoryCards } from './CategoryCards.js';
import { RegularCards } from './RegularCards.js';

let container, camera, scene, renderer;
let scrollY = 0;
let targetScrollY = 0;

// Card managers
let categoryCardsManager;
let regularCardsManager;

// Mouse parallax variables
let mouseX = 0;
let mouseY = 0;
let targetCameraX = 0;
let targetCameraY = 0;

const ANIMATION_SPEED = 1;
const MOUSE_INFLUENCE = 0.1;
const MOUSE_SMOOTHING = 0.08;
const MAX_MOUSE_OFFSET = 1.5;

export function initThreeScene() {
  init();
  animate();
}

function init() {
  container = document.getElementById('container');
  
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01,
    100
  );
  camera.position.z = 8;
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  // Create shared materials
  const textureLoader = new THREE.TextureLoader();
  const slabPlasticMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.8,
    roughness: 0.1,
    side: THREE.FrontSide
  });
  
  // Initialize regular cards
  regularCardsManager = new RegularCards();
  regularCardsManager.createCards(scene, textureLoader, slabPlasticMaterial);
  
  // Initialize category cards
  categoryCardsManager = new CategoryCards();
  categoryCardsManager.init();
  categoryCardsManager.createCards(textureLoader, slabPlasticMaterial);
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Track scroll
  window.addEventListener('scroll', onWindowScroll);
  
  // Track mouse movement
  window.addEventListener('mousemove', onMouseMove);
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  
  // Resize category renderer
  if (categoryCardsManager) {
    categoryCardsManager.onResize();
  }
}

function onWindowScroll() {
  targetScrollY = window.scrollY;
}

function onMouseMove(event) {
  mouseX = -(event.clientX / window.innerWidth) * 2;
  mouseY = (event.clientY / window.innerHeight) * 2;
}

function animate() {
  requestAnimationFrame(animate);
  
  const timer = 0.000005 * ANIMATION_SPEED * Date.now();
  
  scrollY += (targetScrollY - scrollY) * 0.05;
  const scrollProgress = scrollY * 0.0005;
  
  // Animate regular cards
  if (regularCardsManager) {
    regularCardsManager.animate(timer, scrollProgress, ANIMATION_SPEED);
  }
  
  // Animate category cards
  if (categoryCardsManager) {
    categoryCardsManager.animate(timer);
  }
  
  // Smooth mouse parallax
  targetCameraX += (mouseX * MOUSE_INFLUENCE - targetCameraX) * MOUSE_SMOOTHING;
  targetCameraY += (mouseY * MOUSE_INFLUENCE - targetCameraY) * MOUSE_SMOOTHING;
  
  // Clamp camera movement
  targetCameraX = Math.max(-MAX_MOUSE_OFFSET, Math.min(MAX_MOUSE_OFFSET, targetCameraX));
  targetCameraY = Math.max(-MAX_MOUSE_OFFSET, Math.min(MAX_MOUSE_OFFSET, targetCameraY));
  
  const scrollCameraY = -scrollProgress * 3;
  camera.position.x = targetCameraX;
  camera.position.y = scrollCameraY + targetCameraY;
  camera.position.z = 8;
  
  camera.lookAt(targetCameraX * 0.5, scrollCameraY + targetCameraY * 0.5, 0);
  
  renderer.render(scene, camera);
  
  // Render category cards in their own renderer
  if (categoryCardsManager) {
    categoryCardsManager.render();
  }
}

const reviews = [
  "Adam is amazing to work with. Honest and a man of his word. And The Hair!!",
  "The quality of the cards I received exceeded my expectations. Highly recommend!",
  "Fast shipping and excellent customer service. Will definitely order again!"
];

let currentReview = 0;

window.showReview = function(index) {
  currentReview = index;
  const reviewText = document.getElementById('review-text');
  const dots = document.querySelectorAll('.dot');
  
  // Fade out review text and dots
  reviewText.classList.add('fade-out');
  dots.forEach(dot => dot.classList.add('fade-out'));
  
  // Change text and update dots, then fade back in
  setTimeout(() => {
    reviewText.textContent = reviews[index] || reviews[0];
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
    reviewText.classList.remove('fade-out');
    dots.forEach(dot => dot.classList.remove('fade-out'));
  }, 250);
};

// Auto-advance carousel every 3 seconds
setInterval(() => {
  currentReview = (currentReview + 1) % reviews.length;
  showReview(currentReview);
}, 3000);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThreeScene);
} else {
  initThreeScene();
}
