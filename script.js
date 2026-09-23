import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const viewports = [];

// Función para crear cada Viewport de forma ultra optimizada
function crearViewport3D(containerId, modelPath) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 1. ESCENA
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b202a);

  // 2. CÁMARA (Límites z-far y z-near ajustados para ahorrar cálculos)
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.2,
    50
  );

  // 3. RENDERIZADOR ALTO RENDIMIENTO
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance",
    precision: "mediump", // Precisión media para máxima velocidad de sombras/luces
    stencil: false,       // Desactivamos buffer stencil no utilizado
    depth: true
  });
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 4. CONTROLES CON INERCIA SUAVE
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.04; // Sensación de fluidez física al girar
  controls.rotateSpeed = 0.8;

  // 5. ILUMINACIÓN EFICIENTE (Sin sombras dinámicas pesadas)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.6);
  mainLight.position.set(4, 6, 4);
  scene.add(mainLight);

  const gridHelper = new THREE.GridHelper(10, 10, 0x3a4454, 0x252d3a);
  scene.add(gridHelper);

  // Variable de estado para saber si el contenedor está en pantalla
  let isVisible = true;

  // 6. CARGADOR CON OPTIMIZACIÓN DE TEXTURAS
  const loader = new GLTFLoader();
  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;

      // Optimizar materiales y geometrías del modelo cargado
      model.traverse((child) => {
        if (child.isMesh) {
          child.matrixAutoUpdate = false; // Desactiva recálculo de matrices si es estático
          child.updateMatrix();
          
          if (child.material) {
            child.material.precision = "mediump";
            if (child.material.map) {
              child.material.map.generateMipmaps = true;
              child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
            }
          }
        }
      });

      scene.add(model);

      // Centrado inteligente del objeto
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.x += (model.position.x - center.x);
      model.position.y += (model.position.y - box.min.y);
      model.position.z += (model.position.z - center.z);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.7;

      cameraZ = Math.max(cameraZ, 2.5);
      camera.position.set(0, maxDim * 0.7, cameraZ);
      controls.target.set(0, maxDim * 0.35, 0);
      controls.update();
    },
    undefined,
    (error) => console.error(`Error cargando ${modelPath}:`, error)
  );

  // Reajuste de tamaño rápido
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // IntersectionObserver: Solo renderiza cuando el Viewport es visible en pantalla
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
    });
  }, { threshold: 0.1 });
  
  observer.observe(container);

  viewports.push({ scene, camera, renderer, controls, resize, getIsVisible: () => isVisible });
}

// Inicialización de los visores
crearViewport3D('viewport-perro', 'modelos/PerroCute.glb');
crearViewport3D('viewport-hamster', 'modelos/HamsterCute.glb');

// BUCLE DE RENDERIZADO UNIFICADO Y OPTIMIZADO
function animate() {
  requestAnimationFrame(animate);

  for (let i = 0; i < viewports.length; i++) {
    const vp = viewports[i];
    // Solo actualiza y renderiza si el elemento está visible en pantalla
    if (vp.getIsVisible()) {
      vp.controls.update();
      vp.renderer.render(vp.scene, vp.camera);
    }
  }
}
animate();

// Evento Resize Global
window.addEventListener('resize', () => {
  viewports.forEach(vp => vp.resize());
});

// Función Global Pantalla Completa
window.toggleFullscreen = function(wrapperId) {
  const elem = document.getElementById(wrapperId);
  if (!elem) return;

  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

document.addEventListener('fullscreenchange', () => {
  setTimeout(() => {
    viewports.forEach(vp => vp.resize());
  }, 100);
});