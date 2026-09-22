import * as THREE from 'three';

export class INMP441 {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'INMP441_Microphone';
    this.group.userData = {
      name: 'INMP441 I2S Microphone',
      category: 'AUDIO SENSOR',
      desc: 'High-performance, low-power, digital-output, omnidirectional MEMS microphone with bottom port and integrated I2S interface. Captures 24-bit studio-grade audio directly for TinyML neural feature extraction without an external analog codec.',
      specs: [
        '61 dBA SNR',
        '-26 dBFS Sensitivity',
        '60 Hz – 15 kHz Bandwidth',
        'Direct 24-bit I2S Bus',
        'Ultra-low 1.4 mA Draw'
      ]
    };

    // Positioned at top-left of ESP32, spanning rows 8 to 13 at column B
    this.pins = [
      { name: 'VDD', row: 8, col: 'B' },
      { name: 'GND', row: 9, col: 'B' },
      { name: 'SD',  row: 10, col: 'B' },
      { name: 'WS',  row: 11, col: 'B' },
      { name: 'SCK', row: 12, col: 'B' },
      { name: 'L/R', row: 13, col: 'B' }
    ];

    this.init();
  }

  init() {
    this.createPCB();
    this.createSensorAndPort();
    this.createHeaderPins();
  }

  createPCB() {
    // Breakout dimensions: ~1.8cm x 1.4cm x 0.16cm
    const length = 1.8;
    const width = 1.4;
    const height = 0.16;

    const pcbGeo = new THREE.BoxGeometry(length, height, width);
    // Purple solder mask (authentic INMP441 breakout color)
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x4a154b, // Deep purple
      roughness: 0.35,
      metalness: 0.2
    });

    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;
    pcb.receiveShadow = true;

    // Position centered over rows 8-13 at column B
    const startX = this.breadboard.getRowX(8);
    const endX = this.breadboard.getRowX(13);
    const centerX = (startX + endX) / 2;
    const centerZ = this.breadboard.getColZ('B') - 0.4;
    const yPos = this.breadboard.height + 0.6;

    this.group.position.set(centerX, yPos, centerZ);
    this.group.add(pcb);

    // Silkscreen
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#4a154b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gold borders and text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INMP441', canvas.width / 2, 60);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('I2S MIC', canvas.width / 2, 85);

    // Pin labels along bottom edge
    const pinNames = ['VDD', 'GND', 'SD', 'WS', 'SCK', 'L/R'];
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#cbd5e1';
    const startPinX = 55;
    const pinSpacing = (canvas.width - 110) / 5;

    pinNames.forEach((name, i) => {
      ctx.fillText(name, startPinX + i * pinSpacing, canvas.height - 25);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const silkGeo = new THREE.PlaneGeometry(length - 0.05, width - 0.05);
    const silkMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4 });
    const silk = new THREE.Mesh(silkGeo, silkMat);
    silk.rotation.x = -Math.PI / 2;
    silk.position.y = height / 2 + 0.005;
    this.group.add(silk);
  }

  createSensorAndPort() {
    // Gold acoustic sound port ring in center
    const ringGeo = new THREE.RingGeometry(0.08, 0.16, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Gold
      metalness: 0.95,
      roughness: 0.1
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.09, -0.15);
    this.group.add(ring);

    // Sound port hole
    const holeGeo = new THREE.CircleGeometry(0.08, 24);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(0, 0.091, -0.15);
    this.group.add(hole);

    // Surface-mount MEMS package (metallic square chip)
    const chipGeo = new THREE.BoxGeometry(0.35, 0.12, 0.28);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      metalness: 0.9,
      roughness: 0.15
    });
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(0.45, 0.14, -0.15);
    this.group.add(chip);
  }

  createHeaderPins() {
    const pinGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2
    });

    const headerBlockGeo = new THREE.BoxGeometry(1.6, 0.25, 0.25);
    const headerBlockMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
    const block = new THREE.Mesh(headerBlockGeo, headerBlockMat);
    block.position.set(0, -0.2, 0.4);
    this.group.add(block);

    // 6 pins plugging into breadboard column B
    this.pins.forEach((p) => {
      const pinX = this.breadboard.getRowX(p.row) - this.group.position.x;
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(pinX, -0.4, 0.4);
      this.group.add(pin);
    });
  }

  getPinPos(pinName) {
    const p = this.pins.find(pin => pin.name === pinName);
    if (!p) return null;
    return this.breadboard.getHolePos({ row: p.row, col: p.col });
  }
}
