# Three.js - JavaScript 3D Library

Three.js is a comprehensive, easy-to-use JavaScript 3D library that provides an accessible API for WebGL and WebGPU rendering. The library abstracts the complexity of 3D graphics programming through an intuitive scene graph architecture, offering a complete toolkit for creating interactive 3D experiences in the browser. With support for multiple renderers (WebGL2, WebGPU, and addons for SVG and CSS3D), three.js enables developers to build everything from simple 3D visualizations to complex games, VR/AR applications, and data visualizations.

At its core, three.js follows a component-based design pattern where scenes contain cameras and 3D objects (meshes composed of geometries and materials). The library includes 22+ primitive geometries, 38+ material types (including physically-based rendering and node-based materials), comprehensive lighting systems, skeletal animation, and an extensive addon ecosystem with 50+ model loaders, postprocessing effects, physics integration, and interactive controls. The project maintains over 559 working examples demonstrating best practices and common use cases. Version 0.182.0 introduces enhanced WebGPU renderer support and a powerful Three Shading Language (TSL) for node-based material creation.

## Getting Started

### HTML Setup with Import Maps

The recommended way to use Three.js in HTML is with ES modules and import maps, which allows you to import Three.js and its addons without a build tool.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <title>Three.js App</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <!-- Import map defines module paths -->
    <script type="importmap">
        {
            "imports": {
                "three": "../build/three.module.js",
                "three/addons/": "./jsm/"
            }
        }
    </script>

    <!-- Your Three.js code as a module -->
    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        let camera, scene, renderer;

        init();

        function init() {
            // Create container
            const container = document.createElement('div');
            document.body.appendChild(container);

            // Setup camera
            camera = new THREE.PerspectiveCamera(
                50, 
                window.innerWidth / window.innerHeight, 
                0.1, 
                1000
            );
            camera.position.z = 5;

            // Create scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000000);

            // Add some objects
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            // Create renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setAnimationLoop(animate);
            container.appendChild(renderer.domElement);

            // Handle window resize
            window.addEventListener('resize', onWindowResize);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            renderer.render(scene, camera);
        }
    </script>
</body>
</html>
```

### Using CDN (Alternative Method)

You can also use Three.js directly from a CDN for quick prototyping:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Three.js with CDN</title>
    <style>
        body { margin: 0; }
    </style>
</head>
<body>
    <script type="importmap">
        {
            "imports": {
                "three": "https://cdn.jsdelivr.net/npm/three@0.182.0/build/three.module.js",
                "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.182.0/examples/jsm/"
            }
        }
    </script>

    <script type="module">
        import * as THREE from 'three';
        
        // Your Three.js code here
    </script>
</body>
</html>
```

### NPM Installation (For Build Tools)

For projects using build tools (Webpack, Vite, etc.):

```bash
npm install three
```

Then import in your JavaScript:

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
```

## Core APIs

### Scene and Renderer Setup

Creating a basic three.js application with WebGL rendering, camera setup, and animation loop.

```javascript
import * as THREE from 'three';

// Initialize renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe3dd);
scene.fog = new THREE.Fog(0xbfe3dd, 10, 50);

// Setup camera
const camera = new THREE.PerspectiveCamera(
  70,                              // field of view
  window.innerWidth / window.innerHeight,  // aspect ratio
  0.01,                            // near clipping plane
  1000                             // far clipping plane
);
camera.position.set(5, 2, 8);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
renderer.setAnimationLoop((time) => {
  // Update animations here
  renderer.render(scene, camera);
});
```

### Creating 3D Objects (Geometry + Materials)

Building meshes from primitive geometries and applying materials with textures and properties.

```javascript
import * as THREE from 'three';

// Create geometry
const geometry = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);

// Create material with textures
const textureLoader = new THREE.TextureLoader();
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.2,
  roughness: 0.7,
  map: textureLoader.load('textures/diffuse.jpg', (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.colorSpace = THREE.SRGBColorSpace;
  }),
  bumpMap: textureLoader.load('textures/bump.jpg'),
  bumpScale: 1,
  normalMap: textureLoader.load('textures/normal.jpg'),
  roughnessMap: textureLoader.load('textures/roughness.jpg')
});

// Create mesh
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 0.5, 0);
mesh.rotation.y = Math.PI / 4;
mesh.castShadow = true;
mesh.receiveShadow = true;
scene.add(mesh);

// Create instanced mesh for performance (multiple copies)
const instancedGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const instancedMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const instancedMesh = new THREE.InstancedMesh(instancedGeometry, instancedMaterial, 1000);

const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
for (let i = 0; i < 1000; i++) {
  position.set(
    Math.random() * 40 - 20,
    Math.random() * 40 - 20,
    Math.random() * 40 - 20
  );
  matrix.setPosition(position);
  instancedMesh.setMatrixAt(i, matrix);
}
scene.add(instancedMesh);

