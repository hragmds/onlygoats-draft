import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';


export class CategoryCards {
  constructor() {
    this.cards = [];
    this.container = null;
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.sectionTop = 0;
    this.sectionBottom = 0;
    
    // Animation state
    this.scrollProgress = 0; // 0 to 1 based on scroll through section
    this.ANIMATION_SCROLL_DISTANCE = 3200; // Pixels to scroll for full animation (adjustable)
    this.STICKY_BUFFER = 0; // Extra scroll after animation before unstick
    this.stickyStartScroll = null; // Track when section became sticky
    
    // Interaction state
    this.raycaster = null; // Will be initialized in init()
    this.mouse = new THREE.Vector2(-999, -999); // Start off-screen
    this.hoveredCard = null;
    this.interactionsEnabled = false;
    this.mouseIsOver = false; // Track if mouse is over canvas
    
    // Bind methods
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  init() {
    this.container = document.getElementById('category-cards-container');
    if (!this.container) return;

    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100);
    this.camera.position.z = 20;
    this.camera.position.y = 0;

    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent background
    
    // Initialize raycaster
    this.raycaster = new THREE.Raycaster();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Add event listeners
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mouseleave', this.onMouseLeave);
    this.renderer.domElement.addEventListener('click', this.onClick);
    this.renderer.domElement.style.cursor = 'default';

    this.updateSectionDimensions();
  }

  createCards(textureLoader, slabPlasticMaterial) {
    const categories = [
      { name: 'Baseball', image: '/onlygoats-draft/assets/Baseball-Category.png' },
      { name: 'Basketball', image: '/onlygoats-draft/assets/Basketball-Category.png' },
      { name: 'Hockey', image: '/onlygoats-draft/assets/Hockey-Category.png' },
      { name: 'Golf', image: '/onlygoats-draft/assets/Golf-Category.png' },
      { name: 'Football', image: '/onlygoats-draft/assets/Football-Category.png' }
    ];

    // Calculate card scale based on viewport width
    const containerWidth = this.container ? this.container.offsetWidth : window.innerWidth;
    const containerHeight = this.container ? this.container.offsetHeight : 500;
    const aspect = containerWidth / containerHeight;

    // Calculate visible width in 3D units
    const visibleWidth = this.calculateVisibleWidth(20, 45, aspect);

    // Card dimensions and spacing in base units
    const baseCardWidth = 1.5;
    const baseSpacingRatio = 0.2;

    // Calculate total width needed:
    // - 4 gaps between 5 cards, each gap = cardWidth * spacingRatio
    // - Plus half a card width on each edge (left and right)
    // Total = 4 * cardWidth * (1 + spacingRatio) + cardWidth
    //       = cardWidth * (4 * (1 + spacingRatio) + 1)
    //       = cardWidth * (4 * 1.3 + 1) = cardWidth * 6.2
    const totalUnitsNeeded = baseCardWidth * (4 * (1 + baseSpacingRatio) + 1);

    // Calculate scale to fit in visible width (with 15% margin for breathing room)
    const CARD_SCALE = Math.min(5, (visibleWidth * 0.85) / totalUnitsNeeded);

    const categoryGeometry = new RoundedBoxGeometry(1.5 * CARD_SCALE, 2.1 * CARD_SCALE, 0.05, 4, 0.06);
    const categoryBackTexture = textureLoader.load('/onlygoats-draft/assets/back.png');
    const spacing = baseCardWidth * CARD_SCALE * (1 + baseSpacingRatio);
    
    // Calculate start position to center the group symmetrically
    // Position cards at: -2*spacing, -1*spacing, 0, 1*spacing, 2*spacing for 5 cards
    const centerOffset = (categories.length - 1) / 2;

    categories.forEach((category, i) => {
      const frontTexture = textureLoader.load(category.image);

      const materials = [
        slabPlasticMaterial,
        slabPlasticMaterial,
        slabPlasticMaterial,
        slabPlasticMaterial,
        new THREE.MeshStandardMaterial({ map: frontTexture }),
        new THREE.MeshStandardMaterial({ map: categoryBackTexture })
      ];

      const categoryMesh = new THREE.Mesh(categoryGeometry, materials);
      // Start stacked at center, with slight Z-offset for depth
      categoryMesh.position.x = i * 0.25;
      categoryMesh.position.y = 0;
      categoryMesh.position.z = i * 0.5; // Very slight offset
      // Start flipped (back side visible)
      categoryMesh.rotation.y = Math.PI;
      
      categoryMesh.userData = {
        index: i,
        categoryName: category.name,
        targetX: (i - centerOffset) * spacing, // Position relative to center
        initialX: 0,
        initialRotation: Math.PI,
        targetRotation: 0,
        layer: 0,
        progress: 0,
        baseScale: 1,
        hoverScale: 1,
        baseZ: i * 0.5,
        hoverZ: 0
      };
      
      if (this.scene) {
        this.scene.add(categoryMesh);
      }
      this.cards.push(categoryMesh);
    });
  }

