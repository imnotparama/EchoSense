import * as THREE from 'three';

export class WireManager {
  /**
   * @param {import('../components/Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'Jumper_Wires_System';

    this.wireRecords = [];
    this.activeFilter = 'all';
    this.highlightedPin = null;

    this.init();
    this.initElectrons();
    this.initTargetMarkers();
  }

  init() {
    this.buildCircuitWiring();
  }

  initTargetMarkers() {
    // 3D Visual Target Beams & Rings highlighting exact breadboard holes
    this.targetGroup = new THREE.Group();
    this.targetGroup.name = 'Pin_Target_Markers';
    this.targetGroup.visible = false;

    // Glowing vertical beacon beam
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 16);
    const ringGeo = new THREE.RingGeometry(0.06, 0.26, 32);
    ringGeo.rotateX(-Math.PI / 2);

    const startMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    const endMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    // Start hole marker (Cyan)
    this.startBeam = new THREE.Mesh(beamGeo, startMat);
    this.startRing = new THREE.Mesh(ringGeo, startMat);
    this.startMarker = new THREE.Group();
    this.startMarker.add(this.startBeam, this.startRing);
    this.startBeam.position.y = 0.7;

    // End hole marker (Amber)
    this.endBeam = new THREE.Mesh(beamGeo, endMat);
    this.endRing = new THREE.Mesh(ringGeo, endMat);
    this.endMarker = new THREE.Group();
    this.endMarker.add(this.endBeam, this.endRing);
    this.endBeam.position.y = 0.7;

    this.targetGroup.add(this.startMarker, this.endMarker);
    this.group.add(this.targetGroup);
    this.markerTime = 0;
  }

  buildCircuitWiring() {
    const COLORS = {
      red: 0xef4444,
      black: 0x1e293b,
      green: 0x10b981,
      blue: 0x3b82f6,
      yellow: 0xeab308,
      teal: 0x14b8a6,
      purple: 0xa855f7
    };

    const wireDefinitions = [
      // POWER NETS
      {
        id: 'pwr_3v3',
        net: 'power',
        color: COLORS.red,
        colorName: 'Red',
        fromPin: 'ESP32 3V3',
        fromHole: 'Row 21, Col E',
        toPin: 'Top + Power Rail',
        toHole: '+ Rail, Pin 21',
        from: { row: 21, col: 'E' },
        to: { rail: '+top', pin: 21 },
        sag: 0.45,
        name: 'ESP32 3.3V Out -> Top + Rail',
        role: 'Supplies regulated 3.3V power to the top rail for the INMP441 mic and OLED display'
      },
      {
        id: 'gnd_top',
        net: 'ground',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'ESP32 GND',
        fromHole: 'Row 22, Col E',
        toPin: 'Top - GND Rail',
        toHole: '- Rail, Pin 22',
        from: { row: 22, col: 'E' },
        to: { rail: '-top', pin: 22 },
        sag: 0.35,
        name: 'ESP32 GND -> Top - Rail',
        role: 'Common ground return path for 3.3V logic components'
      },
      {
        id: 'pwr_5v',
        net: 'power',
        color: COLORS.red,
        colorName: 'Red',
        fromPin: 'ESP32 5V (VBUS)',
        fromHole: 'Row 42, Col F',
        toPin: 'Bottom + 5V Rail',
        toHole: '+ Rail, Pin 42',
        from: { row: 42, col: 'F' },
        to: { rail: '+bot', pin: 42 },
        sag: 0.5,
        name: 'ESP32 5V (VBUS) -> Bottom + Rail',
        role: 'Dedicated 5V USB power rail for the coin vibration motor and active buzzer'
      },
      {
        id: 'gnd_bot',
        net: 'ground',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'ESP32 GND',
        fromHole: 'Row 22, Col F',
        toPin: 'Bottom - GND Rail',
        toHole: '- Rail, Pin 22',
        from: { row: 22, col: 'F' },
        to: { rail: '-bot', pin: 22 },
        sag: 0.4,
        name: 'ESP32 GND -> Bottom - Rail',
        role: 'Common ground return path for 5V high-current actuators and buttons'
      },

      // INMP441 I2S NETS
      {
        id: 'inmp_vdd',
        net: 'power',
        color: COLORS.red,
        colorName: 'Red',
        fromPin: 'INMP441 VDD',
        fromHole: 'Row 8, Col A',
        toPin: 'Top + 3.3V Rail',
        toHole: '+ Rail, Pin 8',
        from: { row: 8, col: 'A' },
        to: { rail: '+top', pin: 8 },
        sag: 0.4,
        name: 'INMP441 VDD -> 3.3V Rail',
        role: '3.3V analog and digital power feed for the MEMS microphone transducer'
      },
      {
        id: 'inmp_gnd',
        net: 'ground',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'INMP441 GND',
        fromHole: 'Row 9, Col A',
        toPin: 'Top - GND Rail',
        toHole: '- Rail, Pin 9',
        from: { row: 9, col: 'A' },
        to: { rail: '-top', pin: 9 },
        sag: 0.35,
        name: 'INMP441 GND -> GND Rail',
        role: 'Ground reference for the microphone ADC'
      },
      {
        id: 'inmp_lr',
        net: 'ground',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'INMP441 L/R',
        fromHole: 'Row 13, Col A',
        toPin: 'Top - GND Rail',
        toHole: '- Rail, Pin 13',
        from: { row: 13, col: 'A' },
        to: { rail: '-top', pin: 13 },
        sag: 0.35,
        name: 'INMP441 L/R -> GND',
        role: 'Tied to GND to configure the microphone as Left Channel on the I2S bus'
      },
      {
        id: 'inmp_sck',
        net: 'i2s',
        color: COLORS.green,
        colorName: 'Green',
        fromPin: 'INMP441 SCK',
        fromHole: 'Row 12, Col C',
        toPin: 'ESP32 GPIO5',
        toHole: 'Row 26, Col D',
        from: { row: 12, col: 'C' },
        to: { row: 26, col: 'D' },
        sag: 0.65,
        name: 'INMP441 SCK -> ESP32 GPIO5',
        role: 'I2S Serial Continuous Clock: synchronous clock generated by ESP32 to shift audio bits'
      },
      {
        id: 'inmp_ws',
        net: 'i2s',
        color: COLORS.green,
        colorName: 'Green',
        fromPin: 'INMP441 WS',
        fromHole: 'Row 11, Col C',
        toPin: 'ESP32 GPIO4',
        toHole: 'Row 25, Col D',
        from: { row: 11, col: 'C' },
        to: { row: 25, col: 'D' },
        sag: 0.6,
        name: 'INMP441 WS -> ESP32 GPIO4',
        role: 'I2S Word Select (Left/Right Clock): signals the start of each 24-bit audio frame'
      },
      {
        id: 'inmp_sd',
        net: 'i2s',
        color: COLORS.green,
        colorName: 'Green',
        fromPin: 'INMP441 SD',
        fromHole: 'Row 10, Col C',
        toPin: 'ESP32 GPIO6',
        toHole: 'Row 27, Col D',
        from: { row: 10, col: 'C' },
        to: { row: 27, col: 'D' },
        sag: 0.7,
        name: 'INMP441 SD -> ESP32 GPIO6',
        role: 'I2S Serial Data: carries 24-bit studio audio samples into the ESP32 DMA buffer'
      },

      // OLED I2C NETS
      {
        id: 'oled_vcc',
        net: 'power',
        color: COLORS.red,
        colorName: 'Red',
        fromPin: 'OLED VCC',
        fromHole: 'Row 38, Col A',
        toPin: 'Top + 3.3V Rail',
        toHole: '+ Rail, Pin 38',
        from: { row: 38, col: 'A' },
        to: { rail: '+top', pin: 38 },
        sag: 0.4,
        name: 'OLED VCC -> 3.3V Rail',
        role: 'Powers the SSD1306 OLED display logic and charge pump'
      },
      {
        id: 'oled_gnd',
        net: 'ground',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'OLED GND',
        fromHole: 'Row 37, Col A',
        toPin: 'Top - GND Rail',
        toHole: '- Rail, Pin 37',
        from: { row: 37, col: 'A' },
        to: { rail: '-top', pin: 37 },
        sag: 0.35,
        name: 'OLED GND -> GND Rail',
        role: 'Ground reference for OLED display'
      },
      {
        id: 'oled_sda',
        net: 'i2c',
        color: COLORS.teal,
        colorName: 'Teal',
        fromPin: 'OLED SDA',
        fromHole: 'Row 40, Col B',
        toPin: 'ESP32 GPIO21',
        toHole: 'Row 38, Col D',
        from: { row: 40, col: 'B' },
        to: { row: 38, col: 'D' },
        sag: 0.45,
        name: 'OLED SDA -> ESP32 GPIO21',
        role: 'I2C Serial Data line: transfers display buffer graphics at 400 kHz'
      },
      {
        id: 'oled_scl',
        net: 'i2c',
        color: COLORS.teal,
        colorName: 'Teal',
        fromPin: 'OLED SCL',
        fromHole: 'Row 39, Col B',
        toPin: 'ESP32 GPIO22',
        toHole: 'Row 39, Col D',
        from: { row: 39, col: 'B' },
        to: { row: 39, col: 'D' },
        sag: 0.4,
        name: 'OLED SCL -> ESP32 GPIO22',
        role: 'I2C Serial Clock line: clock pulses for OLED register and screen updates'
      },

      // RGB LED
      {
        id: 'led_cathode',
        net: 'led',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'RGB LED Cathode',
        fromHole: 'Row 47, Col B',
        toPin: 'Top - GND Rail',
        toHole: '- Rail, Pin 47',
        from: { row: 47, col: 'B' },
        to: { rail: '-top', pin: 47 },
        sag: 0.4,
        name: 'RGB LED Common Cathode -> GND Rail',
        role: 'Shared ground sink for Red, Green, and Blue LED dies'
      },

      // MOTOR & 2N2222 DRIVER
      {
        id: 'driver_emitter',
        net: 'motor',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: '2N2222 Emitter',
        fromHole: 'Row 58, Col E',
        toPin: 'Bottom - GND Rail',
        toHole: '- Rail, Pin 58',
        from: { row: 58, col: 'E' },
        to: { rail: '-bot', pin: 58 },
        sag: 0.35,
        name: '2N2222 Emitter -> GND Rail',
        role: 'Low-side reference: completes the 5V circuit when transistor is saturated'
      },
      {
        id: 'motor_pwr',
        net: 'motor',
        color: COLORS.red,
        colorName: 'Red',
        fromPin: 'Motor (+) & 1N4148 Cathode',
        fromHole: 'Row 55, Col D',
        toPin: 'Bottom + 5V Rail',
        toHole: '+ Rail, Pin 55',
        from: { row: 55, col: 'D' },
        to: { rail: '+bot', pin: 55 },
        sag: 0.45,
        name: 'Motor + & 1N4148 Cathode -> 5V Rail',
        role: 'High-torque 5V power supply to vibration motor and diode clamp'
      },
      {
        id: 'motor_ctrl',
        net: 'motor',
        color: COLORS.yellow,
        colorName: 'Yellow',
        fromPin: 'Motor (-) & 1N4148 Anode',
        fromHole: 'Row 56, Col D',
        toPin: '2N2222 Collector',
        toHole: 'Row 57, Col E',
        from: { row: 56, col: 'D' },
        to: { row: 57, col: 'E' },
        sag: 0.3,
        name: 'Motor - & Diode Anode -> 2N2222 Collector',
        role: 'Switched motor negative terminal sunk by 2N2222 transistor'
      },

      // ACTIVE BUZZER
      {
        id: 'buzzer_sig',
        net: 'buzzer',
        color: COLORS.blue,
        colorName: 'Blue',
        fromPin: 'Active Buzzer (+)',
        fromHole: 'Row 51, Col H',
        toPin: 'ESP32 GPIO14',
        toHole: 'Row 35, Col G',
        from: { row: 51, col: 'H' },
        to: { row: 35, col: 'G' },
        sag: 0.75,
        name: 'Active Buzzer + -> ESP32 GPIO14',
        role: 'GPIO drive pin that triggers developer acoustic beep during alert events'
      },
      {
        id: 'buzzer_gnd',
        net: 'buzzer',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'Active Buzzer (-)',
        fromHole: 'Row 52, Col H',
        toPin: 'Bottom - GND Rail',
        toHole: '- Rail, Pin 52',
        from: { row: 52, col: 'H' },
        to: { rail: '-bot', pin: 52 },
        sag: 0.35,
        name: 'Active Buzzer - -> GND Rail',
        role: 'Ground return path for piezo sounder'
      },

      // TACTILE PUSH BUTTONS
      {
        id: 'btn_fire_sig',
        net: 'buttons',
        color: COLORS.purple,
        colorName: 'Purple',
        fromPin: 'Fire Button Output',
        fromHole: 'Row 14, Col H',
        toPin: 'ESP32 GPIO8',
        toHole: 'Row 25, Col G',
        from: { row: 14, col: 'H' },
        to: { row: 25, col: 'G' },
        sag: 0.75,
        name: 'Fire Button -> ESP32 GPIO8',
        role: 'INPUT_PULLUP line: pulled to GND when Fire Alarm button is pressed'
      },
      {
        id: 'btn_fire_gnd',
        net: 'buttons',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'Fire Button Ground',
        fromHole: 'Row 12, Col H',
        toPin: 'Bottom - GND Rail',
        toHole: '- Rail, Pin 12',
        from: { row: 12, col: 'H' },
        to: { rail: '-bot', pin: 12 },
        sag: 0.35,
        name: 'Fire Button -> GND Rail',
        role: 'Ground reference for Fire Alarm push button'
      },
      {
        id: 'btn_bell_sig',
        net: 'buttons',
        color: COLORS.purple,
        colorName: 'Purple',
        fromPin: 'Doorbell Button Output',
        fromHole: 'Row 20, Col H',
        toPin: 'ESP32 GPIO9',
        toHole: 'Row 26, Col G',
        from: { row: 20, col: 'H' },
        to: { row: 26, col: 'G' },
        sag: 0.65,
        name: 'Doorbell Button -> ESP32 GPIO9',
        role: 'INPUT_PULLUP line: triggers Doorbell chime simulation on GND press'
      },
      {
        id: 'btn_bell_gnd',
        net: 'buttons',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'Doorbell Button Ground',
        fromHole: 'Row 18, Col H',
        toPin: 'Bottom - GND Rail',
        toHole: '- Rail, Pin 18',
        from: { row: 18, col: 'H' },
        to: { rail: '-bot', pin: 18 },
        sag: 0.35,
        name: 'Doorbell Button -> GND Rail',
        role: 'Ground reference for Doorbell push button'
      },
      {
        id: 'btn_baby_sig',
        net: 'buttons',
        color: COLORS.purple,
        colorName: 'Purple',
        fromPin: 'Baby Cry Button Output',
        fromHole: 'Row 46, Col H',
        toPin: 'ESP32 GPIO10',
        toHole: 'Row 27, Col G',
        from: { row: 46, col: 'H' },
        to: { row: 27, col: 'G' },
        sag: 0.8,
        name: 'Baby Cry Button -> ESP32 GPIO10',
        role: 'INPUT_PULLUP line: triggers Baby Crying audio & haptic sequence'
      },
      {
        id: 'btn_baby_gnd',
        net: 'buttons',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'Baby Cry Button Ground',
        fromHole: 'Row 44, Col H',
        toPin: 'Bottom - GND Rail',
        toHole: '- Rail, Pin 44',
        from: { row: 44, col: 'H' },
        to: { rail: '-bot', pin: 44 },
        sag: 0.35,
        name: 'Baby Cry Button -> GND Rail',
        role: 'Ground reference for Baby Cry push button'
      },
      {
        id: 'btn_horn_sig',
        net: 'buttons',
        color: COLORS.purple,
        colorName: 'Purple',
        fromPin: 'Car Horn Button Output',
        fromHole: 'Row 52, Col H',
        toPin: 'ESP32 GPIO11',
        toHole: 'Row 28, Col G',
        from: { row: 52, col: 'H' },
        to: { row: 28, col: 'G' },
        sag: 0.85,
        name: 'Car Horn Button -> ESP32 GPIO11',
        role: 'INPUT_PULLUP line: triggers Vehicle Horn alert pattern'
      },
      {
        id: 'btn_horn_gnd',
        net: 'buttons',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'Car Horn Button Ground',
        fromHole: 'Row 50, Col H',
        toPin: 'Bottom - GND Rail',
        toHole: '- Rail, Pin 50',
        from: { row: 50, col: 'H' },
        to: { rail: '-bot', pin: 50 },
        sag: 0.35,
        name: 'Car Horn Button -> GND Rail',
        role: 'Ground reference for Car Horn push button'
      }
    ];

    this.wireDefinitions = wireDefinitions;
    wireDefinitions.forEach(def => this.createJumperWire(def));
  }

  createJumperWire(def) {
    const pStart = this.breadboard.getHolePos(def.from);
    const pEnd = this.breadboard.getHolePos(def.to);

    const wireGroup = new THREE.Group();
    wireGroup.userData = {
      id: def.id,
      net: def.net,
      name: def.name,
      fromPin: def.fromPin,
      fromHole: def.fromHole,
      toPin: def.toPin,
      toHole: def.toHole,
      role: def.role,
      colorName: def.colorName
    };

    const midX = (pStart.x + pEnd.x) / 2;
    const midZ = (pStart.z + pEnd.z) / 2;
    const dist = pStart.distanceTo(pEnd);
    const archHeight = Math.max(0.6, dist * 0.28 + (def.sag || 0.3));

    const bootMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.95, roughness: 0.15 });

    // Sturdy square terminal collar for clear insertion visibility
    const bootGeo = new THREE.BoxGeometry(0.16, 0.38, 0.16);
    const bootStart = new THREE.Mesh(bootGeo, bootMat);
    bootStart.position.set(pStart.x, pStart.y + 0.19, pStart.z);

    const bootEnd = new THREE.Mesh(bootGeo, bootMat);
    bootEnd.position.set(pEnd.x, pEnd.y + 0.19, pEnd.z);

    // Shiny nickel-plated pin pin entering hole
    const pinGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.24, 10);
    const pinStart = new THREE.Mesh(pinGeo, pinMat);
    pinStart.position.set(pStart.x, pStart.y, pStart.z);
    const pinEnd = new THREE.Mesh(pinGeo, pinMat);
    pinEnd.position.set(pEnd.x, pEnd.y, pEnd.z);

    const p1 = new THREE.Vector3(pStart.x, pStart.y + 0.38, pStart.z);
    const p2 = new THREE.Vector3(midX, this.breadboard.height + archHeight, midZ);
    const p3 = new THREE.Vector3(pEnd.x, pEnd.y + 0.38, pEnd.z);

    const curve = new THREE.CatmullRomCurve3([pStart, p1, p2, p3, pEnd]);
    // Increased tube radius to 0.062 for thick, bold, razor-sharp jumper wire rendering
    const wireGeo = new THREE.TubeGeometry(curve, 36, 0.062, 12, false);

    const wireMat = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: 0.2, // Glossy silicone jacket
      metalness: 0.15
    });

    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    wireMesh.castShadow = true;
    wireMesh.userData = wireGroup.userData;

    wireGroup.add(bootStart, bootEnd, pinStart, pinEnd, wireMesh);
    this.group.add(wireGroup);

    this.wireRecords.push({
      id: def.id,
      net: def.net,
      name: def.name,
      fromPin: def.fromPin,
      fromHole: def.fromHole,
      toPin: def.toPin,
      toHole: def.toHole,
      role: def.role,
      colorName: def.colorName,
      curve: curve,
      group: wireGroup,
      wireMesh: wireMesh,
      material: wireMat,
      baseColor: new THREE.Color(def.color),
      pStart,
      pEnd
    });
  }

  initElectrons() {
    // Glowing electron particle stream moving along wires
    const particleCountPerWire = 8;
    const totalElectrons = this.wireRecords.length * particleCountPerWire;

    const electronGeo = new THREE.SphereGeometry(0.055, 16, 16);
    const electronMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.95
    });

    this.electronMesh = new THREE.InstancedMesh(electronGeo, electronMat, totalElectrons);
    this.group.add(this.electronMesh);

    this.electrons = [];
    let idx = 0;
    this.wireRecords.forEach(w => {
      for (let p = 0; p < particleCountPerWire; p++) {
        this.electrons.push({
          wire: w,
          t: p / particleCountPerWire,
          speed: 0.35 + Math.random() * 0.15,
          meshIdx: idx++
        });
      }
    });
  }

  filterNet(netKey) {
    this.activeFilter = netKey;

    this.wireRecords.forEach(w => {
      if (netKey === 'all' || w.net === netKey) {
        w.group.visible = true;
        w.material.color.copy(w.baseColor);
        w.material.opacity = 1.0;
        w.material.transparent = false;
        w.material.emissive.setHex(0x000000);
        w.group.children.forEach(c => c.visible = true);
      } else {
        w.group.visible = true;
        w.material.color.setHex(0x1e293b);
        w.material.opacity = 0.12;
        w.material.transparent = true;
        w.material.emissive.setHex(0x000000);
        w.group.children.forEach(c => { if (c !== w.wireMesh) c.visible = false; });
      }
    });
  }

  highlightPath(pathKey) {
    this.highlightedPin = pathKey;

    // Define signal path mappings
    const pathFilters = {
      'gpio18': ['motor_ctrl', 'driver_emitter', 'motor_pwr'],
      'gpio8': ['btn_fire_sig', 'btn_fire_gnd'],
      'gpio9': ['btn_bell_sig', 'btn_bell_gnd'],
      'gpio10': ['btn_baby_sig', 'btn_baby_gnd'],
      'gpio11': ['btn_horn_sig', 'btn_horn_gnd'],
      'i2s': ['inmp_sck', 'inmp_ws', 'inmp_sd'],
      'i2c': ['oled_sda', 'oled_scl'],
      'buzzer': ['buzzer_sig', 'buzzer_gnd'],
      'power': ['pwr_3v3', 'pwr_5v', 'gnd_top', 'gnd_bot']
    };

    const targetIds = pathFilters[pathKey] || [pathKey];

    this.wireRecords.forEach(w => {
      const match = targetIds.includes(w.id) || targetIds.includes(w.net);
      if (match) {
        w.group.visible = true;
        w.material.color.setHex(0x00f0ff);
        w.material.emissive.setHex(0x00f0ff);
        w.material.emissiveIntensity = 0.8;
        w.material.opacity = 1.0;
        w.material.transparent = false;
        w.group.children.forEach(c => c.visible = true);
      } else {
        w.group.visible = true;
        w.material.color.setHex(0x1e293b);
        w.material.opacity = 0.12;
        w.material.transparent = true;
        w.material.emissive.setHex(0x000000);
        w.group.children.forEach(c => { if (c !== w.wireMesh) c.visible = false; });
      }
    });
  }

  getPinConnectionsList() {
    return this.wireDefinitions || [];
  }

  highlightConnection(wireId) {
    const record = this.wireRecords.find(w => w.id === wireId);
    if (!record) return null;

    this.highlightedPin = wireId;

    // Show target markers at exact start and end holes
    this.targetGroup.visible = true;
    this.startMarker.position.copy(record.pStart);
    this.endMarker.position.copy(record.pEnd);

    // Glow the selected wire in vibrant cyan, dim everything else
    this.wireRecords.forEach(w => {
      if (w.id === wireId) {
        w.group.visible = true;
        w.material.color.setHex(0x00f0ff);
        w.material.emissive.setHex(0x00f0ff);
        w.material.emissiveIntensity = 1.2;
        w.material.opacity = 1.0;
        w.material.transparent = false;
        w.group.children.forEach(c => c.visible = true);
      } else {
        w.group.visible = true;
        w.material.color.setHex(0x1e293b);
        w.material.opacity = 0.12;
        w.material.transparent = true;
        w.material.emissive.setHex(0x000000);
        w.group.children.forEach(c => { if (c !== w.wireMesh) c.visible = false; });
      }
    });

    return {
      pStart: record.pStart,
      pEnd: record.pEnd,
      wire: record
    };
  }

  clearConnectionHighlight() {
    this.targetGroup.visible = false;
    this.resetHighlight();
  }

  resetHighlight() {
    this.highlightedPin = null;
    this.targetGroup.visible = false;
    this.filterNet(this.activeFilter);
  }

  update(deltaTime) {
    // Animate target marker pulse if visible
    if (this.targetGroup && this.targetGroup.visible) {
      this.markerTime = (this.markerTime || 0) + deltaTime * 4;
      const pulse = 1 + 0.25 * Math.sin(this.markerTime);
      this.startRing.scale.set(pulse, pulse, pulse);
      this.endRing.scale.set(pulse, pulse, pulse);
    }

    if (!this.electronMesh) return;

    const dummy = new THREE.Object3D();

    this.electrons.forEach(el => {
      // Advance electron along wire curve
      el.t = (el.t + el.speed * deltaTime) % 1.0;

      const isWireActive = (this.activeFilter === 'all' || el.wire.net === this.activeFilter);
      if (isWireActive) {
        const point = el.wire.curve.getPointAt(el.t);
        dummy.position.copy(point);
        dummy.scale.set(1, 1, 1);
      } else {
        dummy.scale.set(0, 0, 0);
      }

      dummy.updateMatrix();
      this.electronMesh.setMatrixAt(el.meshIdx, dummy.matrix);
    });

    this.electronMesh.instanceMatrix.needsUpdate = true;
  }
}