// Animation example
function animate(time) {
  mesh.rotation.x = time / 2000;
  mesh.rotation.y = time / 1000;
}
```

### Lighting Systems

Comprehensive lighting setup with shadows, physically accurate values, and multiple light types.

```javascript
import * as THREE from 'three';

// Ambient light (uniform lighting)
const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
scene.add(ambientLight);

// Hemisphere light (sky and ground colors)
const hemiLight = new THREE.HemisphereLight(
  0xddeeff,  // sky color
  0x0f0e0d,  // ground color
  0.5        // intensity
);
scene.add(hemiLight);

// Directional light (like sun) with shadows
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// Point light (omnidirectional) with physically accurate values
const pointLight = new THREE.PointLight(
  0xffee88,  // color
  400,       // intensity (lumens)
  100,       // distance
  2          // decay (physically accurate)
);
pointLight.position.set(0, 2, 0);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
scene.add(pointLight);

// Spotlight with angle and penumbra
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(10, 10, 10);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.1;
spotLight.decay = 2;
spotLight.distance = 50;
spotLight.castShadow = true;
spotLight.target.position.set(0, 0, 0);
scene.add(spotLight);
scene.add(spotLight.target);

// Rectangular area light (realistic area lighting)
const rectAreaLight = new THREE.RectAreaLight(0xffffff, 5, 4, 10);
rectAreaLight.position.set(0, 5, 0);
rectAreaLight.rotation.x = -Math.PI / 2;
scene.add(rectAreaLight);

// Light helpers for debugging
scene.add(new THREE.DirectionalLightHelper(dirLight, 1));
scene.add(new THREE.PointLightHelper(pointLight, 0.1));
scene.add(new THREE.SpotLightHelper(spotLight));
```

### Camera Types and Controls

Setting up different camera types with interactive orbit controls.

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// Perspective camera (realistic 3D)
const perspCamera = new THREE.PerspectiveCamera(
  45,                                    // FOV
  window.innerWidth / window.innerHeight, // aspect
  0.25,                                  // near
  100                                    // far
);
perspCamera.position.set(-1.8, 0.6, 2.7);

// Orthographic camera (no perspective distortion)
const orthoCamera = new THREE.OrthographicCamera(
  -10, 10,  // left, right
  10, -10,  // top, bottom
  0.1, 100  // near, far
);
orthoCamera.position.set(10, 10, 10);
orthoCamera.lookAt(0, 0, 0);

// Orbit controls (mouse/touch interaction)
const controls = new OrbitControls(perspCamera, renderer.domElement);
controls.target.set(0, 0.5, 0);
controls.minDistance = 2;
controls.maxDistance = 10;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.update();

// Call in animation loop if damping is enabled
function animate() {
  controls.update();
  renderer.render(scene, perspCamera);
}

// Transform controls (translate, rotate, scale gizmo)
const transformControls = new TransformControls(perspCamera, renderer.domElement);
transformControls.attach(mesh);
transformControls.setMode('translate'); // or 'rotate', 'scale'
transformControls.addEventListener('dragging-changed', (event) => {
  controls.enabled = !event.value; // Disable orbit when dragging
});
scene.add(transformControls);
```

### Array Camera and Multiple Viewports

ArrayCamera allows rendering the same scene from multiple sub-cameras with different viewports, useful for split-screen effects or multi-view displays.

```javascript
import * as THREE from 'three';

const AMOUNT = 6; // 6x6 grid of cameras
const ASPECT_RATIO = window.innerWidth / window.innerHeight;
const WIDTH = (window.innerWidth / AMOUNT) * window.devicePixelRatio;
const HEIGHT = (window.innerHeight / AMOUNT) * window.devicePixelRatio;

const cameras = [];

// Create grid of sub-cameras
for (let y = 0; y < AMOUNT; y++) {
  for (let x = 0; x < AMOUNT; x++) {
    const subcamera = new THREE.PerspectiveCamera(40, ASPECT_RATIO, 0.1, 10);
    
    // Define viewport for this camera (x, y, width, height)
    subcamera.viewport = new THREE.Vector4(
      Math.floor(x * WIDTH),
      Math.floor(y * HEIGHT),
      Math.ceil(WIDTH),
      Math.ceil(HEIGHT)
    );
    
    // Position each camera differently
    subcamera.position.x = (x / AMOUNT) - 0.5;
    subcamera.position.y = 0.5 - (y / AMOUNT);
    subcamera.position.z = 1.5;
    subcamera.position.multiplyScalar(2);
    subcamera.lookAt(0, 0, 0);
    subcamera.updateMatrixWorld();
    
    cameras.push(subcamera);
  }
}

// Create ArrayCamera with all sub-cameras
const camera = new THREE.ArrayCamera(cameras);
camera.position.z = 3;

// Render normally - each viewport will render automatically
renderer.render(scene, camera);

// Handle resize for ArrayCamera
window.addEventListener('resize', () => {
  const ASPECT_RATIO = window.innerWidth / window.innerHeight;
  const WIDTH = (window.innerWidth / AMOUNT) * window.devicePixelRatio;
  const HEIGHT = (window.innerHeight / AMOUNT) * window.devicePixelRatio;

  camera.aspect = ASPECT_RATIO;
  camera.updateProjectionMatrix();

  for (let y = 0; y < AMOUNT; y++) {
    for (let x = 0; x < AMOUNT; x++) {
      const subcamera = camera.cameras[AMOUNT * y + x];
      
      subcamera.viewport.set(
        Math.floor(x * WIDTH),
        Math.floor(y * HEIGHT),
        Math.ceil(WIDTH),
        Math.ceil(HEIGHT)
      );
      
      subcamera.aspect = ASPECT_RATIO;
      subcamera.updateProjectionMatrix();
    }
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

### Split-Screen Rendering with Scissor

Render the same scene from multiple cameras side-by-side using scissor and viewport.

```javascript
import * as THREE from 'three';

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