  calculateVisibleWidth(cameraZ, fov, aspect) {
    const vFOV = fov * Math.PI / 180;
    const visibleHeight = 2 * Math.tan(vFOV / 2) * cameraZ;
    const visibleWidth = visibleHeight * aspect;
    return visibleWidth;
  }

  updateSectionDimensions() {
    const categoriesSection = document.getElementById('categories-section');
    if (categoriesSection) {
      const rect = categoriesSection.getBoundingClientRect();
      this.sectionTop = categoriesSection.offsetTop;
      this.sectionBottom = this.sectionTop + categoriesSection.offsetHeight;
    }
  }

  animate(timer) {
    const categoriesSection = document.getElementById('categories-section');
    if (!categoriesSection) return;
    
    const rect = categoriesSection.getBoundingClientRect();
    const currentScroll = window.scrollY || window.pageYOffset;
    
    // Update section position on first call or resize
    if (this.sectionTop === 0) {
      this.updateSectionDimensions();
    }
    
    // Check if section has reached the top of viewport (sticky threshold)
    const isAtTop = rect.top <= 0;
    
    if (isAtTop) {
      // Section is sticky - track when it first became sticky
      if (this.stickyStartScroll === null) {
        this.stickyStartScroll = currentScroll;
      }
      
      // Calculate how much we've scrolled since becoming sticky
      const scrolledSinceSticky = currentScroll - this.stickyStartScroll;
      
      // Map scroll distance to progress (0 to 1)
      this.scrollProgress = Math.min(1, scrolledSinceSticky / this.ANIMATION_SCROLL_DISTANCE);
    } else {
      // Section hasn't reached top yet or scrolled back up
      this.scrollProgress = 0;
      this.stickyStartScroll = null;
    }
    
    // Apply animation based on scroll progress
    this.applyScrollAnimation();
    
    // Check for hover intersections every frame (like the working example)
    this.checkIntersections();
  }
  
  applyScrollAnimation() {
    if (this.cards.length === 0) return;
    
    // Easing function for variable speed (slow start, fast middle, slow end)
    // Use easeInOutCubic for smooth acceleration and deceleration
    const easeInOutCubic = (t) => {
      return t < 0.5
        ? 4 * t * t * t  // Ease in (accelerate)
        : 1 - Math.pow(-2 * t + 2, 3) / 2;  // Ease out (decelerate)
    };
    
    // Split animation into two phases:
    // Phase 1 (0 - 0.4): Flip cards
    // Phase 2 (0.4 - 1.0): Spread cards
    
    const flipProgress = Math.min(1, this.scrollProgress / 0.4);
    const spreadProgress = Math.max(0, (this.scrollProgress - 0.4) / 0.6);
    
    const easedFlip = easeInOutCubic(flipProgress);
    const easedSpread = easeInOutCubic(spreadProgress);
    
    // Enable interactions only when cards are fully flipped
    const wasEnabled = this.interactionsEnabled;
    this.interactionsEnabled = flipProgress >= 1;
    
    // Reset hover state when interactions are disabled
    if (wasEnabled && !this.interactionsEnabled) {
      this.hoveredCard = null;
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.style.cursor = 'default';
      }
    }
    
