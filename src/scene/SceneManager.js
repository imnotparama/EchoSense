import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';

export class SceneManager {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    // Modern clean dark studio background with excellent contrast for white breadboard and colored wires
    this.scene.background = new THREE.Color(0x0a0f1d);

    this.isXRay = false;
    this.originalMaterials = new Map();

    this.initRenderer();
    this.initCamera();
    this.initControls();
    this.initLights();
    this.initFloor();
    this.setupResize();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });

    // Optimal performance pixel ratio: clamp to max 1.5 to avoid GPU fillrate bottleneck on 4K/high-DPI screens
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35; // Bright, clear, vibrant
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
  }

  initCamera() {
    // 30° FOV positioned closer so breadboard is ~35-40% larger and circuit is centered
    this.camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      0.05, // Ultra-close near clipping plane prevents pin clipping
      100
    );
    this.camera.position.set(0, 6.8, 8.5);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI - 0.05;
    this.controls.target.set(0, 0.4, 0); // Exact center of breadboard
    this.controls.update();
  }

  initLights() {
    // Soft sky-ground ambient illumination for clear shadow fill
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.3);
    this.scene.add(hemiLight);

    // Key Studio Light (Front-Right softbox)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    this.keyLight.position.set(7, 18, 11);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 35;
    this.keyLight.shadow.camera.left = -12;
    this.keyLight.shadow.camera.right = 12;
    this.keyLight.shadow.camera.top = 12;
    this.keyLight.shadow.camera.bottom = -12;
    this.keyLight.shadow.bias = -0.0003;
    this.keyLight.shadow.radius = 2.0;
    this.scene.add(this.keyLight);

    // Cyan Fill Light from left for rich metallic rim and edge definition
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    fillLight.position.set(-11, 10, -6);
    this.scene.add(fillLight);

    // Warm Top-Down Overhead Softbox Light for razor-sharp breadboard label visibility
    const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
    topLight.position.set(0, 20, 0);
    this.scene.add(topLight);

    // Back Rim Light catching IC and pin bevels
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
    rimLight.position.set(0, 8, -14);
    this.scene.add(rimLight);
  }

  initFloor() {
    // Studio Floor with engineering grid
    const floorGeo = new THREE.PlaneGeometry(60, 60);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#070a10';
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const step = 32;
    for (let x = 0; x <= 1024; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y <= 1024; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    const grad = ctx.createRadialGradient(512, 512, 150, 512, 512, 512);
    grad.addColorStop(0, 'rgba(7, 10, 16, 0)');
    grad.addColorStop(1, 'rgba(7, 10, 16, 0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.1
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.floor = floor;
  }

  setCameraView(viewKey) {
    const views = {
      // 1. Engineering Top View (Orthographic-style top-down)
      top: {
        pos: new THREE.Vector3(0, 13.5, 0.001),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      // 2. Front Elevation View
      front: {
        pos: new THREE.Vector3(0, 3.2, 11.0),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      // 3. Left Profile View (INMP441 audio bus)
      left: {
        pos: new THREE.Vector3(-12.5, 3.5, 0),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      // 4. Right Profile View (Motor driver & power)
      right: {
        pos: new THREE.Vector3(12.5, 3.5, 0),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      // 5. Isometric View (Classic 30° CAD axonometric view)
      iso: {
        pos: new THREE.Vector3(8.5, 8.5, 8.5),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      // 6. Exploded View (Elevated perspective for layer clearance)
      exploded: {
        pos: new THREE.Vector3(0, 11.0, 12.0),
        target: new THREE.Vector3(0, 1.2, 0)
      },
      // 7. Reset / Engineering Hero View
      reset: {
        pos: new THREE.Vector3(0, 6.8, 8.5),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      hero: {
        pos: new THREE.Vector3(0, 6.8, 8.5),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      pins: {
        pos: new THREE.Vector3(0, 7.5, 0.001),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      esp32: {
        pos: new THREE.Vector3(0, 3.8, 3.6),
        target: new THREE.Vector3(0, 0.8, 0)
      },
      oled: {
        pos: new THREE.Vector3(-1.0, 3.8, 2.2),
        target: new THREE.Vector3(-1.0, 1.0, -1.0)
      },
      motor: {
        pos: new THREE.Vector3(5.5, 3.6, 2.8),
        target: new THREE.Vector3(5.5, 0.7, 0.8)
      }
    };

    const targetView = views[viewKey] || views.reset;
    this.smoothTransition(targetView.pos, targetView.target);
  }

  focusOnObject(obj3D) {
    const box = new THREE.Box3().setFromObject(obj3D);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const targetPos = new THREE.Vector3(
      center.x + 2.2,
      center.y + 3.2,
      center.z + 3.5
    );

    this.smoothTransition(targetPos, center);
  }

  focusOnPinConnection(pStart, pEnd) {
    const midX = (pStart.x + pEnd.x) / 2;
    const midY = (pStart.y + pEnd.y) / 2;
    const midZ = (pStart.z + pEnd.z) / 2;
    const center = new THREE.Vector3(midX, midY, midZ);
    const dist = pStart.distanceTo(pEnd);
    const zoomHeight = Math.max(3.5, dist * 0.75 + 2.2);

    const targetPos = new THREE.Vector3(
      midX,
      midY + zoomHeight,
      midZ + 2.6
    );

    this.smoothTransition(targetPos, center, 800);
  }

  smoothTransition(newPos, newTarget, duration = 1000) {
    if (this.currentCameraTween) this.currentCameraTween.stop();
    if (this.currentTargetTween) this.currentTargetTween.stop();

    this.currentCameraTween = new TWEEN.Tween(this.camera.position)
      .to(newPos, duration)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();

    this.currentTargetTween = new TWEEN.Tween(this.controls.target)
      .to(newTarget, duration)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => this.controls.update())
      .start();
  }

  toggleXRay() {
    this.isXRay = !this.isXRay;

    const xrayMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x002244,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.85,
      transparent: true,
      opacity: 0.35,
      ior: 1.4
    });

    this.scene.traverse((node) => {
      const isWireOrPin =
        node.name?.includes('Wire') ||
        node.name?.includes('Jumper') ||
        node.parent?.name?.includes('Wire') ||
        node.parent?.name?.includes('Jumper') ||
        node.userData?.net !== undefined;

      if (node.isMesh && node !== this.floor && !isWireOrPin) {
        if (this.isXRay) {
          if (!this.originalMaterials.has(node)) {
            this.originalMaterials.set(node, node.material);
          }
          node.material = xrayMat;
        } else {
          if (this.originalMaterials.has(node)) {
            node.material = this.originalMaterials.get(node);
          }
        }
      }
    });

    return this.isXRay;
  }

  setupResize() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(width, height);
    });
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