// Main viewing camera
const camera = new THREE.PerspectiveCamera(50, 0.5 * aspect, 1, 10000);
camera.position.z = 2500;

// Camera to be visualized
const cameraPerspective = new THREE.PerspectiveCamera(50, 0.5 * aspect, 150, 1000);

// Camera helper to visualize frustum
const cameraPerspectiveHelper = new THREE.CameraHelper(cameraPerspective);
scene.add(cameraPerspectiveHelper);

// Enable scissor test for split rendering
renderer.setScissorTest(true);

function render() {
  // Left side: render from active camera
  cameraPerspectiveHelper.visible = false;
  renderer.setClearColor(0x000000, 1);
  renderer.setScissor(0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
  renderer.setViewport(0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
  renderer.render(scene, cameraPerspective);

  // Right side: render visualization with camera helper
  cameraPerspectiveHelper.visible = true;
  renderer.setClearColor(0x111111, 1);
  renderer.setScissor(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
  renderer.setViewport(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
  renderer.render(scene, camera);
}

// Handle resize
function onWindowResize() {
  const SCREEN_WIDTH = window.innerWidth;
  const SCREEN_HEIGHT = window.innerHeight;
  
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  
  camera.aspect = 0.5 * aspect;
  camera.updateProjectionMatrix();
  
  cameraPerspective.aspect = 0.5 * aspect;
  cameraPerspective.updateProjectionMatrix();
}
```

### Mouse Interaction and Input Handling

Capture mouse movement and keyboard input for camera control and interaction.

```javascript
import * as THREE from 'three';

let mouseX = 0;
let mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Mouse move event
document.addEventListener('mousemove', onDocumentMouseMove);

function onDocumentMouseMove(event) {
  // Normalized mouse coordinates
  mouseX = (event.clientX - windowHalfX) / 100;
  mouseY = (event.clientY - windowHalfY) / 100;
}

// Keyboard events
document.addEventListener('keydown', onKeyDown);

function onKeyDown(event) {
  switch (event.keyCode) {
    case 79: // O key
      activeCamera = cameraOrtho;
      break;
    
    case 80: // P key
      activeCamera = cameraPerspective;
      break;
  }
}

// Update camera position based on mouse in animation loop
function animate() {
  // Smooth camera movement following mouse
  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;
  camera.lookAt(scene.position);
  
  renderer.render(scene, camera);
}
```

### Loading 3D Models (GLTF/GLB)

Loading GLTF models with Draco compression, animations, and proper async handling.

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Setup Draco decoder for compressed models
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('path/to/draco/');
dracoLoader.setDecoderConfig({ type: 'js' });

// Setup GLTF loader
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Load model with progress tracking and error handling
let mixer;
loader.load(
  'models/scene.glb',
  // onLoad
  async (gltf) => {
    const model = gltf.scene;

    // Scale and position model
    model.position.set(0, 0, 0);
    model.scale.set(0.01, 0.01, 0.01);

    // Enable shadows for all meshes
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Fix materials if needed
        if (child.material.map) {
          child.material.map.colorSpace = THREE.SRGBColorSpace;
        }
      }
    });

    // Wait for shader compilation to avoid frame drops
    await renderer.compileAsync(model, camera, scene);
    scene.add(model);

    // Setup animations
    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
      });
    }

    // Access specific nodes
    const specificMesh = gltf.scene.getObjectByName('MeshName');
    console.log('Animations:', gltf.animations);
    console.log('Cameras:', gltf.cameras);
  },
  // onProgress
  (xhr) => {
    const percentComplete = (xhr.loaded / xhr.total) * 100;
    console.log(`Loading: ${percentComplete.toFixed(2)}%`);
  },
  // onError
  (error) => {
    console.error('Error loading model:', error);
  }
);

// Update animations in render loop
const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
```

### Animation System (Keyframes and Mixers)

Creating and controlling animations with the animation system.

```javascript
import * as THREE from 'three';

// Create animation mixer
const mixer = new THREE.AnimationMixer(mesh);

// Create keyframe tracks
const positionKF = new THREE.VectorKeyframeTrack(
  '.position',
  [0, 1, 2],  // times
  [0, 0, 0,   // values
   0, 1, 0,
   0, 0, 0]
);

const rotationKF = new THREE.QuaternionKeyframeTrack(
  '.quaternion',
  [0, 1, 2],
  [0, 0, 0, 1,
   0, 0.707, 0, 0.707,
   0, 0, 0, 1]
);

const colorKF = new THREE.ColorKeyframeTrack(
  '.material.color',
  [0, 1, 2],
  [1, 0, 0,   // red
   0, 1, 0,   // green
   0, 0, 1]   // blue
);

// Create animation clip
const clip = new THREE.AnimationClip('Action', 2, [positionKF, rotationKF, colorKF]);

// Create and control animation action
const action = mixer.clipAction(clip);
action.setLoop(THREE.LoopRepeat, Infinity);
action.clampWhenFinished = true;
action.play();

// Control playback
action.paused = false;
action.timeScale = 1.0;  // Speed multiplier
action.weight = 1.0;     // Blend weight

// Crossfade between animations
const walkAction = mixer.clipAction(walkClip);
const runAction = mixer.clipAction(runClip);
walkAction.play();
runAction.play();
walkAction.crossFadeTo(runAction, 0.5);  // 0.5 second crossfade

// Update mixer in animation loop
const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  mixer.update(delta);
  renderer.render(scene, camera);
}

// Listen to animation events
mixer.addEventListener('finished', (e) => {
  console.log('Animation finished:', e.action.getClip().name);
});
```

### Raycasting and Object Interaction

Implementing mouse picking and object interaction using raycasting.

```javascript
import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

// Mouse move event
renderer.domElement.addEventListener('mousemove', (event) => {
  // Convert mouse position to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check intersections
  const intersects = raycaster.intersectObjects(scene.children, true);

  // Reset previous selection
  if (selectedObject) {
    selectedObject.material.emissive.setHex(0x000000);
  }

  // Highlight hovered object
  if (intersects.length > 0) {
    selectedObject = intersects[0].object;
    selectedObject.material.emissive.setHex(0x555555);

    // Access intersection details
    const point = intersects[0].point;
    const distance = intersects[0].distance;
    const face = intersects[0].face;
    console.log('Hit point:', point, 'Distance:', distance);
  }
});

// Click event
renderer.domElement.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    console.log('Clicked object:', object.name);

    // Perform action on clicked object
    object.position.y += 0.5;
  }
});

// Raycast with custom origin and direction
const origin = new THREE.Vector3(0, 0, 0);
const direction = new THREE.Vector3(1, 0, 0).normalize();
raycaster.set(origin, direction);
const intersects2 = raycaster.intersectObjects(scene.children);

// Filter by distance
raycaster.near = 0.1;
raycaster.far = 100;

// Raycast only specific layers
object.layers.set(1);
camera.layers.enable(1);
raycaster.layers.set(1);
```

### Texture Loading and Configuration

Loading and configuring textures with proper color space, wrapping, and filtering.

```javascript
import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

// Basic texture loading
const diffuseMap = textureLoader.load(
  'textures/diffuse.jpg',
  // onLoad
  (texture) => {
    console.log('Texture loaded:', texture.image.width, 'x', texture.image.height);
  },
  // onProgress
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  // onError
  (error) => {
    console.error('Error loading texture:', error);
  }
);

// Configure texture properties
diffuseMap.wrapS = THREE.RepeatWrapping;
diffuseMap.wrapT = THREE.MirroredRepeatWrapping;
diffuseMap.repeat.set(4, 4);
diffuseMap.offset.set(0.5, 0.5);
diffuseMap.rotation = Math.PI / 4;
diffuseMap.center.set(0.5, 0.5);
diffuseMap.colorSpace = THREE.SRGBColorSpace;
diffuseMap.magFilter = THREE.LinearFilter;
diffuseMap.minFilter = THREE.LinearMipmapLinearFilter;
diffuseMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
diffuseMap.needsUpdate = true;

// Load multiple textures with LoadingManager
const manager = new THREE.LoadingManager();
manager.onStart = (url, itemsLoaded, itemsTotal) => {
  console.log('Started loading:', url);
};
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
  console.log(`Loading: ${itemsLoaded}/${itemsTotal}`);
};
manager.onLoad = () => {
  console.log('All textures loaded');
};
manager.onError = (url) => {
  console.error('Error loading:', url);
};

const loader = new THREE.TextureLoader(manager);
const normalMap = loader.load('textures/normal.jpg');
const roughnessMap = loader.load('textures/roughness.jpg');
const aoMap = loader.load('textures/ao.jpg');

// Cube texture (environment map)
const envMap = cubeTextureLoader.load([
  'textures/px.jpg', 'textures/nx.jpg',
  'textures/py.jpg', 'textures/ny.jpg',
  'textures/pz.jpg', 'textures/nz.jpg'
]);
envMap.colorSpace = THREE.SRGBColorSpace;

// HDR environment map
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
const hdrLoader = new HDRLoader();
hdrLoader.load('textures/environment.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture;
});

// Video texture
const video = document.createElement('video');
video.src = 'textures/video.mp4';
video.loop = true;
video.muted = true;
video.play();
const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.SRGBColorSpace;

// Canvas texture (procedural)
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ff0000';
ctx.fillRect(0, 0, 512, 512);
const canvasTexture = new THREE.CanvasTexture(canvas);
```

### Custom Shaders and Materials

Creating custom shader materials with uniforms, attributes, and GLSL code.

```javascript
import * as THREE from 'three';

// Custom vertex shader
const vertexShader = `
  uniform float time;
  uniform float amplitude;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    // Wave effect
    vec3 newPosition = position;
    newPosition.z += sin(position.x * 10.0 + time) * amplitude;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Custom fragment shader
const fragmentShader = `
  uniform float time;
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform sampler2D texture1;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Texture sampling
    vec4 texColor = texture2D(texture1, vUv);

    // Color interpolation
    vec3 color = mix(colorA, colorB, vUv.y);

    // Lighting calculation
    vec3 light = vec3(0.5, 0.2, 1.0);
    light = normalize(light);
    float dProd = max(0.0, dot(vNormal, light));

    // Final color
    gl_FragColor = vec4(color * dProd * texColor.rgb, 1.0);
  }
`;

// Create shader material
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    amplitude: { value: 0.5 },
    colorA: { value: new THREE.Color(0xff0000) },
    colorB: { value: new THREE.Color(0x0000ff) },
    texture1: { value: textureLoader.load('texture.jpg') }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  wireframe: false,
  transparent: true,
  side: THREE.DoubleSide
});

const geometry = new THREE.PlaneGeometry(5, 5, 32, 32);
const mesh = new THREE.Mesh(geometry, shaderMaterial);
scene.add(mesh);

// Update uniforms in animation loop
function animate(time) {
  shaderMaterial.uniforms.time.value = time / 1000;
  renderer.render(scene, camera);
}

// RawShaderMaterial (full control, no built-in uniforms)
const rawShaderMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    modelViewMatrix: { value: new THREE.Matrix4() },
    projectionMatrix: { value: new THREE.Matrix4() }
  },
  vertexShader: `
    precision highp float;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    attribute vec3 position;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    void main() {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `
});
```

### WebGPU Renderer and Node Materials

Using the modern WebGPU renderer with node-based materials and Three Shading Language (TSL).

```javascript
import * as THREE from 'three/webgpu';
import { pass, mrt, output, uniform, texture, uv, modelWorldMatrix, positionWorld, normalWorld,
         color, float, vec3, mx_noise_float, timerLocal } from 'three/tsl';

