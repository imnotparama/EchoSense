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

    // Silkscreen (2048x1536 ultra-sharp)
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1536;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#4a154b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gold borders and text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 110px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INMP441', canvas.width / 2, 260);

    ctx.font = 'bold 64px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('I2S MEMS MIC', canvas.width / 2, 380);

    // Pin labels along bottom edge with high-contrast colored badges
    const pinConfigs = [
      { name: 'VDD', color: '#ef4444' },
      { name: 'GND', color: '#64748b' },
      { name: 'SD', color: '#10b981' },
      { name: 'WS', color: '#10b981' },
      { name: 'SCK', color: '#10b981' },
      { name: 'L/R', color: '#64748b' }
    ];

    const startPinX = 200;
    const pinSpacing = (canvas.width - 400) / (pinConfigs.length - 1);

    pinConfigs.forEach((conf, i) => {
      const x = startPinX + i * pinSpacing;
      // Badge background
      ctx.fillStyle = conf.color;
      ctx.beginPath();
      ctx.roundRect(x - 90, canvas.height - 240, 180, 120, 20);
      ctx.fill();

      // Pin label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px monospace';
      ctx.fillText(conf.name, x, canvas.height - 155);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;

    const silkGeo = new THREE.PlaneGeometry(length - 0.05, width - 0.05);
    const silkMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.35, metalness: 0.1 });
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
