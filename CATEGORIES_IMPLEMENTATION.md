# Categories Component Implementation

## Overview
Added a new "Explore Our Categories" section to the homepage featuring 5 interactive Three.js cards representing different sports categories.

## Features Implemented

### 1. Categories Section HTML
- Added a new section (`categories-section`) positioned before the scrollable area
- Includes title "Explore Our Categories" and descriptive text
- Section has responsive styling with proper padding and centering

### 2. Five Category Cards
The following sport categories are displayed as 3D cards:
1. **Baseball** (Red - #e74c3c)
2. **Basketball** (Orange - #e67e22)
3. **Hockey** (Blue - #3498db)
4. **Golf** (Green - #27ae60)
5. **Football** (Purple - #9b59b6)

### 3. Card Appearance
- Same dimensions as existing cards (1.5 x 2.1 x 0.02)
- Canvas-based textures with category name in white text
- Colored backgrounds for each sport category
- Professional border design with "CATEGORY" subtitle

### 4. Scroll-Based Animation States

#### State 1: Hidden
- Cards start below the viewport (y: -50)
- Not visible until user scrolls down

#### State 2: Floating Up
- Triggered when user scrolls to the categories section
- Cards smoothly animate upward from below
- Gentle rotation effect during transition
- Progress-based animation for smooth appearance

#### State 3: Fixed Position
- Cards reach their display position and lock in place
- Arranged horizontally in a row
- Gentle idle animation (subtle rotation) while fixed
- Cards maintain position while user scrolls through the section

#### State 4: Floating Away
- Activated after scrolling past a threshold
- Cards break from fixed position and join the main 3D card animation
- Transition to orbital motion matching the existing cards
- Increase in speed and rotation as they float into space
- Seamlessly integrate with the existing floating card system

### 5. Technical Implementation

#### Key Functions:
- `createTextTexture(text, bgColor)` - Generates canvas-based card textures with text labels
- `updateCategorySectionBounds()` - Calculates section position for scroll detection
- Category animation logic in `animate()` function with state management

#### Animation Parameters:
- Float-up duration: Controlled by scroll progress
- Fixed position: Maintained while in section viewport
- Float-away threshold: Bottom 50% of section height
- Smooth transitions with lerp interpolation (0.1 smoothing factor)

#### Responsive Design:
- Mobile optimized with reduced padding
- Smaller title fonts on mobile devices
- Maintains aspect ratio across screen sizes

## Testing Notes

### Browser Requirements:
- Three.js library must be loaded (via CDN or local)
- Modern browser with WebGL support
- JavaScript enabled

### Scroll Behavior:
1. Load page - cards are hidden
2. Scroll to "Explore Our Categories" section - cards float up into view
3. Continue scrolling through section - cards remain fixed with gentle rotation
4. Scroll past section - cards float away and join the space animation

## File Changes
- `index.html` - Added categories section HTML and Three.js code

## CSS Classes Added
- `.categories-section` - Main section container
- `.categories-title` - Section heading
- `.categories-description` - Descriptive text
- Responsive media queries for mobile devices

## Known Limitations
- Requires Three.js CDN to be accessible
- Performance depends on device GPU capabilities
- Animation thresholds may need tuning based on actual content height

## Future Enhancements
- Add click interactions to navigate to category pages
- Include category-specific card images instead of text labels
- Add sound effects during transitions
- Implement touch gestures for mobile
