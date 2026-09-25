import * as THREE from 'three';

export class TransistorCircuit {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'Driver_Circuit';

    this.init();
  }

  init() {
    this.create2N2222();
    this.create1N4148Diode();
    this.createResistors();
  }

  create2N2222() {
    // 2N2222 NPN Transistor in TO-92 package
    // Occupies rows 56, 57, 58 at Column D
    // Pin 1: Emitter (Row 58) -> GND
    // Pin 2: Base (Row 57) -> 1k resistor -> GPIO18
    // Pin 3: Collector (Row 56) -> Motor Negative & Diode Anode
    const transGroup = new THREE.Group();
    transGroup.name = 'Transistor_2N2222';
    transGroup.userData = {
      name: '2N2222 NPN BJT Transistor',
      category: 'MOTOR DRIVER SWITCH',
      desc: 'High-current (800mA max) NPN bipolar junction transistor in a TO-92 package. Acts as a low-side saturated switch driven by ESP32 GPIO18 to sink motor current from the 5V rail without loading the MCU output pin.',
      specs: [
        'TO-92 Package',
        'V_CEO = 40V, I_C = 800mA',
        'h_FE: 100 - 300',
        'Pinout: E-B-C (TO-92)',
        'Low-Side Saturated Switch'
      ]
    };

    // TO-92 package body: half-cylinder with flat front face
    const shape = new THREE.Shape();
    const r = 0.25;
    shape.absarc(0, 0, r, 0, Math.PI, false); // curved back
    shape.lineTo(-r, 0); // flat front
    shape.closePath();

    const extrudeSettings = {
      depth: 0.5,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03
    };

    const to92Geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    to92Geo.rotateX(-Math.PI / 2);

    const to92Mat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Black epoxy
      roughness: 0.45,
      metalness: 0.1
    });

    const body = new THREE.Mesh(to92Geo, to92Mat);
    body.castShadow = true;
    body.position.y = this.breadboard.height + 0.35;

    // Laser marking on flat front face
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('2N', 128, 90);
    ctx.fillText('2222A', 128, 140);
    ctx.font = '20px monospace';
    ctx.fillText('NPN BJT', 128, 190);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    const labelGeo = new THREE.PlaneGeometry(0.42, 0.42);
    const labelMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set(0, body.position.y + 0.22, 0.01);
    label.rotation.x = Math.PI;

    // 3 formed copper leads splaying out to Rows 56 (C), 57 (B), 58 (E) at Col D
    const leadMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.18
    });

    const bodyY = body.position.y;
    const holeY = this.breadboard.height;
    const pinConfigs = [
      { row: 58, label: 'Emitter',  targetX: this.breadboard.getRowX(58) - posX },
      { row: 57, label: 'Base',     targetX: 0 },
      { row: 56, label: 'Collector', targetX: this.breadboard.getRowX(56) - posX }
    ];

    pinConfigs.forEach(pc => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, bodyY, 0),
        new THREE.Vector3(pc.targetX * 0.5, (bodyY + holeY) * 0.6, 0),
        new THREE.Vector3(pc.targetX, holeY + 0.1, 0),
        new THREE.Vector3(pc.targetX, holeY - 0.25, 0)
      ]);
      const leadGeo = new THREE.TubeGeometry(curve, 16, 0.016, 8, false);
      const leadMesh = new THREE.Mesh(leadGeo, leadMat);
      leadMesh.castShadow = true;
      transGroup.add(leadMesh);
    });

    const posX = this.breadboard.getRowX(57);
    const posZ = this.breadboard.getColZ('D');

    transGroup.position.set(posX, 0, posZ);
    transGroup.add(body, label);
    this.group.add(transGroup);
  }

  create1N4148Diode() {
    // 1N4148 High-Speed Switching Diode
    // Placed across rows 55 (Cathode -> 5V) and 56 (Anode -> Collector) at Column E
    const diodeGroup = new THREE.Group();
    diodeGroup.name = 'Diode_1N4148';
    diodeGroup.userData = {
      name: '1N4148 High-Speed Flyback Diode',
      category: 'INDUCTIVE CLAMP',
      desc: 'High-speed silicon epitaxial planar diode (4ns reverse recovery) placed in reverse-bias across the vibration motor terminals. Clamps inductive back-EMF voltage spikes generated when the motor coil de-energizes, protecting the 2N2222 transistor.',
      specs: [
        'DO-35 Glass Package',
        '4ns Ultra-Fast Recovery',
        '100V Peak Reverse Voltage',
        'Cathode Band Polarized',
        'Flyback Protection'
      ]
    };

    const posX = (this.breadboard.getRowX(55) + this.breadboard.getRowX(56)) / 2;
    const posZ = this.breadboard.getColZ('E');
    const bodyY = this.breadboard.height + 0.26;

    // Glass DO-35 outer envelope
    const glassGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.36, 16);
    glassGeo.rotateZ(Math.PI / 2);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xfca5a5,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      transparent: true,
      opacity: 0.88,
      ior: 1.52
    });

    const body = new THREE.Mesh(glassGeo, glassMat);
    body.castShadow = true;
    body.position.set(0, bodyY, 0);

    // Internal copper slug and silicon die visible inside glass
    const slugMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
    const slugGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.18, 12);
    slugGeo.rotateZ(Math.PI / 2);
    const slug = new THREE.Mesh(slugGeo, slugMat);
    slug.position.set(0, bodyY, 0);

    // Black cathode polarity band
    const bandGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.06, 16);
    bandGeo.rotateZ(Math.PI / 2);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.35 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(-0.11, bodyY, 0);

    // Continuous formed axial leads bending down into Row 55 and Row 56
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });
    const row55X = this.breadboard.getRowX(55) - posX;
    const row56X = this.breadboard.getRowX(56) - posX;
    const holeY = this.breadboard.height;

    // Cathode lead (Row 55)
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, bodyY, 0),
      new THREE.Vector3(row55X, bodyY, 0),
      new THREE.Vector3(row55X, holeY + 0.05, 0),
      new THREE.Vector3(row55X, holeY - 0.22, 0)
    ]);
    const lead1Mesh = new THREE.Mesh(new THREE.TubeGeometry(curve1, 16, 0.015, 8, false), leadMat);

    // Anode lead (Row 56)
    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, bodyY, 0),
      new THREE.Vector3(row56X, bodyY, 0),
      new THREE.Vector3(row56X, holeY + 0.05, 0),
      new THREE.Vector3(row56X, holeY - 0.22, 0)
    ]);
    const lead2Mesh = new THREE.Mesh(new THREE.TubeGeometry(curve2, 16, 0.015, 8, false), leadMat);

    diodeGroup.position.set(posX, 0, posZ);
    diodeGroup.add(body, slug, band, lead1Mesh, lead2Mesh);
    this.group.add(diodeGroup);
  }

  createResistors() {
    // 1x 1kΩ Resistor (Brown-Black-Red-Gold) for 2N2222 Base
    // 3x 220Ω Resistors (Red-Red-Brown-Gold) for RGB LED channels
    this.resistors = new THREE.Group();

    // 1kΩ base resistor sitting neatly across Row 57 Col C to Col D (driving 2N2222 Base)
    this.createAxialResistor({
      name: '1kΩ Base Resistor',
      desc: '1kΩ 1/4W metal film resistor connecting ESP32 GPIO18 jumper line to the base of the 2N2222 transistor. Limits base drive current to ~2.6mA, ensuring hard saturation.',
      specs: ['1,000 Ω (1 kΩ)', 'Brown-Black-Red-Gold', '1/4 Watt Rating', '5% Tolerance'],
      colorBands: ['#854d0e', '#000000', '#dc2626', '#eab308'],
      startHole: { row: 57, col: 'C' },
      endHole: { row: 57, col: 'D' }
    });

    // 3x 220Ω compact current-limiting resistors for RGB LED channels (Col B to Col C)
    const ledResistors = [
      { name: '220Ω Red Resistor', gpio: 'GPIO15', row: 46 },
      { name: '220Ω Blue Resistor', gpio: 'GPIO17', row: 48 },
      { name: '220Ω Green Resistor', gpio: 'GPIO16', row: 49 }
    ];

    ledResistors.forEach(r => {
      this.createAxialResistor({
        name: r.name,
        desc: `220Ω 1/4W current-limiting resistor connecting ${r.gpio} jumper wire to the RGB LED anode. Sets forward current to ~12mA.`,
        specs: ['220 Ω', 'Red-Red-Brown-Gold', '1/4 Watt Rating', '5% Tolerance'],
        colorBands: ['#dc2626', '#dc2626', '#854d0e', '#eab308'],
        startHole: { row: r.row, col: 'B' },
        endHole: { row: r.row, col: 'C' }
      });
    });

    this.group.add(this.resistors);
  }

  createAxialResistor(config) {
    const resGroup = new THREE.Group();
    resGroup.name = config.name.replace(/\s+/g, '_');
    resGroup.userData = {
      name: config.name,
      category: 'PASSIVE COMPONENT',
      desc: config.desc,
      specs: config.specs
    };

    const pStart = this.breadboard.getHolePos(config.startHole);
    const pEnd = this.breadboard.getHolePos(config.endHole);

    // Ceramic beige body (compact 3.6mm length, 1.4mm radius)
    const bodyLength = 0.36;
    const bodyRadius = 0.11;
    const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 16);

    const isAlongX = Math.abs(pStart.x - pEnd.x) > Math.abs(pStart.z - pEnd.z);
    if (isAlongX) {
      bodyGeo.rotateZ(Math.PI / 2);
    } else {
      bodyGeo.rotateX(Math.PI / 2);
    }

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xe5d0b1, // Tan ceramic
      roughness: 0.55
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;

    // Color bands
    const bandGeo = new THREE.CylinderGeometry(bodyRadius * 1.03, bodyRadius * 1.03, 0.035, 16);
    if (isAlongX) {
      bandGeo.rotateZ(Math.PI / 2);
    } else {
      bandGeo.rotateX(Math.PI / 2);
    }

    const offsets = [-0.11, -0.04, 0.03, 0.11];
    config.colorBands.forEach((color, i) => {
      const bandMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.3 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      if (isAlongX) {
        band.position.x = offsets[i];
      } else {
        band.position.z = offsets[i];
      }
      body.add(band);
    });

    // Elevated center position resting just above breadboard
    const midX = (pStart.x + pEnd.x) / 2;
    const midZ = (pStart.z + pEnd.z) / 2;
    const elevatedY = this.breadboard.height + 0.18;
    const holeY = this.breadboard.height;

    body.position.set(midX, elevatedY, midZ);

    // Continuous formed copper-nickel wire leads bending 90° down into breadboard tie-points
    const leadMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.9,
      roughness: 0.15
    });

    // Start lead: from one end of resistor body to pStart hole
    const halfLen = bodyLength / 2;
    const bodyStartPos = isAlongX
      ? new THREE.Vector3(midX - (midX > pStart.x ? halfLen : -halfLen), elevatedY, midZ)
      : new THREE.Vector3(midX, elevatedY, midZ - (midZ > pStart.z ? halfLen : -halfLen));

    const curveStart = new THREE.CatmullRomCurve3([
      bodyStartPos,
      new THREE.Vector3(pStart.x, elevatedY, pStart.z),
      new THREE.Vector3(pStart.x, holeY + 0.04, pStart.z),
      new THREE.Vector3(pStart.x, holeY - 0.22, pStart.z)
    ]);
    const lead1Mesh = new THREE.Mesh(new THREE.TubeGeometry(curveStart, 16, 0.015, 8, false), leadMat);
    lead1Mesh.castShadow = true;

    // End lead: from other end of resistor body to pEnd hole
    const bodyEndPos = isAlongX
      ? new THREE.Vector3(midX + (pEnd.x > midX ? halfLen : -halfLen), elevatedY, midZ)
      : new THREE.Vector3(midX, elevatedY, midZ + (pEnd.z > midZ ? halfLen : -halfLen));

    const curveEnd = new THREE.CatmullRomCurve3([
      bodyEndPos,
      new THREE.Vector3(pEnd.x, elevatedY, pEnd.z),
      new THREE.Vector3(pEnd.x, holeY + 0.04, pEnd.z),
      new THREE.Vector3(pEnd.x, holeY - 0.22, pEnd.z)
    ]);
    const lead2Mesh = new THREE.Mesh(new THREE.TubeGeometry(curveEnd, 16, 0.015, 8, false), leadMat);
    lead2Mesh.castShadow = true;

    resGroup.add(body, lead1Mesh, lead2Mesh);
    this.resistors.add(resGroup);
  }
}
