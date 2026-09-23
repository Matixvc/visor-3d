import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const viewports = [];

function crearViewport3D(containerId, modelPath) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 1. ESCENA
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b202a);

  // 2. CÁMARA
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.2,
    50
  );

  // 3. RENDERIZADOR OPTIMIZADO PARA MÓVILES
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance",
    precision: "mediump"
  });
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  // Cap del PixelRatio para no sobrecargar baterías ni procesadores móviles
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 4. CONTROLES TÁCTILES MEJORADOS
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.7; // Velocidad de rotación ideal para pantallas táctiles

  // Configuración explícita de gestos para móviles
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,   // Un dedo rota la mascota
    TWO: THREE.TOUCH.DOLLY_PAN // Dos dedos hacen zoom o desplazan
  };

  // 5. ILUMINACIÓN LIGHTWEIGHT
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.6);
  mainLight.position.set(4, 6, 4);
  scene.add(mainLight);

  const gridHelper = new THREE.GridHelper(10, 10, 0x3a4454, 0x252d3a);
  scene.add(gridHelper);

  let isVisible = true;

  // 6. CARGADOR Y CENTRADO DE MODELO
  const loader = new GLTFLoader();
  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((child) => {
        if (child.isMesh) {
          child.matrixAutoUpdate = false;
          child.updateMatrix();
          if (child.material && child.material.map) {
            child.material.map.generateMipmaps = true;
            child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
          }
        }
      });

      scene.add(model);

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

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Pausa si el objeto no se está viendo en la pantalla del celular
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
    });
  }, { threshold: 0.1 });
  
  observer.observe(container);

  viewports.push({ scene, camera, renderer, controls, resize, getIsVisible: () => isVisible });
}

// Inicializar visores
crearViewport3D('viewport-perro', 'modelos/PerroCute.glb');
crearViewport3D('viewport-hamster', 'modelos/HamsterCute.glb');

// LOOP DE RENDERIZADO UNIFICADO
function animate() {
  requestAnimationFrame(animate);

  for (let i = 0; i < viewports.length; i++) {
    const vp = viewports[i];
    if (vp.getIsVisible()) {
      vp.controls.update();
      vp.renderer.render(vp.scene, vp.camera);
    }
  }
}
animate();

// Eventos de redimensión y cambio de orientación en móviles
window.addEventListener('resize', () => {
  viewports.forEach(vp => vp.resize());
});

// Función para entrar o alternar Pantalla Completa
window.toggleFullscreen = function(wrapperId) {
  const elem = document.getElementById(wrapperId);
  if (!elem) return;

  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Compatibilidad iOS / Safari */
      elem.webkitRequestFullscreen();
    }
  } else {
    window.exitFullscreen();
  }
};

// Función dedicada exclusivamente a salir de Pantalla Completa
window.exitFullscreen = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Compatibilidad iOS / Safari */
    document.webkitExitFullscreen();
  }
};

// Listener para reajustar los visores 3D al cambiar de tamaño
document.addEventListener('fullscreenchange', () => {
  setTimeout(() => {
    viewports.forEach(vp => vp.resize());
  }, 100);
});

document.addEventListener('webkitfullscreenchange', () => {
  setTimeout(() => {
    viewports.forEach(vp => vp.resize());
  }, 100);
});