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
    // scene.background = texture;
    
  }
);

// GLB Frame Animation Logic
const loader = new THREE.GLTFLoader();
let frames = [];
let currentFrameIndex = 0;
let forward = true; // Direction of loop (0 → 20 → 0)
let transitioning = false; // Track transition state

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
        startLoopAnimation();
      }
    });
  }
}

// Function to switch frames in a loop from 0 → 20 → 0
function loopAnimation() {
  if (transitioning || frames.length < 61) return;

  frames[currentFrameIndex].visible = false; // Hide current frame

  if (forward) {
    currentFrameIndex++;
    if (currentFrameIndex >= 20) forward = false;
  } else {
    currentFrameIndex--;
    if (currentFrameIndex <= 0) forward = true;
  }

  frames[currentFrameIndex].visible = true; // Show next frame
}

// Function to handle click transition (current → 20 → 40 → 60)
function onClickTransition() {
  if (transitioning || frames.length < 61) return;

  transitioning = true;
  let targetFrames = [20, 40, 60]; // Steps to transition through
  let stepIndex = 0;

  function transitionStep() {
    if (stepIndex >= targetFrames.length) {
      transitioning = false;
      startLoopAnimation();
      return;
    }

    let targetFrame = targetFrames[stepIndex];
    let direction = currentFrameIndex < targetFrame ? 1 : -1;

    let interval = setInterval(() => {
      frames[currentFrameIndex].visible = false;
      currentFrameIndex += direction;

      frames[currentFrameIndex].visible = true;

      if (currentFrameIndex === targetFrame) {
        clearInterval(interval);
        stepIndex++;
        transitionStep(); // Move to next target
      }
    }, 40.16); // Adjust speed
  }

  transitionStep();
}

// Start loop animation after all models are loaded
function startLoopAnimation() {
  setInterval(loopAnimation, 50); // Adjust speed as needed
}

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 0.5);
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

// Add click event
canvas.addEventListener("click", onClickTransition);
