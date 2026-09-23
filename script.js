import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Arreglo global para almacenar instancias de los visores
const viewports = [];

function crearViewport3D(containerId, modelPath) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 1. Escena
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b202a);

  // 2. Cámara
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  // 3. Renderizador Optimizado
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    powerPreference: "high-performance" 
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  // Cap del PixelRatio a 1.5 para evitar caídas de FPS en pantallas de alta densidad
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  container.appendChild(renderer.domElement);

  // 4. Controles
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 5. Iluminación ligera y eficiente
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
  mainLight.position.set(5, 8, 5);
  scene.add(mainLight);

  const gridHelper = new THREE.GridHelper(10, 10, 0x3a4454, 0x252d3a);
  scene.add(gridHelper);

  // 6. Carga de Modelo con auto-encuadre
  const loader = new GLTFLoader();
  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.x += (model.position.x - center.x);
      model.position.y += (model.position.y - box.min.y);
      model.position.z += (model.position.z - center.z);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.8;

      cameraZ = Math.max(cameraZ, 2.5);
      camera.position.set(0, maxDim * 0.8, cameraZ);
      controls.target.set(0, maxDim * 0.4, 0);
      controls.update();
    },
    undefined,
    (error) => console.error(`Error al cargar ${modelPath}:`, error)
  );

  // Función de actualización de tamaño de canvas
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Guardar datos de la instancia
  viewports.push({ scene, camera, renderer, controls, resize });
}

// Inicializar ambos visores
crearViewport3D('viewport-perro', 'modelos/PerroCute.glb');
crearViewport3D('viewport-hamster', 'modelos/HamsterCute.glb');

// BÚSQUEDA Y RENDERING CENTRALIZADO (Elimina tirones/lag)
function animate() {
  requestAnimationFrame(animate);
  for (let i = 0; i < viewports.length; i++) {
    const vp = viewports[i];
    vp.controls.update();
    vp.renderer.render(vp.scene, vp.camera);
  }
}
animate();

// Evento de reajuste global de pantalla
window.addEventListener('resize', () => {
  viewports.forEach(vp => vp.resize());
});

// Función Global de Pantalla Completa
window.toggleFullscreen = function(wrapperId) {
  const elem = document.getElementById(wrapperId);
  if (!elem) return;

  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// Reajustar la cámara cuando se entra/sale de Pantalla Completa
document.addEventListener('fullscreenchange', () => {
  setTimeout(() => {
    viewports.forEach(vp => vp.resize());
  }, 100);
});