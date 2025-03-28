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

// Load a single GLB file
const loader = new THREE.GLTFLoader();
loader.load("export/Final Animation1.glb", (gltf) => {
  const model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = material; // Apply the reflective material
    }
  });
  scene.add(model);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
