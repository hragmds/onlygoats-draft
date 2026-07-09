import * as THREE from "three";
import { CategoryCards } from "./CategoryCards.js";

let categoryCardsManager;

function init() {
  const textureLoader = new THREE.TextureLoader();
  const slabPlasticMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.8,
    roughness: 0.1,
    side: THREE.FrontSide,
  });

  categoryCardsManager = new CategoryCards();
  categoryCardsManager.init();
  categoryCardsManager.createCards(textureLoader, slabPlasticMaterial);

  window.addEventListener("resize", () => {
    if (categoryCardsManager) categoryCardsManager.onResize();
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (categoryCardsManager) {
    categoryCardsManager.animate();
    categoryCardsManager.render();
  }
}

const reviews = [
  "Adam is amazing to work with. Honest and a man of his word. And The Hair!!",
  "Great seller, great communication, fast delivery, and great card!! I would highly recommend. A++++ This is one of the top sellers I've experienced.",
  "Great and wonderful! Item came in high-quality condition. Adam is very nice, and I highly enjoyed doing business with them.",
];

let currentReview = 0;

window.showReview = function (index) {
  currentReview = index;
  const reviewText = document.getElementById("review-text");
  const dots = document.querySelectorAll(".dot");

  // Fade out review text and dots
  reviewText.classList.add("fade-out");
  dots.forEach((dot) => dot.classList.add("fade-out"));

  // Change text and update dots, then fade back in
  setTimeout(() => {
    reviewText.textContent = reviews[index] || reviews[0];
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
    reviewText.classList.remove("fade-out");
    dots.forEach((dot) => dot.classList.remove("fade-out"));
  }, 250);
};

// Auto-advance carousel every 3 seconds
setInterval(() => {
  currentReview = (currentReview + 1) % reviews.length;
  showReview(currentReview);
}, 3000);

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init();
    animate();
  });
} else {
  init();
  animate();
}
