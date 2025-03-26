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

// Create a combined material using a ShaderMaterial with MeshPhysicalMaterial
const material = new THREE.ShaderMaterial({
  uniforms: {
    baseColor: { value: new THREE.Color(0xce84e8) }, // Purple base
    highlightColor: { value: new THREE.Color(0xffffff) }, // Shiny highlights
    fresnelPower: { value: 0.1 }, // Controls falloff
    roughness: { value: 0.1 }, // Smooth reflections
    metalness: { value: 0.5 }, // Slight metallic effect
    clearcoat: { value: 1.0 }, // Glossy finish like a car paint
    clearcoatRoughness: { value: 0.1 }, // Slight variation in clearcoat reflections
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-viewPos.xyz);
        gl_Position = projectionMatrix * viewPos;
    }
  `,
  fragmentShader: `
    uniform vec3 baseColor;
    uniform vec3 highlightColor;
    uniform float fresnelPower;
    uniform float roughness;
    uniform float metalness;
    uniform float clearcoat;
    uniform float clearcoatRoughness;
    
    varying vec3 vNormal;
    varying vec3 vViewDir;
    
    void main() {
        float fresnel = pow(1.0 - dot(vNormal, vViewDir), fresnelPower);
        vec3 color = mix(baseColor, highlightColor, fresnel);
        
        // Apply roughness and metalness for physical properties
        float reflection = mix(0.0, 1.0, metalness);
        vec3 finalColor = mix(color, vec3(1.0), reflection);
        
        // Apply clearcoat effect
        finalColor = mix(finalColor, highlightColor, clearcoat * (1.0 - clearcoatRoughness));
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  transparent: false,
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

      // Apply the combined material to the mesh
      frame.traverse((child) => {
        if (child.isMesh) {
          child.material = material; // Set custom material
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
