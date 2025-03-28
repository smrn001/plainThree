// Get the existing canvas
const canvas = document.querySelector(".webgl");

const container = document.querySelector(".canvas-container");

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Update camera aspect ratio
camera.aspect = container.clientWidth / container.clientHeight;
camera.updateProjectionMatrix();
// Enable shadows
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputEncoding = THREE.sRGBEncoding;

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false; // Disable zooming
controls.enablePan = false;

// Load HDRI
new THREE.RGBELoader().load(
  "assets/hdr/blenderkit-studio-hdri-1-light_2K_5ce86ce7-0650-4e09-86fd-f9aef19a68e9.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    // scene.background = texture;
  }
);

// Create material
const material = new THREE.MeshPhysicalMaterial({
  color: 0xce84e8, // Purple base color
  metalness: 0.5, // Slight metallic effect
  roughness: 0.1, // Smooth reflections
  clearcoat: 1.0, // Glossy finish like a car paint
  clearcoatRoughness: 0.1, // Slight variation in clearcoat reflections
});

// GLB Frame Animation Logic (no change here)
const loader = new THREE.GLTFLoader();
let frames = [];
let currentFrameIndex = 0;
let forward = true; // Track animation direction

// Function to load all frames
function loadFrames() {
  let loadedCount = 0;

  for (let i = 0; i <= 64; i++) {
    const fileName = `assets/glb/Mball_001_frame_${i}.glb`;

    loader.load(fileName, (gltf) => {
      const frame = gltf.scene;
      frames[i] = frame;
      frames[i].visible = false; // Hide all initially

      frame.scale.set(0.6, 0.6, 0.6); // Adjust this value if needed
      frame.position.y += 0.7; // Move object slightly upward

      // Apply the reflective material to the mesh
      frame.traverse((child) => {
        if (child.isMesh) {
          child.material = material; // Set reflective material
        }
      });

      scene.add(frame);

      loadedCount++;
      if (loadedCount === 65) {
        frames[0].visible = true; // Show first frame when all are loaded
        startAnimation();
      }
    });
  }
}

// Function to switch frames
function switchFrame() {
  if (frames.length < 65) return; // Ensure all frames are loaded

  frames[currentFrameIndex].visible = false; // Hide current frame

  if (forward) {
    currentFrameIndex++;
    if (currentFrameIndex > 64) {
      currentFrameIndex = 63;
      forward = false; // Start going backward
    }
  } else {
    currentFrameIndex--;
    if (currentFrameIndex < 0) {
      currentFrameIndex = 1;
      forward = true; // Start going forward again
    }
  }

  frames[currentFrameIndex].visible = true; // Show next frame
}

// Start animation after all models are loaded
function startAnimation() {
  setInterval(switchFrame, 41.67); // Change frame every 100ms (adjust speed)
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Load all frames
loadFrames();

// Handle window resizing
// Resize event listener
window.addEventListener("resize", () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
});