// Initialize WebGPU renderer
const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// Setup scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;

// Node-based material using TSL
const customMaterial = new THREE.MeshStandardNodeMaterial();

// Procedural noise texture using TSL nodes
const noiseScale = uniform(5.0);
const noiseFrequency = positionWorld.mul(noiseScale).add(timerLocal());
const noiseValue = mx_noise_float(noiseFrequency);

// Color gradient based on noise
const colorA = uniform(color(0xff0000));
const colorB = uniform(color(0x0000ff));
const mixedColor = colorA.mix(colorB, noiseValue);

// Apply to material
customMaterial.colorNode = mixedColor;
customMaterial.roughnessNode = noiseValue.mul(0.5).add(0.3);
customMaterial.metalnessNode = float(0.2);

// Create mesh with node material
const geometry = new THREE.SphereGeometry(1, 64, 64);
const mesh = new THREE.Mesh(geometry, customMaterial);
scene.add(mesh);

// Custom UV manipulation
const customUV = uv().mul(2.0).add(timerLocal(0.1));
const textureNode = texture(textureLoader.load('texture.jpg'), customUV);
customMaterial.colorNode = textureNode;

// Multi-render targets (MRT) for advanced rendering
const mrtPass = mrt({
    output: output,
    normal: normalWorld,
    depth: positionWorld.z
});

