// Get the existing canvas
const canvas = document.querySelector(".webgl");

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputEncoding = THREE.sRGBEncoding;

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Load HDRI
new THREE.RGBELoader().load(
  "assets/hdr/blenderkit-studio-hdri-1-light_2K_5ce86ce7-0650-4e09-86fd-f9aef19a68e9.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
  }
);

// Create a simple reflective material with roughness 0.2
const material = new THREE.MeshStandardMaterial({
  metalness: 0.7, // Fully metallic for chrome-like effect
  roughness: 0.1, // Smooth reflection
  envMap: scene.environment, // Use the environment map for reflection
  envMapIntensity: 1.0, // Control the intensity of the environment map reflection
  color: 0xd480fb, // White color for chrome
//   reflectivity: 0.01, // Full reflectivity for chrome effect
});

// GLB Frame Animation Logic (no change here)
const loader = new THREE.GLTFLoader();
let frames = [];
let currentFrameIndex = 0;
let forward = true; // Track animation direction

// Function to load all frames
function loadFrames() {
  let loadedCount = 0;

  for (let i = 0; i <= 60; i++) {
    const fileName = `assets/glb/Mball_001_frame_${i}.glb`;

    loader.load(fileName, (gltf) => {
      const frame = gltf.scene;
      frames[i] = frame;
      frames[i].visible = false; // Hide all initially

      // Apply the reflective material to the mesh
      frame.traverse((child) => {
        if (child.isMesh) {
          child.material = material; // Set reflective material
        }
      });

      scene.add(frame);

      loadedCount++;
      if (loadedCount === 61) {
        frames[0].visible = true; // Show first frame when all are loaded
        startAnimation();
      }
    });
  }
}

// Function to switch frames
function switchFrame() {
  if (frames.length < 61) return; // Ensure all frames are loaded

  frames[currentFrameIndex].visible = false; // Hide current frame

  if (forward) {
    currentFrameIndex++;
    if (currentFrameIndex > 60) {
      currentFrameIndex = 59;
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

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, 0);
scene.add(light);

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
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
