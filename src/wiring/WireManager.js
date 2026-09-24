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
      purple: 0xa855f7,
      orange: 0xf97316
    };

    const wireDefinitions = [
      // 1. POWER & GROUND DISTRIBUTION
      {
        id: 'pwr_3v3',
        net: 'power',
        color: COLORS.red,
        colorName: 'Red',
        fromPin: 'ESP32 3V3',
        fromHole: 'Row 21, Col D',
        toPin: 'Top + 3.3V Rail',
        toHole: '+ Rail, Pin 21',
        from: { row: 21, col: 'D' },
        to: { rail: '+top', pin: 21 },
        fromComp: 'esp32',
        toComp: 'breadboard',
        name: 'ESP32 3.3V Out ➔ Top + Rail',
        role: 'Regulated 3.3V power bus powering the INMP441 mic and OLED display'
      },
      {
        id: 'gnd_top',
        net: 'ground',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'ESP32 GND',
        fromHole: 'Row 22, Col D',
        toPin: 'Top - GND Rail',
        toHole: '- Rail, Pin 22',
        from: { row: 22, col: 'D' },
        to: { rail: '-top', pin: 22 },
        fromComp: 'esp32',
        toComp: 'breadboard',
        name: 'ESP32 GND ➔ Top - Rail',
        role: 'Primary digital ground return path for 3.3V logic'
      },
      {
        id: 'pwr_5v',
        net: 'power',
        color: COLORS.red,
        colorName: 'Red',
        fromPin: 'ESP32 5V (VBUS)',
        fromHole: 'Row 42, Col G',
        toPin: 'Bottom + 5V Rail',
        toHole: '+ Rail, Pin 42',
        from: { row: 42, col: 'G' },
        to: { rail: '+bot', pin: 42 },
        fromComp: 'esp32',
        toComp: 'breadboard',
        name: 'ESP32 5V VBUS ➔ Bottom + Rail',
        role: 'Raw 5V USB power rail for the coin vibration motor and active buzzer'
      },
      {
        id: 'gnd_bot',
        net: 'ground',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'ESP32 GND',
        fromHole: 'Row 22, Col G',
        toPin: 'Bottom - GND Rail',
        toHole: '- Rail, Pin 22',
        from: { row: 22, col: 'G' },
        to: { rail: '-bot', pin: 22 },
        fromComp: 'esp32',
        toComp: 'breadboard',
        name: 'ESP32 GND ➔ Bottom - Rail',
        role: 'High-current ground return path for actuators'
      },
      {
        id: 'gnd_bridge',
        net: 'ground',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'Top - GND Rail',
        fromHole: '- Rail, Pin 33',
        toPin: 'Bottom - GND Rail',
        toHole: '- Rail, Pin 33',
        from: { rail: '-top', pin: 33 },
        to: { rail: '-bot', pin: 33 },
        fromComp: 'breadboard',
        toComp: 'breadboard',
        name: 'Ground Tie Bridge',
        role: 'Common ground bus reference uniting upper and lower breadboard rails'
      },

      // 2. INMP441 I2S DIGITAL AUDIO
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
        fromComp: 'inmp441',
        toComp: 'breadboard',
        name: 'INMP441 VDD ➔ 3.3V Rail',
        role: 'Ultra-clean 3.3V analog and digital supply for MEMS transducer'
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
        fromComp: 'inmp441',
        toComp: 'breadboard',
        name: 'INMP441 GND ➔ GND Rail',
        role: 'Ground reference for internal delta-sigma ADC'
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
        fromComp: 'inmp441',
        toComp: 'breadboard',
        name: 'INMP441 L/R ➔ GND Rail',
        role: 'Tied to GND to configure the microphone as Left Channel on I2S bus'
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
        fromComp: 'inmp441',
        toComp: 'esp32',
        name: 'INMP441 WS ➔ ESP32 GPIO4',
        role: 'I2S Word Select (Left/Right Clock): signals start of 24-bit audio frame'
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
        fromComp: 'inmp441',
        toComp: 'esp32',
        name: 'INMP441 SCK ➔ ESP32 GPIO5',
        role: 'I2S Serial Continuous Clock: bit shift clock generated by ESP32 DMA'
      },
      {
        id: 'inmp_sd',
        net: 'i2s',
        color: COLORS.purple,
        colorName: 'Purple',
        fromPin: 'INMP441 SD',
        fromHole: 'Row 10, Col C',
        toPin: 'ESP32 GPIO6',
        toHole: 'Row 27, Col D',
        from: { row: 10, col: 'C' },
        to: { row: 27, col: 'D' },
        fromComp: 'inmp441',
        toComp: 'esp32',
        name: 'INMP441 SD ➔ ESP32 GPIO6',
        role: 'I2S Serial Data: carries serialized 24-bit PCM acoustic samples'
      },

      // 3. SSD1306 OLED DISPLAY (I2C)
      {
        id: 'oled_gnd',
        net: 'ground',
        color: COLORS.black,
        colorName: 'Black',
        fromPin: 'OLED GND',
        fromHole: 'Row 37, Col B',
        toPin: 'Top - GND Rail',
        toHole: '- Rail, Pin 37',
        from: { row: 37, col: 'B' },
        to: { rail: '-top', pin: 37 },
        fromComp: 'oled',
        toComp: 'breadboard',
        name: 'OLED GND ➔ GND Rail',
        role: 'Ground return reference for OLED display controller'
      },
      {
        id: 'oled_vcc',
        net: 'power',
        color: COLORS.red,
        colorName: 'Red',
        fromPin: 'OLED VCC',
        fromHole: 'Row 38, Col B',
        toPin: 'Top + 3.3V Rail',
        toHole: '+ Rail, Pin 38',
        from: { row: 38, col: 'B' },
        to: { rail: '+top', pin: 38 },
        fromComp: 'oled',
        toComp: 'breadboard',
        name: 'OLED VCC ➔ 3.3V Rail',
        role: 'Powers SSD1306 logic and charge pump display driver'
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
        fromComp: 'oled',
        toComp: 'esp32',
        name: 'OLED SCL ➔ ESP32 GPIO22',
        role: 'I2C Serial Clock line: 400 kHz Fast-Mode synchronization clock'
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
        fromComp: 'oled',
        toComp: 'esp32',
        name: 'OLED SDA ➔ ESP32 GPIO21',
        role: 'I2C Serial Data line: bidirectional pixel framebuffer data packets'
      },

      // 4. COMMON CATHODE RGB STATUS LED
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
        fromComp: 'rgbLed',
        toComp: 'breadboard',
        name: 'RGB LED Cathode ➔ GND Rail',
        role: 'Common ground return pin for Red, Green, and Blue LED elements'
      },
      {
        id: 'led_red',
        net: 'led',
        color: COLORS.orange,
        colorName: 'Orange',
        fromPin: 'ESP32 GPIO15',
        fromHole: 'Row 30, Col D',
        toPin: 'Red 220Ω Resistor',
        toHole: 'Row 46, Col B',
        from: { row: 30, col: 'D' },
        to: { row: 46, col: 'B' },
        fromComp: 'esp32',
        toComp: 'rgbLed',
        name: 'ESP32 GPIO15 ➔ Red Anode',
        role: 'Current-limited GPIO drive triggering Emergency Fire Alarm visual alert'
      },
      {
        id: 'led_green',
        net: 'led',
        color: COLORS.green,
        colorName: 'Green',
        fromPin: 'ESP32 GPIO16',
        fromHole: 'Row 31, Col D',
        toPin: 'Green 220Ω Resistor',
        toHole: 'Row 49, Col B',
        from: { row: 31, col: 'D' },
        to: { row: 49, col: 'B' },
        fromComp: 'esp32',
        toComp: 'rgbLed',
        name: 'ESP32 GPIO16 ➔ Green Anode',
        role: 'Current-limited GPIO drive triggering Doorbell chime notification'
      },
      {
        id: 'led_blue',
        net: 'led',
        color: COLORS.blue,
        colorName: 'Blue',
        fromPin: 'ESP32 GPIO17',
        fromHole: 'Row 32, Col D',
        toPin: 'Blue 220Ω Resistor',
        toHole: 'Row 48, Col B',
        from: { row: 32, col: 'D' },
        to: { row: 48, col: 'B' },
        fromComp: 'esp32',
        toComp: 'rgbLed',
        name: 'ESP32 GPIO17 ➔ Blue Anode',
        role: 'Current-limited GPIO drive indicating Ambient DSP Listening state'
      },

      // 5. MOTOR & 2N2222 DRIVER
      {
        id: 'motor_base',
        net: 'motor',
        color: COLORS.yellow,
        colorName: 'Yellow',
        fromPin: 'ESP32 GPIO18',
        fromHole: 'Row 34, Col G',
        toPin: '2N2222 Base (1kΩ)',
        toHole: 'Row 57, Col C',
        from: { row: 34, col: 'G' },
        to: { row: 57, col: 'C' },
        fromComp: 'esp32',
        toComp: 'transCircuit',
        name: 'ESP32 GPIO18 ➔ 2N2222 Base',
        role: 'PWM haptic control signal driving 2N2222 BJT into saturation'
      },
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
        fromComp: 'transCircuit',
        toComp: 'breadboard',
        name: '2N2222 Emitter ➔ GND Rail',
        role: 'Low-side ground reference completing motor 5V circuit upon saturation'
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
        fromComp: 'vibeMotor',
        toComp: 'breadboard',
        name: 'Motor (+) ➔ Bottom + 5V Rail',
        role: 'Dedicated 5V power feed for 10mm coin vibration motor'
      },
      {
        id: 'motor_ctrl',
        net: 'motor',
        color: COLORS.yellow,
        colorName: 'Yellow',
        fromPin: 'Motor (-) & 1N4148 Anode',
        fromHole: 'Row 56, Col D',
        toPin: '2N2222 Collector',
        toHole: 'Row 56, Col E',
        from: { row: 56, col: 'D' },
        to: { row: 56, col: 'E' },
        fromComp: 'vibeMotor',
        toComp: 'transCircuit',
        name: 'Motor (-) ➔ 2N2222 Collector',
        role: 'Switched low-side motor return clamped by 1N4148 flyback diode'
      },

      // 6. ACTIVE PIEZO BUZZER
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
        fromComp: 'buzzer',
        toComp: 'esp32',
        name: 'Buzzer (+) ➔ ESP32 GPIO14',
        role: 'Direct GPIO tone drive triggering developer acoustic feedback'
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
        fromComp: 'buzzer',
        toComp: 'breadboard',
        name: 'Buzzer (-) ➔ GND Rail',
        role: 'Ground return path for piezo sounder'
      }
    ];

    this.wireDefinitions = wireDefinitions;
    wireDefinitions.forEach(def => this.createJumperWire(def));
  }

  /**
   * Compute orthogonal Manhattan / PCB-style stepped route with filleted 90-degree corners.
   */
  computeManhattanCurve(pStart, pEnd, def) {
    // Discrete layer elevation based on net type to prevent collision
    const layerMap = {
      power: 1.15,
      ground: 1.15,
      i2s: 1.30,
      i2c: 1.45,
      motor: 1.60,
      led: 1.70,
      buzzer: 1.72
    };
    const baseElevation = layerMap[def.net] || 1.35;
    const routeY = Math.max(pStart.y, pEnd.y) + (baseElevation - this.breadboard.height);

    const rawPoints = [];
    rawPoints.push(pStart.clone());
    rawPoints.push(new THREE.Vector3(pStart.x, routeY, pStart.z));

    const dx = Math.abs(pStart.x - pEnd.x);
    const dz = Math.abs(pStart.z - pEnd.z);

    if (dx < 0.1) {
      // Same row (pure vertical drop along Z)
      // Up -> across in Z -> down (perfect 2-turn riser arch)
    } else if (dz < 0.1) {
      // Same column (pure horizontal drop along X)
      // Up -> across in X -> down (perfect 2-turn riser arch)
    } else {
      // 2D orthogonal stepped routing
      const isStartRail = Math.abs(pStart.z) > 1.8;
      const isEndRail = Math.abs(pEnd.z) > 1.8;

      let channelZ;
      if (isStartRail || isEndRail) {
        const railZ = isEndRail ? pEnd.z : pStart.z;
        channelZ = railZ > 0 ? (railZ - 0.35) : (railZ + 0.35);
      } else if (pStart.z < -0.4 && pEnd.z < -0.4) {
        channelZ = -1.65; // Top channel
      } else if (pStart.z > 0.4 && pEnd.z > 0.4) {
        channelZ = 1.65; // Bottom channel
      } else {
        channelZ = (pStart.z + pEnd.z) / 2; // Central trough
      }

      rawPoints.push(new THREE.Vector3(pStart.x, routeY, channelZ));
      rawPoints.push(new THREE.Vector3(pEnd.x, routeY, channelZ));
    }

    rawPoints.push(new THREE.Vector3(pEnd.x, routeY, pEnd.z));
    rawPoints.push(pEnd.clone());

    // Deduplicate consecutive waypoints that are closer than 0.05
    const cleanPoints = [];
    for (let i = 0; i < rawPoints.length; i++) {
      if (cleanPoints.length === 0 || cleanPoints[cleanPoints.length - 1].distanceTo(rawPoints[i]) > 0.05) {
        cleanPoints.push(rawPoints[i]);
      }
    }

    if (cleanPoints.length < 2) {
      return new THREE.LineCurve3(pStart, pEnd);
    }

    // Generate filleted points for rounded 90-degree corners
    const filletedPoints = [];
    filletedPoints.push(cleanPoints[0]);

    const filletDist = 0.16; // Radius of corner bend
    for (let i = 1; i < cleanPoints.length - 1; i++) {
      const prev = cleanPoints[i - 1];
      const curr = cleanPoints[i];
      const next = cleanPoints[i + 1];

      const distIn = curr.distanceTo(prev);
      const distOut = curr.distanceTo(next);

      if (distIn < 0.04 || distOut < 0.04) {
        filletedPoints.push(curr);
        continue;
      }

      const dirIn = new THREE.Vector3().subVectors(prev, curr).normalize();
      const dirOut = new THREE.Vector3().subVectors(next, curr).normalize();

      // Check if collinear
      const dot = dirIn.dot(dirOut);
      if (Math.abs(dot) > 0.98) {
        continue;
      }

      const dIn = Math.min(filletDist, distIn * 0.4);
      const dOut = Math.min(filletDist, distOut * 0.4);

      const pBefore = new THREE.Vector3().copy(curr).addScaledVector(dirIn, dIn);
      const pAfter = new THREE.Vector3().copy(curr).addScaledVector(dirOut, dOut);

      filletedPoints.push(pBefore);
      filletedPoints.push(pAfter);
    }
    filletedPoints.push(cleanPoints[cleanPoints.length - 1]);

    return new THREE.CatmullRomCurve3(filletedPoints, false, 'catmullrom', 0.05);
  }

  createJumperWire(def) {
    const pStart = this.breadboard.getHolePos(def.from);
    const pEnd = this.breadboard.getHolePos(def.to);

    const wireGroup = new THREE.Group();
    wireGroup.name = `Wire_${def.id}`;
    wireGroup.userData = {
      id: def.id,
      net: def.net,
      name: def.name,
      fromPin: def.fromPin,
      fromHole: def.fromHole,
      toPin: def.toPin,
      toHole: def.toHole,
      role: def.role,
      colorName: def.colorName,
      fromComp: def.fromComp,
      toComp: def.toComp
    };

    const bootMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.95, roughness: 0.15 });

    // Sturdy square terminal collar for clear insertion visibility
    const bootGeo = new THREE.BoxGeometry(0.16, 0.38, 0.16);
    const bootStart = new THREE.Mesh(bootGeo, bootMat);
    bootStart.position.set(pStart.x, pStart.y + 0.19, pStart.z);

    const bootEnd = new THREE.Mesh(bootGeo, bootMat);
    bootEnd.position.set(pEnd.x, pEnd.y + 0.19, pEnd.z);

    // Shiny nickel-plated pin entering hole
    const pinGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.24, 10);
    const pinStart = new THREE.Mesh(pinGeo, pinMat);
    pinStart.position.set(pStart.x, pStart.y, pStart.z);
    const pinEnd = new THREE.Mesh(pinGeo, pinMat);
    pinEnd.position.set(pEnd.x, pEnd.y, pEnd.z);

    // Compute Manhattan orthogonal stepped curve
    const curve = this.computeManhattanCurve(pStart, pEnd, def);
    const sampledPoints = curve.getPoints(50);
    // Crisp wire geometry
    const tubeGeo = new THREE.TubeGeometry(curve, 44, 0.075, 12, false);

    const wireMat = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: 0.35,
      metalness: 0.05,
      transparent: true,
      opacity: 1.0
    });

    const wireMesh = new THREE.Mesh(tubeGeo, wireMat);
    wireMesh.name = `WireMesh_${def.id}`;
    wireMesh.castShadow = true;
    wireMesh.receiveShadow = true;
    wireMesh.userData = {
      id: def.id,
      net: def.net,
      name: def.name,
      fromPin: def.fromPin,
      toPin: def.toPin,
      fromHole: def.fromHole,
      toHole: def.toHole,
      fromComp: def.fromComp,
      toComp: def.toComp,
      role: def.role,
      colorName: def.colorName,
      color: def.color
    };

    wireGroup.add(bootStart, bootEnd, pinStart, pinEnd, wireMesh);
    this.group.add(wireGroup);

    this.wireRecords.push({
      id: def.id,
      net: def.net,
      group: wireGroup,
      wireMesh,
      material: wireMat,
      baseColor: new THREE.Color(def.color),
      pStart: pStart.clone(),
      pEnd: pEnd.clone(),
      origPStart: pStart.clone(),
      origPEnd: pEnd.clone(),
      fromComp: def.fromComp,
      toComp: def.toComp,
      curve,
      sampledPoints,
      bootStart,
      bootEnd,
      pinStart,
      pinEnd,
      def
    });
  }

  updateExplosion(factor, liftMap) {
    this.wireRecords.forEach(w => {
      const liftStart = liftMap[w.fromComp] || 0;
      const liftEnd = liftMap[w.toComp] || 0;

      const pStart = w.origPStart.clone();
      pStart.y += liftStart * factor;

      const pEnd = w.origPEnd.clone();
      pEnd.y += liftEnd * factor;

      w.pStart.copy(pStart);
      w.pEnd.copy(pEnd);

      w.curve = this.computeManhattanCurve(pStart, pEnd, w.def);
      w.sampledPoints = w.curve.getPoints(50);
      w.wireMesh.geometry.dispose();
      w.wireMesh.geometry = new THREE.TubeGeometry(w.curve, 44, 0.075, 12, false);

      w.bootStart.position.set(pStart.x, pStart.y + 0.19, pStart.z);
      w.bootEnd.position.set(pEnd.x, pEnd.y + 0.19, pEnd.z);
      w.pinStart.position.set(pStart.x, pStart.y, pStart.z);
      w.pinEnd.position.set(pEnd.x, pEnd.y, pEnd.z);

      if (this.highlightedPin === w.id && this.targetGroup && this.targetGroup.visible) {
        this.startMarker.position.copy(pStart);
        this.endMarker.position.copy(pEnd);
      }
    });
  }

  getSignalPath(key) {
    const paths = {
      'gpio18': 'ESP32 GPIO18 (Pin 34) ➔ 1kΩ Resistor ➔ 2N2222 Base ➔ Collector ➔ Vibration Motor (-) ➔ (+) 5V Rail',
      'motor': 'ESP32 GPIO18 ➔ 1kΩ Resistor ➔ 2N2222 Base ➔ Collector ➔ Vibration Motor (-) ➔ (+) 5V Rail',
      'i2s': 'INMP441 MEMS Mic ➔ SCK/WS/SD (GPIO5/4/6) ➔ ESP32 DMA Buffer ➔ TinyML Neural Model',
      'i2c': 'ESP32 GPIO21/22 (SDA/SCL) ➔ SSD1306 OLED 128x64 Framebuffer',
      'led': 'ESP32 GPIO15/16/17 ➔ 220Ω Resistors ➔ RGB LED Anodes ➔ Common Cathode GND',
      'buzzer': 'ESP32 GPIO14 ➔ Active Buzzer (+) ➔ (-) GND Rail',
      'power': 'ESP32 USB VBUS ➔ 5V Rail (Motor/Buzzer) | 3.3V LDO ➔ 3.3V Rail (Mic/OLED)'
    };
    return paths[key] || 'Direct breadboard jumper connection';
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
      'motor': ['motor_ctrl', 'driver_emitter', 'motor_pwr'],
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

    // Glow the selected wire in vibrant cyan, dim all other wires to 5% opacity (Connection Focus Mode)
    this.wireRecords.forEach(w => {
      if (w.id === wireId) {
        w.group.visible = true;
        w.material.color.setHex(0x00f0ff);
        w.material.emissive.setHex(0x00f0ff);
        w.material.emissiveIntensity = 1.6;
        w.material.opacity = 1.0;
        w.material.transparent = false;
        w.material.depthWrite = true;
        w.group.children.forEach(c => c.visible = true);
      } else {
        w.group.visible = true;
        w.material.color.setHex(0x1e293b);
        w.material.opacity = 0.05; // Drop to 5% transparent (nearly invisible)
        w.material.transparent = true;
        w.material.depthWrite = false;
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

  /**
   * Isolate signal connection by pin or signal name (e.g. 'GPIO4', 'WS', 'GPIO18', 'SCK')
   * @param {string} pinQuery
   * @returns {Object|null} pathway details
   */
  isolatePin(pinQuery) {
    if (!pinQuery) {
      this.resetHighlight();
      return null;
    }
    const q = pinQuery.toLowerCase().trim();

    // Map common aliases
    const aliasMap = {
      'gpio4': 'inmp_ws',
      'ws': 'inmp_ws',
      'gpio5': 'inmp_sck',
      'sck': 'inmp_sck',
      'gpio6': 'inmp_sd',
      'sd': 'inmp_sd',
      'gpio14': 'buzzer_sig',
      'buzzer': 'buzzer_sig',
      'gpio15': 'led_red',
      'red': 'led_red',
      'gpio16': 'led_green',
      'green': 'led_green',
      'gpio17': 'led_blue',
      'blue': 'led_blue',
      'gpio18': 'motor_base',
      'motor_base': 'motor_base',
      'motor': 'motor_ctrl',
      'gpio21': 'oled_sda',
      'sda': 'oled_sda',
      'gpio22': 'oled_scl',
      'scl': 'oled_scl',
      '3v3': 'pwr_3v3',
      '5v': 'pwr_5v',
      'gnd': 'gnd_top'
    };

    let targetId = aliasMap[q];
    if (!targetId) {
      const found = this.wireRecords.find(w =>
        w.id.toLowerCase() === q ||
        w.fromPin.toLowerCase().includes(q) ||
        w.toPin.toLowerCase().includes(q)
      );
      if (found) targetId = found.id;
    }

    if (!targetId) return null;

    this.highlightConnection(targetId);
    return this.getPinPathway(targetId);
  }

  getPinPathway(wireId) {
    const record = this.wireRecords.find(w => w.id === wireId);
    if (!record) return null;

    let espPin = 'ESP32 Pin';
    let destPin = 'Destination Pin';
    let destComp = 'Destination Component';

    if (record.fromPin.includes('ESP32')) {
      espPin = record.fromPin;
      destPin = record.toPin;
      destComp = record.toComp;
    } else if (record.toPin.includes('ESP32')) {
      espPin = record.toPin;
      destPin = record.fromPin;
      destComp = record.fromComp;
    } else {
      espPin = record.fromPin;
      destPin = record.toPin;
      destComp = record.toComp;
    }

    const compDisplayNames = {
      esp32: 'ESP32-S3 DevKitC-1',
      inmp441: 'INMP441 MEMS Microphone',
      oled: 'SSD1306 0.96" OLED Display',
      rgbLed: 'RGB Status Indicator LED',
      vibeMotor: '10mm Coin Vibration Motor',
      transCircuit: '2N2222 BJT Motor Driver',
      buzzer: 'Active 5V Piezo Buzzer',
      breadboard: 'Breadboard Power/GND Rails'
    };

    return {
      espPin,
      wireName: `${record.colorName} Wire (${record.fromHole} ➔ ${record.toHole})`,
      destComp: compDisplayNames[destComp] || destComp,
      destPin,
      purpose: record.role || record.name,
      net: record.net,
      wire: record
    };
  }

  getSignalPath(key) {
    const signalMap = {
      'i2s': 'ESP32 (GPIO4/5/6) ➔ INMP441 MEMS (WS, SCK, SD) [16kHz 24-bit I²S DMA]',
      'gpio18': 'ESP32 (GPIO18) ➔ 1kΩ Resistor ➔ 2N2222 Base ➔ 5V Coin Motor (+1N4148 Clamp)',
      'motor': 'ESP32 (GPIO18) ➔ 1kΩ Resistor ➔ 2N2222 Base ➔ 5V Coin Motor (+1N4148 Clamp)',
      'i2c': 'ESP32 (GPIO21/22) ➔ SSD1306 OLED (SDA, SCL) [400kHz I²C Fast Mode]',
      'buzzer': 'ESP32 (GPIO14) ➔ 5V Active Piezo Buzzer ➔ Ground Bus',
      'power': 'USB 5V VBUS + 3.3V Regulated Rails with 100µF Low-ESR Decoupling Capacitors',
      'led': 'ESP32 (GPIO15/16/17) ➔ 220Ω Current-Limiting Resistors ➔ Common Cathode RGB LED'
    };
    return signalMap[key] || `Signal Bus [${key}] active across breadboard`;
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
      // Advance electron along wire curve (pulse faster on hovered/selected wire)
      const isHighlightedWire = (this.highlightedPin === el.wire.id);
      const speedMult = isHighlightedWire ? 2.5 : 1.0;
      el.t = (el.t + el.speed * speedMult * deltaTime) % 1.0;

      const isWireActive = (this.activeFilter === 'all' || el.wire.net === this.activeFilter);
      if ((isWireActive || isHighlightedWire) && el.wire.sampledPoints) {
        const idx = Math.min(el.wire.sampledPoints.length - 1, Math.floor(el.t * el.wire.sampledPoints.length));
        dummy.position.copy(el.wire.sampledPoints[idx]);
        const s = isHighlightedWire ? 1.7 : 1.0;
        dummy.scale.set(s, s, s);
      } else {
        dummy.scale.set(0, 0, 0);
      }

      dummy.updateMatrix();
      this.electronMesh.setMatrixAt(el.meshIdx, dummy.matrix);
    });

    this.electronMesh.instanceMatrix.needsUpdate = true;
  }
}