// Postprocessing with node-based effects
const scenePass = pass(scene, camera);
const scenePassColor = scenePass.getTextureNode();
const bloomPass = scenePassColor.bloom(1.5, 0.4, 0.85);

// Compose final output
renderer.outputNode = bloomPass;

// Animation loop
function animate() {
    renderer.renderAsync(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

### Postprocessing Effects

Applying postprocessing effects using EffectComposer for enhanced visual quality.

```javascript
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';

// Create composer
const composer = new EffectComposer(renderer);

// Add render pass (required first pass)
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Bloom effect
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloomPass);

// SSAO (Screen Space Ambient Occlusion)
const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
ssaoPass.kernelRadius = 16;
ssaoPass.minDistance = 0.005;
ssaoPass.maxDistance = 0.1;
composer.addPass(ssaoPass);

// Custom shader effects
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0015;
rgbShiftPass.uniforms['angle'].value = 0.0;
composer.addPass(rgbShiftPass);

const dotScreenPass = new ShaderPass(DotScreenShader);
dotScreenPass.uniforms['scale'].value = 4;
composer.addPass(dotScreenPass);

// Output pass (required last pass for proper tone mapping)
const outputPass = new OutputPass();
composer.addPass(outputPass);

// Handle window resize
window.addEventListener('resize', () => {
  composer.setSize(window.innerWidth, window.innerHeight);
  ssaoPass.setSize(window.innerWidth, window.innerHeight);
});

// Render using composer instead of renderer
function animate() {
  composer.render();
}
renderer.setAnimationLoop(animate);

// Toggle passes
bloomPass.enabled = true;  // Enable/disable individual passes
ssaoPass.enabled = false;

// Adjust pass parameters in real-time
bloomPass.strength = 2.0;
bloomPass.radius = 0.5;
bloomPass.threshold = 0.5;
```

### Special Effects and Custom Renderers

Using effect renderers like ParallaxBarrierEffect for stereoscopic displays.

```javascript
import * as THREE from 'three';
import { ParallaxBarrierEffect } from 'three/addons/effects/ParallaxBarrierEffect.js';

// Create standard WebGL renderer
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setAnimationLoop(animate);

const container = document.createElement('div');
document.body.appendChild(container);
container.appendChild(renderer.domElement);

// Create effect wrapper
const effect = new ParallaxBarrierEffect(renderer);
effect.setSize(window.innerWidth, window.innerHeight);

// Use effect.render() instead of renderer.render()
function animate() {
  effect.render(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  effect.setSize(window.innerWidth, window.innerHeight);
});
```

### Group and Scene Graph Hierarchy

Organizing 3D objects in hierarchical structures with transformations.

```javascript
import * as THREE from 'three';

// Create parent group
const solarSystem = new THREE.Group();
solarSystem.position.set(0, 0, 0);
scene.add(solarSystem);

// Create sun
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  emissive: 0xffff00
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
solarSystem.add(sun);

// Create earth orbit group
const earthOrbit = new THREE.Group();
earthOrbit.position.x = 10;
solarSystem.add(earthOrbit);

// Create earth
const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
const earthMaterial = new THREE.MeshStandardMaterial({
  color: 0x2233ff,
  roughness: 0.7
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earthOrbit.add(earth);

// Create moon orbit group
const moonOrbit = new THREE.Group();
moonOrbit.position.x = 2;
earthOrbit.add(moonOrbit);

// Create moon
const moonGeometry = new THREE.SphereGeometry(0.3, 32, 32);
const moonMaterial = new THREE.MeshStandardMaterial({
  color: 0xaaaaaa,
  roughness: 0.9
});
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moonOrbit.add(moon);

// Animate hierarchy
function animate(time) {
  // Sun rotation
  sun.rotation.y = time / 2000;

  // Earth orbit around sun
  earthOrbit.rotation.y = time / 3000;
  earth.rotation.y = time / 1000;

  // Moon orbit around earth
  moonOrbit.rotation.y = time / 500;
  moon.rotation.y = time / 800;

  renderer.render(scene, camera);
}

// Traverse scene graph
scene.traverse((object) => {
  if (object.isMesh) {
    console.log('Mesh:', object.name, object.position);
  }
});

// Find objects
const foundObject = scene.getObjectByName('earth');
const foundObjectByProperty = scene.getObjectByProperty('uuid', someUuid);

// Remove objects
solarSystem.remove(earthOrbit);
earthOrbit.parent = null;  // Alternative removal

// World vs local transformations
const worldPosition = new THREE.Vector3();
earth.getWorldPosition(worldPosition);
const worldQuaternion = new THREE.Quaternion();
earth.getWorldQuaternion(worldQuaternion);
```

### Physics Integration with Raycasting

Implementing simple physics simulation with collision detection.

```javascript
import * as THREE from 'three';
import { AmmoPhysics } from 'three/addons/physics/AmmoPhysics.js';

// Initialize physics (async)
let physics;
AmmoPhysics().then((p) => {
  physics = p;
  setupPhysicsWorld();
});

function setupPhysicsWorld() {
  // Ground plane
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1, 20),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);
  physics.addMesh(ground, 0);  // 0 mass = static

  // Dynamic boxes
  const boxes = [];
  for (let i = 0; i < 10; i++) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
    );
    box.position.set(
      Math.random() * 10 - 5,
      5 + i * 2,
      Math.random() * 10 - 5
    );
    box.castShadow = true;
    scene.add(box);
    physics.addMesh(box, 1);  // 1kg mass
    boxes.push(box);
  }

  // Apply forces
  setTimeout(() => {
    physics.setMeshVelocity(boxes[0], new THREE.Vector3(5, 0, 0));
  }, 1000);
}

// Alternative: Manual physics simulation
class Ball {
  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    this.velocity = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    this.mesh.position.set(0, 10, 0);
    scene.add(this.mesh);
  }

  update(deltaTime) {
    // Apply gravity
    this.velocity.y -= 9.8 * deltaTime;

    // Update position
    this.mesh.position.addScaledVector(this.velocity, deltaTime);

    // Collision with ground
    if (this.mesh.position.y < 0.5) {
      this.mesh.position.y = 0.5;
      this.velocity.y *= -0.8;  // Bounce with energy loss
    }

    // Collision with walls
    if (Math.abs(this.mesh.position.x) > 10) {
      this.velocity.x *= -1;
    }
    if (Math.abs(this.mesh.position.z) > 10) {
      this.velocity.z *= -1;
    }
  }
}

const balls = [];
for (let i = 0; i < 20; i++) {
  balls.push(new Ball());
}

const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();

  // Update physics
  if (physics) {
    physics.step();
  }

  // Update manual physics
  balls.forEach(ball => ball.update(delta));

  renderer.render(scene, camera);
}
```

### Environment Maps and PBR Materials

Setting up realistic physically-based materials with environment mapping.

```javascript
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { HDRCubeTextureLoader } from 'three/addons/loaders/HDRCubeTextureLoader.js';

// Method 1: Generate environment using PMREMGenerator
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Use procedural room environment
const roomEnvironment = new RoomEnvironment();
const roomEnvMap = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
scene.environment = roomEnvMap;
scene.background = roomEnvMap;

// Method 2: Load HDR equirectangular environment
const hdrLoader = new HDRLoader();
hdrLoader.load('textures/environment.hdr', (hdrTexture) => {
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

  const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
  scene.environment = envMap;
  scene.background = new THREE.Color(0x000000);

  hdrTexture.dispose();
  pmremGenerator.dispose();
});

// Method 3: Load cube map HDR
const hdrCubeLoader = new HDRCubeTextureLoader();
const cubeEnvMap = hdrCubeLoader.load([
  'px.hdr', 'nx.hdr',
  'py.hdr', 'ny.hdr',
  'pz.hdr', 'nz.hdr'
], (texture) => {
  const pmremCubeEnv = pmremGenerator.fromCubemap(texture).texture;
  scene.environment = pmremCubeEnv;
});

// PBR material with full properties
const pbrMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 1.0,
  roughness: 0.3,
  map: textureLoader.load('diffuse.jpg'),
  normalMap: textureLoader.load('normal.jpg'),
  normalScale: new THREE.Vector2(1, 1),
  metalnessMap: textureLoader.load('metalness.jpg'),
  roughnessMap: textureLoader.load('roughness.jpg'),
  aoMap: textureLoader.load('ao.jpg'),
  aoMapIntensity: 1.0,
  envMap: scene.environment,
  envMapIntensity: 1.0,
  side: THREE.FrontSide
});

// MeshPhysicalMaterial (extended PBR)
const physicalMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.0,
  roughness: 0.1,
  transmission: 1.0,        // Glass transparency
  thickness: 0.5,           // Refraction depth
  clearcoat: 1.0,          // Clear coat layer
  clearcoatRoughness: 0.1,
  sheen: 0.5,              // Fabric sheen
  sheenRoughness: 0.5,
  sheenColor: new THREE.Color(0xff0000),
  ior: 1.5,                // Index of refraction
  reflectivity: 0.5,
  iridescence: 1.0,        // Soap bubble effect
  iridescenceIOR: 1.3,
  iridescenceThicknessRange: [100, 400],
  envMap: scene.environment,
  envMapIntensity: 1.0
});

const glassGeometry = new THREE.SphereGeometry(1, 64, 64);
const glassMesh = new THREE.Mesh(glassGeometry, physicalMaterial);
scene.add(glassMesh);

// Cube camera for real-time reflections
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
scene.add(cubeCamera);

function animate() {
  cubeCamera.update(renderer, scene);
  reflectiveMaterial.envMap = cubeRenderTarget.texture;
  renderer.render(scene, camera);
}
```

### Text and Font Rendering

Rendering 3D text and sprite text labels in the scene.

```javascript
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Load font and create 3D text
const fontLoader = new FontLoader();
fontLoader.load('fonts/helvetiker_regular.typeface.json', (font) => {
  // Create text geometry
  const textGeometry = new TextGeometry('Hello Three.js!', {
    font: font,
    size: 1,
    depth: 0.2,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5
  });

  // Center the text
  textGeometry.computeBoundingBox();
  const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
  textGeometry.translate(centerOffset, 0, 0);

  // Create material and mesh
  const textMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    metalness: 0.5,
    roughness: 0.5
  });

  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.castShadow = true;
  scene.add(textMesh);
});

// Alternative: Canvas texture for 2D text
function createTextTexture(text, options = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = options.width || 512;
  canvas.height = options.height || 256;

  // Background
  ctx.fillStyle = options.bgColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text
  ctx.fillStyle = options.color || '#000000';
  ctx.font = options.font || 'Bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const labelTexture = createTextTexture('Player 1', {
  color: '#ffffff',
  bgColor: '#000000',
  font: 'Bold 48px Arial'
});

// Sprite label (always faces camera)
const spriteMaterial = new THREE.SpriteMaterial({
  map: labelTexture,
  transparent: true,
  sizeAttenuation: false
});
const sprite = new THREE.Sprite(spriteMaterial);
sprite.position.set(0, 2, 0);
sprite.scale.set(0.5, 0.25, 1);
scene.add(sprite);

// HTML labels using CSS2DRenderer
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const div = document.createElement('div');
div.className = 'label';
div.textContent = 'Important Point';
div.style.color = '#fff';
div.style.fontSize = '18px';
div.style.backgroundColor = 'rgba(0,0,0,0.6)';
div.style.padding = '5px';

const label = new CSS2DObject(div);
label.position.set(0, 1, 0);
scene.add(label);

function animate() {
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
```

### Shadow Mapping and Configuration

Configuring high-quality shadows with proper shadow map settings.

```javascript
import * as THREE from 'three';

// Enable shadows on renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // PCFSoftShadowMap, BasicShadowMap, PCFShadowMap, VSMShadowMap

// Configure directional light shadows
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;

// Shadow camera (frustum)
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.top = 15;
dirLight.shadow.camera.bottom = -15;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 50;

// Shadow map resolution (higher = better quality, lower performance)
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

// Shadow bias (fixes shadow acne)
dirLight.shadow.bias = -0.001;
dirLight.shadow.normalBias = 0.02;

// Shadow radius (softness, only for VSM)
dirLight.shadow.radius = 4;

scene.add(dirLight);

// Visualize shadow camera
import { CameraHelper } from 'three';
const shadowCameraHelper = new CameraHelper(dirLight.shadow.camera);
scene.add(shadowCameraHelper);

// Configure point light shadows
const pointLight = new THREE.PointLight(0xffffff, 1, 50);
pointLight.position.set(0, 5, 0);
pointLight.castShadow = true;

pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 50;
pointLight.shadow.bias = -0.001;

scene.add(pointLight);

// Configure spotlight shadows
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(5, 10, 5);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.1;
spotLight.castShadow = true;

spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 20;
spotLight.shadow.camera.fov = 30;
spotLight.shadow.bias = -0.001;

scene.add(spotLight);

// Object shadow settings
const box = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
box.castShadow = true;     // Object casts shadows
box.receiveShadow = true;  // Object receives shadows
scene.add(box);

// Ground receives shadows
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x808080 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Custom shadow material (shadow only, no object)
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 5),
  new THREE.ShadowMaterial({ opacity: 0.5 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);
```

## Summary

Three.js provides a complete ecosystem for creating sophisticated 3D web applications through its intuitive API and extensive addon system. The library's core strength lies in its abstraction of WebGL and WebGPU complexity while maintaining flexibility for advanced use cases. Common integration patterns include combining the scene graph with animation mixers for character animation, leveraging postprocessing composers for cinematic effects, and using loaders with loading managers for asset-heavy applications. The PBR material system with environment mapping enables photorealistic rendering, while the addon ecosystem provides specialized functionality like VR/AR support, physics simulation, and advanced controls. The Three Shading Language (TSL) and node-based materials in WebGPU unlock powerful procedural rendering capabilities with a declarative, composable syntax.

For production applications, three.js excels in product visualization, architectural walkthroughs, interactive data visualizations, game development, and immersive experiences. Best practices include using instanced meshes for performance, implementing level-of-detail systems for complex scenes, leveraging GPU-based postprocessing for effects, and optimizing shadow maps and texture resolutions. The WebGPU renderer offers modern graphics API benefits including better performance, compute shaders, and multi-threaded rendering when browser support is available. The library's compatibility with modern build tools, strong TypeScript support, and active community make it the de facto standard for 3D graphics on the web. Integration with React (via @react-three/fiber), Vue, and other frameworks further extends its utility in modern web development workflows.