    this.cards.forEach((card) => {
      // Animate rotation (flip from back to front)
      card.rotation.y = card.userData.initialRotation * (1 - easedFlip);
      
      // Animate position (spread from center to final positions)
      const baseX = card.userData.initialX + (card.userData.targetX - card.userData.initialX) * easedSpread;
      card.position.x = baseX;
      
      // Apply hover effects with smooth interpolation
      const isHovered = this.interactionsEnabled && this.hoveredCard === card;
      const targetHoverScale = isHovered ? 1.1 : 1;
      const targetHoverZ = isHovered ? 1.5 : 0;
      
      // Smooth interpolation for hover effects
      card.userData.hoverScale += (targetHoverScale - card.userData.hoverScale) * 0.15;
      card.userData.hoverZ += (targetHoverZ - card.userData.hoverZ) * 0.15;
      
      card.scale.set(card.userData.hoverScale, card.userData.hoverScale, card.userData.hoverScale);
      card.position.z = card.userData.baseZ + card.userData.hoverZ;
    });
  }

  onMouseMove(event) {
    if (!this.container || !this.renderer) return;
    
    this.mouseIsOver = true;
    
    // Get bounding box of renderer canvas
    const rect = this.renderer.domElement.getBoundingClientRect();
    
    // Convert to normalized device coordinates (-1 to +1)
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    
    // Don't need to call checkIntersections here since it's called every frame in animate()
  }
  
  onMouseLeave() {
    this.mouseIsOver = false;
    this.mouse.set(-999, -999); // Move mouse off-screen
    
    // Reset hover state
    if (this.hoveredCard) {
      this.hoveredCard = null;
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.style.cursor = 'default';
      }
    }
  }
  
  onClick(event) {
    
    if (!this.interactionsEnabled || !this.renderer || !this.camera) {
      return;
    }
    
    // Use the current hoveredCard since we're checking intersections every frame
    if (this.hoveredCard) {
      const categoryName = this.hoveredCard.userData.categoryName;
      
      // Dispatch custom event with category info
      const clickEvent = new CustomEvent('categoryCardClick', {
        detail: {
          category: categoryName,
          index: this.hoveredCard.userData.index
        }
      });
      document.dispatchEvent(clickEvent);
      
      // You can add navigation or other actions here
      // For example: window.location.href = `/category/${categoryName.toLowerCase()}`;
    }
  }
  
  checkIntersections() {
    // Don't check if interactions are disabled or mouse not over canvas
    if (!this.interactionsEnabled) {
      // Only log once when first disabled
      if (this.hoveredCard !== null) {
        this.hoveredCard = null;
        this.hoveredCard = null;
        if (this.renderer && this.renderer.domElement) {
          this.renderer.domElement.style.cursor = 'default';
        }
      }
      return;
    }
    
    if (!this.mouseIsOver) {
      return;
    }
    
    // Ensure we have all required objects
    if (!this.raycaster || !this.camera || this.cards.length === 0) {
      return;
    }
    
    // Update raycaster with current mouse and camera
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check for intersections with cards (not recursive)
    const intersects = this.raycaster.intersectObjects(this.cards, false);
    
    if (intersects.length > 0) {
      const newHovered = intersects[0].object;
      
      // Only update if it's a different card
      if (this.hoveredCard !== newHovered) {
        this.hoveredCard = newHovered;
        if (this.renderer && this.renderer.domElement) {
          this.renderer.domElement.style.cursor = 'pointer';
        }
      }
    } else {
      // No intersection - clear hover
      if (this.hoveredCard !== null) {
        this.hoveredCard = null;
        if (this.renderer && this.renderer.domElement) {
          this.renderer.domElement.style.cursor = 'default';
        }
      }
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;

    const catWidth = this.container.offsetWidth;
    const catHeight = this.container.offsetHeight;
    this.camera.aspect = catWidth / catHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(catWidth, catHeight);

    this.updateSectionDimensions();
  }
  
  destroy() {
    // Clean up event listeners
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
      this.renderer.domElement.removeEventListener('mouseleave', this.onMouseLeave);
      this.renderer.domElement.removeEventListener('click', this.onClick);
    }
  }
}
