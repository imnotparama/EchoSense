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

    // Premium breadboard plastic body (high-grade satin off-white ABS for classic, or dark slate for dark)
    const isClassic = (this.currentTheme !== 'dark');
    const material = new THREE.MeshStandardMaterial({
      color: isClassic ? 0xf8fafc : 0x141a24,
      roughness: 0.55,
      metalness: 0.05,
      transparent: true,
      opacity: 1.0
    });
    this.transparentMaterials.push(material);

    const body = new THREE.Mesh(geometry, material);
    body.receiveShadow = true;
    body.castShadow = true;
    this.group.add(body);
    this.bodyMesh = body;

    // Center divider trough (groove where ICs straddle)
    const troughGeo = new THREE.BoxGeometry(this.length - 0.6, 0.15, 0.28);
    const troughMat = new THREE.MeshStandardMaterial({
      color: isClassic ? 0xcbd5e1 : 0x0c1017,
      roughness: 0.75,
      metalness: 0.05,
      transparent: true,
      opacity: 1.0
    });
    this.transparentMaterials.push(troughMat);
    const trough = new THREE.Mesh(troughGeo, troughMat);
    trough.position.set(0, this.height - 0.04, 0);
    this.group.add(trough);
    this.troughMesh = trough;

    // Side power rail separators
    const sepGeo = new THREE.BoxGeometry(this.length - 0.6, 0.08, 0.12);
    const sepMat = new THREE.MeshStandardMaterial({
      color: isClassic ? 0xd1d5db : 0x0f141f,
      roughness: 0.75,
      metalness: 0.05,
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

    // 4 Polished brass corner mounting standoffs
    this.createCornerScrews();
  }

  createCornerScrews() {
    const screwGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16);
    const screwMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Polished brass
      roughness: 0.25,
      metalness: 0.9
    });
    const corners = [
      { x: -this.length / 2 + 0.35, z: -this.width / 2 + 0.35 },
      { x: this.length / 2 - 0.35, z: -this.width / 2 + 0.35 },
      { x: -this.length / 2 + 0.35, z: this.width / 2 - 0.35 },
      { x: this.length / 2 - 0.35, z: this.width / 2 - 0.35 }
    ];

    corners.forEach(pos => {
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.position.set(pos.x, this.height + 0.02, pos.z);
      this.group.add(screw);
    });
  }

  createFacePlate(theme = 'classic') {
    this.currentTheme = theme;
    const isClassic = (theme !== 'dark');

    // Generate ultra-high-resolution silkscreen texture for breadboard labels & lines (4096x2048)
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // 1. Surface Background
    ctx.fillStyle = isClassic ? '#f1f5f9' : '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Coordinate conversion utilities
    const scaleX = canvas.width / this.length;
    const scaleZ = canvas.height / this.width;
    const toCanvasX = (cmX) => (cmX + this.length / 2) * scaleX;
    const toCanvasZ = (cmZ) => (cmZ + this.width / 2) * scaleZ;

    // 2. Center Divider Groove on Texture
    ctx.fillStyle = isClassic ? '#cbd5e1' : '#060a12';
    ctx.fillRect(toCanvasX(-this.length / 2 + 0.2), toCanvasZ(-0.16), (this.length - 0.4) * scaleX, 0.32 * scaleZ);

    // 3. Power Rail Separator Grooves
    ctx.fillStyle = isClassic ? '#e2e8f0' : '#070c14';
    ctx.fillRect(toCanvasX(-this.length / 2 + 0.2), toCanvasZ(-1.75), (this.length - 0.4) * scaleX, 0.12 * scaleZ);
    ctx.fillRect(toCanvasX(-this.length / 2 + 0.2), toCanvasZ(1.63), (this.length - 0.4) * scaleX, 0.12 * scaleZ);

    // 4. Power Rail Stripes (Bold Crimson Red = +, Deep Royal Blue / Cyan = -)
    // Red +top rail (Z = -2.45)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-7.5), toCanvasZ(-2.45));
    ctx.lineTo(toCanvasX(7.5), toCanvasZ(-2.45));
    ctx.stroke();

    // Blue -top ground rail (Z = -1.85)
    ctx.strokeStyle = isClassic ? '#0284c7' : '#06b6d4';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-7.5), toCanvasZ(-1.85));
    ctx.lineTo(toCanvasX(7.5), toCanvasZ(-1.85));
    ctx.stroke();

    // Red +bot rail (Z = 1.85)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-7.5), toCanvasZ(1.85));
    ctx.lineTo(toCanvasX(7.5), toCanvasZ(1.85));
    ctx.stroke();

    // Blue -bot ground rail (Z = 2.45)
    ctx.strokeStyle = isClassic ? '#0284c7' : '#06b6d4';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-7.5), toCanvasZ(2.45));
    ctx.lineTo(toCanvasX(7.5), toCanvasZ(2.45));
    ctx.stroke();

    // 5. Power Rail Polarity Symbols (+ and -)
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ef4444';
    [-7.8, -4, 0, 4, 7.8].forEach(x => {
      ctx.fillText('+', toCanvasX(x), toCanvasZ(-2.45));
      ctx.fillText('+', toCanvasX(x), toCanvasZ(1.85));
    });

    ctx.fillStyle = isClassic ? '#0284c7' : '#06b6d4';
    [-7.8, -4, 0, 4, 7.8].forEach(x => {
      ctx.fillText('—', toCanvasX(x), toCanvasZ(-1.85));
      ctx.fillText('—', toCanvasX(x), toCanvasZ(2.45));
    });

    // 6. Draw Every Single Tie-Point Socket Hole (Photorealistic Beveled Square with Metal Clip)
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const holeOuterSize = 34; // Outer beveled collar
    const holeInnerSize = 22; // Dark cavity opening

    for (let r = 1; r <= 63; r++) {
      const x = this.getRowX(r);
      const cx = toCanvasX(x);

      // Main columns A to J
      for (const c of cols) {
        const cz = toCanvasZ(this.getColZ(c));

        // Outer collar / ENIG pad
        ctx.fillStyle = isClassic ? '#e2e8f0' : '#b45309';
        ctx.fillRect(cx - holeOuterSize / 2, cz - holeOuterSize / 2, holeOuterSize, holeOuterSize);

        // Recessed cavity
        ctx.fillStyle = isClassic ? '#0f172a' : '#030712';
        ctx.fillRect(cx - holeInnerSize / 2, cz - holeInnerSize / 2, holeInnerSize, holeInnerSize);

        // Silver / Nickel double leaf spring contact clip inside cavity
        ctx.strokeStyle = isClassic ? '#94a3b8' : '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cz - 7);
        ctx.lineTo(cx - 4, cz + 7);
        ctx.moveTo(cx + 4, cz - 7);
        ctx.lineTo(cx + 4, cz + 7);
        ctx.stroke();
      }

      // Power rail holes (at same X coordinate!)
      const railZs = [-2.3, -2.0, 2.0, 2.3];
      railZs.forEach(rz => {
        const cz = toCanvasZ(rz);

        ctx.fillStyle = isClassic ? '#e2e8f0' : '#b45309';
        ctx.fillRect(cx - holeOuterSize / 2, cz - holeOuterSize / 2, holeOuterSize, holeOuterSize);

        ctx.fillStyle = isClassic ? '#0f172a' : '#030712';
        ctx.fillRect(cx - holeInnerSize / 2, cz - holeInnerSize / 2, holeInnerSize, holeInnerSize);

        ctx.strokeStyle = isClassic ? '#94a3b8' : '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cz - 7);
        ctx.lineTo(cx - 4, cz + 7);
        ctx.moveTo(cx + 4, cz - 7);
        ctx.lineTo(cx + 4, cz + 7);
        ctx.stroke();
      });
    }

    // 7. Column Letters (A B C D E / F G H I J) in Bold, High-Contrast Typography
    ctx.fillStyle = isClassic ? '#1e293b' : '#f8fafc';
    ctx.font = 'bold 42px sans-serif';

    const colsTop = ['A', 'B', 'C', 'D', 'E'];
    const colsBot = ['F', 'G', 'H', 'I', 'J'];
    const colIntervals = [-7.7, -4.0, 0, 4.0, 7.7];

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

    // 8. Row Numbers (1, 5, 10... 63) - Bold, Ultra-Sharp and Visible
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = isClassic ? '#1e293b' : '#f8fafc';

    for (let r = 1; r <= 63; r++) {
      const x = this.getRowX(r);
      const isLabeled = (r === 1 || r % 5 === 0 || r === 63);

      if (isLabeled) {
        const str = r.toString();
        // Center divider labels (above and below center groove)
        ctx.fillText(str, toCanvasX(x), toCanvasZ(-0.25));
        ctx.fillText(str, toCanvasX(x), toCanvasZ(0.25));
        // Outer boundary labels
        ctx.fillText(str, toCanvasX(x), toCanvasZ(-1.62));
        ctx.fillText(str, toCanvasX(x), toCanvasZ(1.62));
      } else {
        // Subtle tick mark for every single row
        ctx.strokeStyle = isClassic ? '#64748b' : '#475569';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x), toCanvasZ(-0.24));
        ctx.lineTo(toCanvasX(x), toCanvasZ(-0.16));
        ctx.moveTo(toCanvasX(x), toCanvasZ(0.16));
        ctx.lineTo(toCanvasX(x), toCanvasZ(0.24));
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;

    if (this.facePlateMesh) {
      this.facePlateMesh.material.map = texture;
      this.facePlateMesh.material.needsUpdate = true;
    } else {
      const plateGeo = new THREE.PlaneGeometry(this.length, this.width);
      const plateMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.5,
        metalness: 0.05,
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
  }

  setTheme(themeName) {
    this.createFacePlate(themeName);
    const isClassic = (themeName !== 'dark');
    if (this.bodyMesh) {
      this.bodyMesh.material.color.setHex(isClassic ? 0xf8fafc : 0x141a24);
    }
    if (this.troughMesh) {
      this.troughMesh.material.color.setHex(isClassic ? 0xcbd5e1 : 0x0c1017);
    }
    if (this.sepTopMesh) {
      this.sepTopMesh.material.color.setHex(isClassic ? 0xd1d5db : 0x0f141f);
    }
    if (this.sepBotMesh) {
      this.sepBotMesh.material.color.setHex(isClassic ? 0xd1d5db : 0x0f141f);
    }
  }

  /**
   * Set opacity of the breadboard body (0.0 to 1.0)
   */
  setOpacity(alpha) {
    const clamped = Math.max(0, Math.min(1, alpha));
    const hidePlastic = (clamped <= 0.05);

    if (this.bodyMesh) this.bodyMesh.visible = !hidePlastic;
    if (this.troughMesh) this.troughMesh.visible = !hidePlastic;
    if (this.sepTopMesh) this.sepTopMesh.visible = !hidePlastic;
    if (this.sepBotMesh) this.sepBotMesh.visible = !hidePlastic;
    if (this.facePlateMesh) this.facePlateMesh.visible = !hidePlastic;

    this.transparentMaterials.forEach(mat => {
      mat.opacity = clamped;
      mat.depthWrite = clamped > 0.15;
    });

    if (this.internalClips && this.internalClips.group) {
      this.internalClips.group.visible = true;
    }
  }

  createSocketHoles() {
    // Holes and metallic clips are now crisply rendered on the ultra-sharp 4096x2048 faceplate,
    // eliminating z-fighting and rendering 100% cleanly without blurry artifacts.
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
    // Exact 1-to-1 alignment with rows 1 to 63:
    // Power rail pins line up directly with the corresponding row tie points!
    const r = Math.max(1, Math.min(63, pin));
    return this.getRowX(r);
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
