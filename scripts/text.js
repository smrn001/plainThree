// Get the canvas element
const canvas = document.querySelector(".webgl");

// Create a scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a custom shader material
const material = new THREE.ShaderMaterial({
  uniforms: {
    color1: { value: new THREE.Color(0x000000) },
    color2: { value: new THREE.Color(0x888888) },
    color3: { value: new THREE.Color(0xce84e8) },
    metallic: { value: 0.43 },
    roughness: { value: 0.227 },
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

    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      float facing = dot(vNormal, vViewDir); 
      float mixFactor = smoothstep(0.0, 1.0, facing); // Simulate ColorRamp effect
      
      vec3 mixedColor = mix(mix(color1, color2, mixFactor), color3, mixFactor);
      
      gl_FragColor = vec4(mixedColor, 1.0);
    }
  `,
  transparent: false,
});

// Create a sphere geometry and mesh
const geometry = new THREE.SphereGeometry(1, 64, 64);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Position the camera
camera.position.z = 5;

// OrbitControls for scene navigation
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Resize the renderer and camera on window resize
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate the mesh for dynamic effect
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;

  // Update controls
  controls.update();

  // Render the scene
  renderer.render(scene, camera);
}

// Start the animation loop
animate();
