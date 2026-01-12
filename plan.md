# Category Cards Flip Animation - Implementation Plan

## Overview
Transform the category cards section to feature a scroll-triggered flip and spread animation where cards start stacked (rear side up) and animate to their final spread positions.

---

## Current State Analysis

### Existing Implementation:
- **CategoryCards.js**: Manages 5 category cards (Baseball, Basketball, Hockey, Golf, Football)
- **Current Position**: Cards are positioned in a horizontal row with proper spacing
- **Rendering**: Separate Three.js scene/renderer in `#category-cards-container`
- **Materials**: Cards have front texture (category image) and back texture
- **No Animation**: Currently the `animate()` method is empty

---

## Desired Behavior

### Initial State (Before Scroll Trigger):
- ✅ Cards stacked on top of each other at center
- ✅ All cards showing rear/back side (rotated 180° on Y-axis)
- ✅ Slight Z-offset between cards (to show depth/stacking)

### Scroll Trigger:
- ✅ When `categories-section` top reaches viewport top
- ✅ Section becomes sticky (`position: sticky`)
- ✅ Animation sequence begins

### Animation Sequence:

**Phase 1: Flip Animation**
- Cards flip from back to front (180° rotation on Y-axis)
- Options to clarify:
  - [ ] QUESTION 1: All cards flip simultaneously OR sequentially?
  - [ ] QUESTION 2: Flip duration (suggested: 0.8-1.2s)?

**Phase 2: Spread Animation**
- Cards move from stacked center to their final horizontal positions
- Options to clarify:
  - [ ] QUESTION 3: Spread simultaneously OR sequentially?
  - [ ] QUESTION 4: Easing type (suggested: easeOutCubic)?
  - [ ] QUESTION 5: Spread duration (suggested: 1.0-1.5s)?

### Post-Animation State:
- Options to clarify:
  - [ ] QUESTION 6: Remain sticky or unstick?
  - [ ] QUESTION 7: Cards static or interactive?
  - [ ] QUESTION 8: Can animation reverse on scroll up?

---

## Technical Implementation Plan

### Phase 1: CSS Sticky Setup
**File**: `src/pages/index.astro`

```css
.categories-section {
  position: sticky;
  top: 0;
  /* existing styles... */
}
```

### Phase 2: Card State Management
**File**: `src/scripts/CategoryCards.js`

Add state tracking:
```javascript
constructor() {
  // ... existing properties
  this.animationState = 'idle'; // idle, flipping, spreading, complete
  this.animationProgress = 0; // 0 to 1
  this.flipProgress = 0;
  this.spreadProgress = 0;
  this.isSticky = false;
}
```

### Phase 3: Initial Card Setup (Stacked & Flipped)
**File**: `src/scripts/CategoryCards.js` - `createCards()` method

Modify card initial position/rotation:
```javascript
categoryMesh.position.x = 0; // Center instead of spread
categoryMesh.position.y = 0;
categoryMesh.position.z = i * 0.1; // Slight Z-stacking
categoryMesh.rotation.y = Math.PI; // Flipped 180° (back side visible)

categoryMesh.userData = {
  index: i,
  baseX: startX + i * spacing, // Store final target position
  targetX: startX + i * spacing,
  layer: 0,
  progress: 0,
  initialRotation: Math.PI,
  targetRotation: 0
};
```

### Phase 4: Scroll Detection & Sticky Trigger
**File**: `src/scripts/CategoryCards.js` - `animate()` method

Implement scroll detection:
```javascript
animate(timer) {
  // Detect if section is sticky
  const categoriesSection = document.getElementById('categories-section');
  if (!categoriesSection) return;
  
  const rect = categoriesSection.getBoundingClientRect();
  const isNowSticky = rect.top <= 0 && rect.bottom > window.innerHeight;
  
  // Trigger animation when becoming sticky
  if (isNowSticky && !this.isSticky && this.animationState === 'idle') {
    this.animationState = 'flipping';
    this.animationStartTime = Date.now();
  }
  
  this.isSticky = isNowSticky;
  
  // Run animation states
  if (this.animationState === 'flipping') {
    this.animateFlip(timer);
  } else if (this.animationState === 'spreading') {
    this.animateSpread(timer);
  }
}
```

### Phase 5: Flip Animation
**File**: `src/scripts/CategoryCards.js`

New method:
```javascript
animateFlip(timer) {
  const FLIP_DURATION = 1000; // ms - TO BE CONFIRMED
  const elapsed = Date.now() - this.animationStartTime;
  this.flipProgress = Math.min(elapsed / FLIP_DURATION, 1);
  
  // Easing function (easeOutCubic)
  const eased = 1 - Math.pow(1 - this.flipProgress, 3);
  
  this.cards.forEach((card, index) => {
    // OPTION A: Simultaneous flip
    card.rotation.y = Math.PI * (1 - eased);
    
    // OPTION B: Sequential flip (uncomment if preferred)
    // const cardDelay = index * 0.1; // 100ms stagger
    // const cardProgress = Math.max(0, Math.min(1, (this.flipProgress - cardDelay) / (1 - cardDelay)));
    // const cardEased = 1 - Math.pow(1 - cardProgress, 3);
    // card.rotation.y = Math.PI * (1 - cardEased);
  });
  
  // Transition to spreading when flip complete
  if (this.flipProgress >= 1) {
    this.animationState = 'spreading';
    this.animationStartTime = Date.now();
  }
}
```

