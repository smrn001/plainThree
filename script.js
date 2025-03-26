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
new THREE.RGBELoader().load("assets/hdr/flamingo_pan_4k.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = texture;
});

// GLB Frame Animation Logic
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
      frames[i] = gltf.scene;
      frames[i].visible = false; // Hide all initially
      scene.add(frames[i]);

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
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(2, 2, 2);
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
