import * as THREE from 'three';

export class OLEDDisplay {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'SSD1306_OLED_Display';
    this.group.userData = {
      name: '0.96" I2C OLED Display (SSD1306)',
      category: 'VISUAL HUD SCREEN',
      desc: 'High-contrast 128×64 monochrome organic LED display module driven over I²C (SDA/SCL). Displays real-time sound event classification, confidence percentages, audio frequency analysis, and device operational status.',
      specs: [
        '128 × 64 Pixel Resolution',
        'SSD1306 I2C Controller',
        '0.96 Inch Diagonal',
        'SDA: GPIO21 • SCL: GPIO22',
        '3.3V Ultra-Low Power'
      ]
    };

    this.displayState = 'listening';
    this.stateData = null;
    this.animTime = 0;

    // Occupies rows 37 to 40 at column A/B
    this.pins = [
      { name: 'GND', row: 37, col: 'A' },
      { name: 'VCC', row: 38, col: 'A' },
      { name: 'SCL', row: 39, col: 'A' },
      { name: 'SDA', row: 40, col: 'A' }
    ];

    this.init();
  }

  init() {
    this.createPCB();
    this.createScreen();
    this.createHeaderPins();
  }

  createPCB() {
    // 0.96" OLED breakout board: 2.7cm x 2.7cm x 0.16cm
    const length = 2.7;
    const width = 2.7;
    const height = 0.16;

    const pcbGeo = new THREE.BoxGeometry(length, height, width);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Classic blue PCB
      roughness: 0.35,
      metalness: 0.2
    });

    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;

    // Position above ESP32 at rows 37-40, column A/B
    const startX = this.breadboard.getRowX(37);
    const endX = this.breadboard.getRowX(40);
    const posX = (startX + endX) / 2;
    const posZ = this.breadboard.getColZ('A') - 0.4;
    const posY = this.breadboard.height + 0.65;

    this.group.position.set(posX, posY, posZ);
    this.group.add(pcb);
    this.pcb = pcb;
  }

  createScreen() {
    // High-resolution 2D dynamic canvas for the 128x64 OLED screen
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 256;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = false; // Prevents blur
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    // Glass panel with screen
    const screenGeo = new THREE.PlaneGeometry(2.3, 1.3);
    const screenMat = new THREE.MeshPhysicalMaterial({
      map: this.texture,
      roughness: 0.1,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      emissive: 0x00f0ff,
      emissiveMap: this.texture,
      emissiveIntensity: 0.9
    });

    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.rotation.x = -Math.PI / 2;
    screen.position.set(0, 0.09, -0.2);
    this.group.add(screen);

    // Bezel border
    const bezelGeo = new THREE.PlaneGeometry(2.4, 1.4);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8 });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.rotation.x = -Math.PI / 2;
    bezel.position.set(0, 0.089, -0.2);
    this.group.add(bezel);

    this.drawScreen();
  }

  createHeaderPins() {
    const pinGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2
    });

    const headerBlockGeo = new THREE.BoxGeometry(1.2, 0.25, 0.25);
    const headerBlockMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
    const block = new THREE.Mesh(headerBlockGeo, headerBlockMat);
    block.position.set(0, -0.2, 1.0);
    this.group.add(block);

    this.pins.forEach((p) => {
      const pinX = this.breadboard.getRowX(p.row) - this.group.position.x;
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(pinX, -0.4, 1.0);
      this.group.add(pin);
    });
  }

  setState(state, data = null) {
    this.displayState = state;
    this.stateData = data;
    this.drawScreen();
  }

  drawScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear OLED black background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Top status bar
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('ECHOSENSE AI', 20, 30);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('ESP32-S3 TinyML', w - 165, 30);

    // Thin separator
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 42);
    ctx.lineTo(w - 20, 42);
    ctx.stroke();

    if (this.displayState === 'listening') {
      // Idle / Ambient audio capture FFT waveform
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('LISTENING...', 20, 80);

      ctx.fillStyle = '#64748b';
      ctx.font = '16px monospace';
      ctx.fillText('Ambient SPL: ~42 dB • 16kHz I2S', 20, 110);

      // Draw real-time animated audio spectrum visualizer
      const bars = 28;
      const barW = (w - 40) / bars - 4;
      ctx.fillStyle = '#00f0ff';

      for (let i = 0; i < bars; i++) {
        const freqOffset = i * 0.4 + this.animTime * 4;
        const wave = Math.sin(freqOffset) * 0.5 + Math.cos(freqOffset * 1.5) * 0.3;
        const barH = Math.max(6, (wave + 0.8) * 45);
        const bx = 20 + i * (barW + 4);
        const by = h - 25 - barH;

        ctx.fillRect(bx, by, barW, barH);
      }
    } else if (this.displayState === 'fire') {
      // FIRE ALARM ALERT SCREEN
      const flash = Math.sin(this.animTime * 12) > 0;
      ctx.fillStyle = flash ? '#ef4444' : '#fee2e2';
      ctx.font = 'bold 32px monospace';
      ctx.fillText('⚠️ FIRE ALARM DETECTED', 20, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('CRITICAL EMERGENCY PRIORITY 1', 20, 130);

      ctx.fillStyle = '#fca5a5';
      ctx.font = '18px monospace';
      ctx.fillText('Freq: 3,120 Hz Pulsed • SPL: 94 dB', 20, 170);
      ctx.fillText('Confidence: 99.4% • Haptic: CONTINUOUS', 20, 205);

      // Warning border box
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 50, w - 20, h - 65);
    } else if (this.displayState === 'doorbell') {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 30px monospace';
      ctx.fillText('🔔 DOORBELL DETECTED', 20, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('Front Door Acoustic Chime', 20, 130);

      ctx.fillStyle = '#bae6fd';
      ctx.font = '18px monospace';
      ctx.fillText('Harmonic: 660 Hz / 550 Hz Ding-Dong', 20, 170);
      ctx.fillText('Confidence: 98.7% • Haptic: 2-PULSE', 20, 205);
    } else if (this.displayState === 'baby') {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 30px monospace';
      ctx.fillText('👶 BABY CRYING DETECTED', 20, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('Infant Distress Pitch Pattern', 20, 130);

      ctx.fillStyle = '#fde68a';
      ctx.font = '18px monospace';
      ctx.fillText('Modulation: 450 - 620 Hz Harmonic', 20, 170);
      ctx.fillText('Confidence: 95.8% • Haptic: 3-PULSE', 20, 205);
    } else if (this.displayState === 'horn') {
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 30px monospace';
      ctx.fillText('🚗 VEHICLE HORN DETECTED', 20, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('Automotive Dual-Tone Blast', 20, 130);

      ctx.fillStyle = '#fed7aa';
      ctx.font = '18px monospace';
      ctx.fillText('Acoustic: 400 Hz & 500 Hz Dissonance', 20, 170);
      ctx.fillText('Confidence: 99.1% • Haptic: LONG PULSE', 20, 205);
    }

    this.texture.needsUpdate = true;
  }

  update(deltaTime) {
    this.animTime += deltaTime;
    // Throttle screen texture updates to ~20 FPS (50ms interval) to eliminate GPU texture upload stalls
    this.lastDrawTime = (this.lastDrawTime || 0) + deltaTime;
    if (this.lastDrawTime >= 0.05) {
      this.lastDrawTime = 0;
      // Only animate dynamic screens (listening FFT spectrum or fire alarm flash)
      if (this.displayState === 'listening' || this.displayState === 'fire') {
        this.drawScreen();
      }
    }
  }
}
