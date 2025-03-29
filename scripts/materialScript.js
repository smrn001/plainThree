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

// Create custom shader material with reflections
const material = new THREE.ShaderMaterial({
  uniforms: {
    color1: { value: new THREE.Color(0xd480fb) }, // First color in ColorRamp
    color2: { value: new THREE.Color(0xffffff) }, // Middle color
    color3: { value: new THREE.Color(0xb284c9) }, // Base Color
    metallic: { value: 0.43 },
    roughness: { value: 0.0 },
    environmentMap: { value: scene.environment }, // Add environment map as uniform
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
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      uniform float metallic;
      uniform float roughness;
      uniform samplerCube environmentMap; // Environment map for reflections
  
      varying vec3 vNormal;
      varying vec3 vViewDir;
  
      void main() {
          // Fresnel effect: how much reflection at glancing angles
          float fresnelFactor = pow(1.0 - dot(vNormal, vViewDir), 3.0);
  
          // Smooth step to simulate color ramp blending
          float facing = dot(vNormal, vViewDir); 
          float mixFactor = smoothstep(0.0, 1.0, facing);
  
          // Color ramp blending
          vec3 mixedColor = mix(mix(color1, color2, mixFactor), color3, mixFactor);
  
          // Reflection effect
          vec3 reflection = texture(environmentMap, vViewDir).xyz;
  
          // Final color: mix color ramp with reflection based on the fresnel effect
          vec3 finalColor = mix(mixedColor, reflection, fresnelFactor);
  
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

      // Apply the custom shader material to the mesh
      frame.traverse((child) => {
        if (child.isMesh) {
          child.material = material; // Set custom shader material
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
