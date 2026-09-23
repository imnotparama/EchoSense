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

    // 3 metallic wire leads
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });
    const leadGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.45, 8);

    const lead1 = new THREE.Mesh(leadGeo, leadMat); // Emitter
    lead1.position.set(-0.15, this.breadboard.height + 0.2, 0);

    const lead2 = new THREE.Mesh(leadGeo, leadMat); // Base
    lead2.position.set(0, this.breadboard.height + 0.2, 0);

    const lead3 = new THREE.Mesh(leadGeo, leadMat); // Collector
    lead3.position.set(0.15, this.breadboard.height + 0.2, 0);

    const posX = this.breadboard.getRowX(57);
    const posZ = this.breadboard.getColZ('D');

    transGroup.position.set(posX, 0, posZ);
    transGroup.add(body, label, lead1, lead2, lead3);
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

    // Glass DO-35 cylinder
    const glassGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.38, 16);
    glassGeo.rotateZ(Math.PI / 2);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xef4444, // Reddish/orange silicon inside
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
      ior: 1.5
    });

    const body = new THREE.Mesh(glassGeo, glassMat);
    body.castShadow = true;
    body.position.y = this.breadboard.height + 0.25;

    // Black cathode band on one end
    const bandGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.08, 16);
    bandGeo.rotateZ(Math.PI / 2);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(-0.12, body.position.y, 0);

    // Axial bent leads
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });
    const leadGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.3, 8);

    const lead1 = new THREE.Mesh(leadGeo, leadMat);
    lead1.position.set(-0.25, this.breadboard.height + 0.12, 0);

    const lead2 = new THREE.Mesh(leadGeo, leadMat);
    lead2.position.set(0.25, this.breadboard.height + 0.12, 0);

    const posX = (this.breadboard.getRowX(55) + this.breadboard.getRowX(56)) / 2;
    const posZ = this.breadboard.getColZ('E');

    diodeGroup.position.set(posX, 0, posZ);
    diodeGroup.add(body, band, lead1, lead2);
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

    body.position.set(midX, elevatedY, midZ);

    // Wire leads bent down into holes
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });
    const leadGeo = new THREE.CylinderGeometry(0.016, 0.016, elevatedY - this.breadboard.height + 0.05, 8);

    const lead1 = new THREE.Mesh(leadGeo, leadMat);
    lead1.position.set(pStart.x, (elevatedY + this.breadboard.height) / 2, pStart.z);

    const lead2 = new THREE.Mesh(leadGeo, leadMat);
    lead2.position.set(pEnd.x, (elevatedY + this.breadboard.height) / 2, pEnd.z);

    resGroup.add(body, lead1, lead2);
    this.resistors.add(resGroup);
  }
}
