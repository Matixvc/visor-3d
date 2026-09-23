import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Función reutilizable para crear y configurar un Viewport 3D independiente
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
    1000
  );

  // 3. Renderizador
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // 4. Controles (OrbitControls)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 5. Iluminación
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
  mainLight.position.set(5, 8, 5);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x88bbff, 1.0);
  fillLight.position.set(-5, -2, -5);
  scene.add(fillLight);

  // Rejilla de referencia en el suelo
  const gridHelper = new THREE.GridHelper(10, 10, 0x3a4454, 0x252d3a);
  scene.add(gridHelper);

  // 6. Carga del Modelo 3D con auto-encuadre
  const loader = new GLTFLoader();
  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      // Calcular el Bounding Box para centrar la cámara al modelo automáticamente
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Ajustar origen al centro del modelo
      model.position.x += (model.position.x - center.x);
      model.position.y += (model.position.y - box.min.y); // Apoyar sobre la rejilla
      model.position.z += (model.position.z - center.z);

      // Calcular distancia óptima de cámara según tamaño del objeto
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.8;

      cameraZ = Math.max(cameraZ, 2.5); // Límite de cercanía mínima
      camera.position.set(0, maxDim * 0.8, cameraZ);
      controls.target.set(0, maxDim * 0.4, 0);
      controls.update();

      console.log(`Modelo ${modelPath} cargado y centrado correctamente.`);
    },
    (xhr) => {
      if (xhr.total > 0) {
        const percent = ((xhr.loaded / xhr.total) * 100).toFixed(0);
        console.log(`Cargando ${modelPath}: ${percent}%`);
      }
    },
    (error) => {
      console.error(`Error al cargar el modelo ${modelPath}:`, error);
    }
  );

  // 7. Bucle de Renderizado
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // 8. Reajustar ante cambios de tamaño de ventana
  window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
}

// Inicializar ambos visores 3D en sus respectivos divs HTML
crearViewport3D('viewport-perro', 'modelos/PerroCute.glb');
crearViewport3D('viewport-hamster', 'modelos/HamsterCute.glb');