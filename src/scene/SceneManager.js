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
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    // 1. Perspective Camera (calibrated so board occupies >=80% of screen)
    this.perspectiveCamera = new THREE.PerspectiveCamera(
      28,
      aspect,
      0.05, // Ultra-close near clipping plane prevents pin clipping
      100
    );
    this.perspectiveCamera.position.set(0, 5.8, 7.2);

    // 2. True Flat Orthographic Camera (Wokwi / KiCad style 2D view, zero perspective distortion)
    const boardW = 18.5;
    const boardH = 10.5;
    let halfW, halfH;
    if (aspect >= boardW / boardH) {
      halfH = boardH / 2;
      halfW = halfH * aspect;
    } else {
      halfW = boardW / 2;
      halfH = halfW / aspect;
    }

    this.orthoCamera = new THREE.OrthographicCamera(
      -halfW, halfW, halfH, -halfH, 0.05, 100
    );
    this.orthoCamera.position.set(0, 18, 0.0001);
    this.orthoCamera.lookAt(0, 0, 0);

    // Active camera starts in perspective
    this.camera = this.perspectiveCamera;
    this.isOrthoMode = false;
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 25;
    this.controls.maxPolarAngle = Math.PI - 0.05;
    this.controls.target.set(0, 0.4, 0); // Center of circuit
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
    if (viewKey === 'top') {
      // Switch to True Flat Orthographic Camera (Wokwi / 2D PCB layout style)
      this.isOrthoMode = true;
      this.camera = this.orthoCamera;
      this.controls.object = this.orthoCamera;
      this.controls.enableRotate = false; // Pure 2D pan/zoom with zero angular parallax!
      this.controls.target.set(0, 0, 0);
      this.orthoCamera.position.set(0, 18, 0.0001);
      this.orthoCamera.zoom = 1.0;
      this.orthoCamera.updateProjectionMatrix();
      this.controls.update();
      return;
    }

    // Perspective 3D views
    if (this.isOrthoMode) {
      this.isOrthoMode = false;
      this.camera = this.perspectiveCamera;
      this.controls.object = this.perspectiveCamera;
      this.controls.enableRotate = true;
    }

    const views = {
      // 1. Perspective Top
      top: {
        pos: new THREE.Vector3(0, 13.5, 0.001),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      // 2. Front Elevation View
      front: {
        pos: new THREE.Vector3(0, 2.5, 9.5),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      // 3. Left Profile View (INMP441 audio bus)
      left: {
        pos: new THREE.Vector3(-10.5, 3.2, 0),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      // 4. Right Profile View (Motor driver & power)
      right: {
        pos: new THREE.Vector3(10.5, 3.2, 0),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      // 5. Isometric View (Classic 30° CAD axonometric view)
      iso: {
        pos: new THREE.Vector3(7.2, 7.2, 7.2),
        target: new THREE.Vector3(0, 0.4, 0)
      },
      // 6. Exploded View (Elevated perspective for layer clearance)
      exploded: {
        pos: new THREE.Vector3(0, 11.0, 10.5),
        target: new THREE.Vector3(0, 1.2, 0)
      },
      // 7. Reset / Engineering Hero View (Circuit occupies >=80% viewport)
      reset: {
        pos: new THREE.Vector3(0, 5.8, 7.2),
        target: new THREE.Vector3(0, 0.4, 0)
      }
    };

    const targetView = views[viewKey] || views.reset;
    this.smoothTransition(targetView.pos, targetView.target);
  }

  focusOnObject(obj3D) {
    if (this.isOrthoMode) {
      const box = new THREE.Box3().setFromObject(obj3D);
      const center = new THREE.Vector3();
      box.getCenter(center);
      this.controls.target.copy(center);
      this.controls.update();
      return;
    }

    const box = new THREE.Box3().setFromObject(obj3D);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const targetPos = new THREE.Vector3(
      center.x + 1.8,
      center.y + 2.5,
      center.z + 2.8
    );

    this.smoothTransition(targetPos, center);
  }

  focusOnPinConnection(pStart, pEnd) {
    const midX = (pStart.x + pEnd.x) / 2;
    const midY = (pStart.y + pEnd.y) / 2;
    const midZ = (pStart.z + pEnd.z) / 2;
    const center = new THREE.Vector3(midX, midY, midZ);
    const dist = pStart.distanceTo(pEnd);

    if (this.isOrthoMode) {
      this.controls.target.copy(center);
      this.controls.update();
      return;
    }

    const zoomHeight = Math.max(3.2, dist * 0.65 + 1.8);
    const targetPos = new THREE.Vector3(
      midX,
      midY + zoomHeight,
      midZ + 2.2
    );

    this.smoothTransition(targetPos, center, 750);
  }

  smoothTransition(newPos, newTarget, duration = 900) {
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

    const xrayGhostMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x031d36,
      emissiveIntensity: 0.25,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.88,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      ior: 1.4
    });

    this.scene.traverse((node) => {
      const isWireOrPin =
        node.name?.includes('Wire') ||
        node.name?.includes('Jumper') ||
        node.name?.includes('Pin') ||
        node.name?.includes('Boot') ||
        node.name?.includes('Clip') ||
        node.name?.includes('Internal_Clips') ||
        node.parent?.name?.includes('Wire') ||
        node.parent?.name?.includes('Jumper') ||
        node.parent?.name?.includes('InternalMetalClips') ||
        node.userData?.net !== undefined;

      if (node.isMesh && node !== this.floor && !isWireOrPin) {
        if (this.isXRay) {
          if (!this.originalMaterials.has(node)) {
            this.originalMaterials.set(node, node.material);
          }
          node.material = xrayGhostMat;
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
      const aspect = width / height;

      // Update Perspective Camera
      this.perspectiveCamera.aspect = aspect;
      this.perspectiveCamera.updateProjectionMatrix();

      // Update Orthographic Camera
      const boardW = 18.5;
      const boardH = 10.5;
      let halfW, halfH;
      if (aspect >= boardW / boardH) {
        halfH = boardH / 2;
        halfW = halfH * aspect;
      } else {
        halfW = boardW / 2;
        halfH = halfW / aspect;
      }
      this.orthoCamera.left = -halfW;
      this.orthoCamera.right = halfW;
      this.orthoCamera.top = halfH;
      this.orthoCamera.bottom = -halfH;
      this.orthoCamera.updateProjectionMatrix();

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
