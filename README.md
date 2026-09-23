# 🐾 Mascotas 3D - Visor Interactivo Web

Un visor web interactivo en 3D ligero y optimizado, construido con **Three.js** y **HTML5/JavaScript ES Modules**. Permite explorar modelos 3D de mascotas (`PerroCute.glb` y `HamsterCute.glb`) con controles de cámara tipo Viewport (rotación, desplazamiento y zoom) y un modo de pantalla completa independiente por cada objeto.

---

## 🚀 Características

* **Navegación 3D Estilo Viewport:** Rotación, zoom y desplazamiento (*pan*) mediante `OrbitControls`.
* **Auto-Encuadre Inteligente:** Cálculo dinámico del *Bounding Box* para centrar y enfocar automáticamente cualquier modelo `.glb` sobre la rejilla, independientemente de sus dimensiones originales.
* **Modo Pantalla Completa:** Botón dedicado por cada contenedor para expandir la experiencia 3D a pantalla completa.
* **Renderizado Optimizado:** Loop de animación unificado y limitación de *Pixel Ratio* a 1.5 para asegurar 60 FPS estables en dispositivos móviles y de alta densidad de píxeles (Retina).
* **Diseño Responsive:** Interfaz limpia con *CSS Grid* adaptables a computadoras, tablets y smartphones.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5 & CSS3** (Diseño moderno con variables CSS y Flexbox/Grid).
* **JavaScript (ES Modules)**.
* **[Three.js (v0.160.0)](https://threejs.org/)** — Librería principal de renderizado 3D WebGL.
* **`GLTFLoader`** — Carga y procesamiento de archivos en formato binario `.glb`.
* **`OrbitControls`** — Gestión interactiva de la cámara 3D.

---

## 📁 Estructura del Proyecto

```text
visor-3d/
├── index.html        # Estructura de la página y diseño de tarjetas
├── script.js         # Lógica de Three.js, renderizado y eventos
├── README.md         # Documentación del proyecto
└── modelos/          # Carpeta de assets 3D
    ├── PerroCute.glb
    └── HamsterCute.glb