### Phase 6: Spread Animation
**File**: `src/scripts/CategoryCards.js`

New method:
```javascript
animateSpread(timer) {
  const SPREAD_DURATION = 1200; // ms - TO BE CONFIRMED
  const elapsed = Date.now() - this.animationStartTime;
  this.spreadProgress = Math.min(elapsed / SPREAD_DURATION, 1);
  
  // Easing function (easeOutCubic)
  const eased = 1 - Math.pow(1 - this.spreadProgress, 3);
  
  this.cards.forEach((card, index) => {
    // OPTION A: Simultaneous spread
    card.position.x = card.userData.targetX * eased;
    
    // OPTION B: Sequential spread (uncomment if preferred)
    // const cardDelay = index * 0.1;
    // const cardProgress = Math.max(0, Math.min(1, (this.spreadProgress - cardDelay) / (1 - cardDelay)));
    // const cardEased = 1 - Math.pow(1 - cardProgress, 3);
    // card.position.x = card.userData.targetX * cardEased;
  });
  
  // Mark animation complete
  if (this.spreadProgress >= 1) {
    this.animationState = 'complete';
  }
}
```

### Phase 7: Optional - Scroll Progress Control
**Alternative Implementation**: Instead of time-based animation, use scroll position

```javascript
// Calculate scroll progress through sticky section
const scrollProgress = Math.max(0, Math.min(1, 
  (window.scrollY - this.sectionTop) / (window.innerHeight * 0.5)
));

// Map scroll progress to animation phases
if (scrollProgress < 0.5) {
  // First half of scroll = flip
  const flipProgress = scrollProgress * 2;
  // Apply flip based on scroll
} else {
  // Second half = spread
  const spreadProgress = (scrollProgress - 0.5) * 2;
  // Apply spread based on scroll
}
```

---

## Files to Modify

1. ✅ **src/pages/index.astro**
   - Add `position: sticky` to `.categories-section`

2. ✅ **src/scripts/CategoryCards.js**
   - Update `constructor()` - add animation state properties
   - Update `createCards()` - set initial stacked/flipped positions
   - Implement `animate()` - scroll detection and state management
   - Add `animateFlip()` - flip animation logic
   - Add `animateSpread()` - spread animation logic
   - Add helper easing functions if needed

3. ⚠️ **src/scripts/three-setup.js**
   - Potentially pass scroll position to CategoryCards if needed
   - No major changes required

---

## Questions Needing Clarification

### Critical Design Decisions:

1. **Stacking Visual**: 
   - Should cards be perfectly stacked or slightly fanned for depth?
   - Suggested: Slight Z-offset (0.1 per card) for depth perception

2. **Flip Timing**:
   - Simultaneous (all at once) or Sequential (one after another)?
   - Duration: 800ms - 1200ms?

3. **Spread Timing**:
   - Simultaneous or Sequential?
   - Duration: 1000ms - 1500ms?
   - Delay between flip completion and spread start?

4. **Sticky Behavior**:
   - Stay sticky during entire animation only?
   - Or remain sticky even after animation completes?

5. **Animation Trigger**:
   - **Option A**: Time-based (auto-play when sticky)
   - **Option B**: Scroll-based (user scroll controls animation progress)
   - Recommended: Option A (auto-play) for better UX

6. **Reversibility**:
   - Should animation reverse when scrolling back up?
   - Or stay in completed state?

7. **Post-Animation**:
   - Cards remain static?
   - Or add hover/interaction effects?

---

## Testing Checklist

- [ ] Cards start properly stacked and flipped
- [ ] Section becomes sticky at correct scroll position
- [ ] Flip animation plays smoothly
- [ ] Spread animation positions cards correctly
- [ ] Animation only plays once (or resets properly)
- [ ] Works on different screen sizes
- [ ] No performance issues during animation
- [ ] Cards remain at correct positions after animation

---

## Next Steps

1. ⏳ **Get clarification on questions above**
2. ⏳ **Implement Phase 1-3** (setup and initial state)
3. ⏳ **Implement Phase 4-6** (animations)
4. ⏳ **Test and refine**
5. ⏳ **Add polish (easing, timing tweaks)**

---

## Recommended Defaults (If No Preference)

Based on common UX patterns:
- ✅ Slight Z-offset stacking (visible depth)
- ✅ Simultaneous flip (more impactful)
- ✅ Flip duration: 1000ms
- ✅ Sequential spread with 100ms stagger (creates flow)
- ✅ Spread duration: 1200ms total
- ✅ Time-based auto-play animation
- ✅ Remain sticky during animation, unstick after
- ✅ Animation plays once (no reverse)
- ✅ Cards static after animation
