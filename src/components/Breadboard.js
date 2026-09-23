import * as THREE from 'three';
import { InternalMetalClips } from './InternalMetalClips';

export class Breadboard {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Breadboard_Root';

    // Standard 830-tie-point breadboard physical dimensions (in cm: 1 unit = 1 cm = 10mm)
    this.length = 16.5; // 165mm
    this.width = 5.5;   // 55mm
    this.height = 0.85; // 8.5mm
    this.pitch = 0.254; // 2.54mm standard DIP pitch

    this.transparentMaterials = [];
    this.init();
  }

  init() {
    this.createBody();
    this.createInternalClips();
    this.createSocketHoles();
    this.createFacePlate();
  }

  createInternalClips() {
    this.internalClips = new InternalMetalClips(this);
    this.group.add(this.internalClips.group);
  }

  createBody() {
    // Breadboard base plastic (matte off-white ABS)
    const shape = new THREE.Shape();
    const r = 0.3; // corner radius
    const w = this.length;
    const h = this.width;
    const x = -w / 2;
    const y = -h / 2;

    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const extrudeSettings = {
      depth: this.height,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(-Math.PI / 2); // Extrude upwards from Y=0 to Y=this.height

    const material = new THREE.MeshStandardMaterial({
      color: 0xf4f1ea,
      roughness: 0.45,
      metalness: 0.02,
      transparent: true,
      opacity: 1.0
    });
    this.transparentMaterials.push(material);

    const body = new THREE.Mesh(geometry, material);
    body.receiveShadow = true;
    body.castShadow = true;
    this.group.add(body);
    this.bodyMesh = body;

    // Center divider trough (indent)
    const troughGeo = new THREE.BoxGeometry(this.length - 0.6, 0.15, 0.28);
    const troughMat = new THREE.MeshStandardMaterial({
      color: 0xd8d4cb,
      roughness: 0.6,
      transparent: true,
      opacity: 1.0
    });
    this.transparentMaterials.push(troughMat);
    const trough = new THREE.Mesh(troughGeo, troughMat);
    trough.position.set(0, this.height - 0.04, 0);
    this.group.add(trough);
    this.troughMesh = trough;

    // Side power rail separators (two indents separating power buses from terminal strips)
    const sepGeo = new THREE.BoxGeometry(this.length - 0.6, 0.08, 0.12);
    const sepMat = new THREE.MeshStandardMaterial({
      color: 0xdcd8cf,
      roughness: 0.6,
      transparent: true,
      opacity: 1.0
    });
    this.transparentMaterials.push(sepMat);

    const sepTop = new THREE.Mesh(sepGeo, sepMat);
    sepTop.position.set(0, this.height - 0.03, -1.7);
    this.group.add(sepTop);
    this.sepTopMesh = sepTop;

    const sepBot = new THREE.Mesh(sepGeo, sepMat);
    sepBot.position.set(0, this.height - 0.03, 1.7);
    this.group.add(sepBot);
    this.sepBotMesh = sepBot;
  }

  createFacePlate() {
    // Generate ultra-high-resolution silkscreen texture for breadboard labels & lines (4096x2048)
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // Background matching breadboard plastic
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Coordinate conversion utilities
    const scaleX = canvas.width / this.length;
    const scaleZ = canvas.height / this.width;

    const toCanvasX = (cmX) => (cmX + this.length / 2) * scaleX;
    const toCanvasZ = (cmZ) => (cmZ + this.width / 2) * scaleZ;

    // Draw power rail stripes (Red = +, Blue = -)
    // Red line for +top (Z = -2.45)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-7.5), toCanvasZ(-2.45));
    ctx.lineTo(toCanvasX(7.5), toCanvasZ(-2.45));
    ctx.stroke();

    // Blue line for -top (Z = -1.85)
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-7.5), toCanvasZ(-1.85));
    ctx.lineTo(toCanvasX(7.5), toCanvasZ(-1.85));
    ctx.stroke();

    // Red line for +bot (Z = 1.85)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-7.5), toCanvasZ(1.85));
    ctx.lineTo(toCanvasX(7.5), toCanvasZ(1.85));
    ctx.stroke();

    // Blue line for -bot (Z = 2.45)
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-7.5), toCanvasZ(2.45));
    ctx.lineTo(toCanvasX(7.5), toCanvasZ(2.45));
    ctx.stroke();

    // Power rail polarity symbols (+ and -)
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ef4444';
    [-7.8, -4, 0, 4, 7.8].forEach(x => {
      ctx.fillText('+', toCanvasX(x), toCanvasZ(-2.45));
      ctx.fillText('+', toCanvasX(x), toCanvasZ(1.85));
    });

    ctx.fillStyle = '#2563eb';
    [-7.8, -4, 0, 4, 7.8].forEach(x => {
      ctx.fillText('—', toCanvasX(x), toCanvasZ(-1.85));
      ctx.fillText('—', toCanvasX(x), toCanvasZ(2.45));
    });

    // Column letters (A B C D E / F G H I J) at multiple intervals across the breadboard
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 42px sans-serif';

    const colsTop = ['A', 'B', 'C', 'D', 'E'];
    const colsBot = ['F', 'G', 'H', 'I', 'J'];
    const colIntervals = [-7.8, -4.0, 0, 4.0, 7.8];

    colIntervals.forEach(xPos => {
      colsTop.forEach(col => {
        const z = this.getColZ(col);
        ctx.fillText(col, toCanvasX(xPos), toCanvasZ(z));
      });
      colsBot.forEach(col => {
        const z = this.getColZ(col);
        ctx.fillText(col, toCanvasX(xPos), toCanvasZ(z));
      });
    });

    // Row numbers along the center trough and outer boundaries (1, 5, 10, 15... 60, 63)
    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = '#090d16';

    for (let r = 1; r <= 63; r++) {
      const x = this.getRowX(r);
      const isLabeled = (r === 1 || r % 5 === 0 || r === 63);

      if (isLabeled) {
        const str = r.toString();
        // Center divider labels
        ctx.fillText(str, toCanvasX(x), toCanvasZ(-0.2));
        ctx.fillText(str, toCanvasX(x), toCanvasZ(0.2));
        // Outer edge labels
        ctx.fillText(str, toCanvasX(x), toCanvasZ(-1.65));
        ctx.fillText(str, toCanvasX(x), toCanvasZ(1.65));
      } else {
        // Subtle tick mark for every single row
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x), toCanvasZ(-0.25));
        ctx.lineTo(toCanvasX(x), toCanvasZ(-0.15));
        ctx.moveTo(toCanvasX(x), toCanvasZ(0.15));
        ctx.lineTo(toCanvasX(x), toCanvasZ(0.25));
        ctx.stroke();
      }
    }

    // Subtle hole socket guide rings on canvas
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 2;
    const allCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (let r = 1; r <= 63; r++) {
      const x = this.getRowX(r);
      for (const c of allCols) {
        const z = this.getColZ(c);
        ctx.beginPath();
        ctx.arc(toCanvasX(x), toCanvasZ(z), 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false; // Zero downscaling blur!
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16; // Razor-sharp texture at oblique angles

    const plateGeo = new THREE.PlaneGeometry(this.length, this.width);
    const plateMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.45,
      metalness: 0.02,
      transparent: true,
      opacity: 1.0
    });
    this.transparentMaterials.push(plateMat);

    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = this.height + 0.001;
    plate.receiveShadow = true;
    this.group.add(plate);
    this.facePlateMesh = plate;
  }

  /**
   * Set opacity of the breadboard body (0.0 to 1.0)
   * Supports 100%, 75%, 50%, 25%, and 0%.
   * When alpha is 0.0, the plastic body, faceplate, and sockets are hidden completely,
   * exposing internal metal spring clips, bus rails, and jumper pin insertions!
   */
  setOpacity(alpha) {
    const clamped = Math.max(0, Math.min(1, alpha));
    const hidePlastic = (clamped <= 0.05);

    if (this.bodyMesh) this.bodyMesh.visible = !hidePlastic;
    if (this.troughMesh) this.troughMesh.visible = !hidePlastic;
    if (this.sepTopMesh) this.sepTopMesh.visible = !hidePlastic;
    if (this.sepBotMesh) this.sepBotMesh.visible = !hidePlastic;
    if (this.facePlateMesh) this.facePlateMesh.visible = !hidePlastic;
    if (this.socketHolesMesh) this.socketHolesMesh.visible = !hidePlastic;

    this.transparentMaterials.forEach(mat => {
      mat.opacity = clamped;
      mat.depthWrite = clamped > 0.15;
    });

    if (this.internalClips && this.internalClips.group) {
      this.internalClips.group.visible = true;
    }
  }

  createSocketHoles() {
    // Create physical hole indentation meshes with dark contact clip inside
    // Using InstancedMesh for optimal 60fps rendering of 830+ pin sockets
    const holeGeo = new THREE.BoxGeometry(0.12, 0.04, 0.12);
    const holeMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.4
    });

    // Total holes = 63 * 10 (main) + 4 * 50 (rails) = 630 + 200 = 830
    const totalHoles = 63 * 10 + 4 * 50;
    const instancedMesh = new THREE.InstancedMesh(holeGeo, holeMat, totalHoles);
    instancedMesh.castShadow = false;
    instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    // Main tie points (63 rows x 10 cols)
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (let r = 1; r <= 63; r++) {
      const x = this.getRowX(r);
      for (const c of cols) {
        const z = this.getColZ(c);
        dummy.position.set(x, this.height + 0.005, z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(idx++, dummy.matrix);
      }
    }

    // Power rails (50 holes each on +top, -top, +bot, -bot)
    // 50 pins distributed across length
    const railPitch = (this.length - 2.0) / 49;
    const rails = [
      { z: -2.3 }, // +top (3.3V)
      { z: -2.0 }, // -top (GND)
      { z: 2.0 },  // +bot (5V)
      { z: 2.3 }   // -bot (GND)
    ];

    rails.forEach((rail) => {
      for (let p = 0; p < 50; p++) {
        const x = - (this.length - 2.0) / 2 + p * railPitch;
        dummy.position.set(x, this.height + 0.005, rail.z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(idx++, dummy.matrix);
      }
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    this.group.add(instancedMesh);
    this.socketHolesMesh = instancedMesh;
  }

  // Coordinate mapping utilities
  getRowX(row) {
    // 63 rows centered at X=0, pitch = 0.254 cm
    // row 32 is center
    return (row - 32) * this.pitch;
  }

  getColZ(col) {
    const colMap = {
      'A': -1.45,
      'B': -1.20,
      'C': -0.95,
      'D': -0.70,
      'E': -0.45,
      'F': 0.45,
      'G': 0.70,
      'H': 0.95,
      'I': 1.20,
      'J': 1.45
    };
    return colMap[col] || 0;
  }

  getRailZ(rail) {
    const railMap = {
      '+top': -2.3, // 3.3V Rail
      '-top': -2.0, // GND Rail
      '+bot': 2.0,  // 5V Rail
      '-bot': 2.3   // GND Rail
    };
    return railMap[rail] || 0;
  }

  getRailX(pin) {
    // pin 1..50
    const clampedPin = Math.max(1, Math.min(50, pin));
    const railPitch = (this.length - 2.0) / 49;
    return - (this.length - 2.0) / 2 + (clampedPin - 1) * railPitch;
  }

  /**
   * Get 3D coordinates of any tie-point or rail hole on the breadboard surface.
   * @param {Object} spec - e.g. { row: 15, col: 'B' } or { rail: '+top', pin: 10 }
   * @returns {THREE.Vector3}
   */
  getHolePos(spec) {
    const y = this.height + 0.01;
    if (spec.rail) {
      const x = this.getRailX(spec.pin || 25);
      const z = this.getRailZ(spec.rail);
      return new THREE.Vector3(x, y, z);
    }

    if (spec.row && spec.col) {
      const x = this.getRowX(spec.row);
      const z = this.getColZ(spec.col);
      return new THREE.Vector3(x, y, z);
    }

    return new THREE.Vector3(0, y, 0);
  }
}
