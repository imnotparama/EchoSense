import * as THREE from 'three';

export class ESP32S3 {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'ESP32_S3';
    this.group.userData = {
      name: 'ESP32-S3 DevKitC-1',
      category: 'MICROCONTROLLER',
      desc: 'Dual-core Xtensa® LX7 32-bit MCU @ 240MHz with 512KB SRAM, 8MB PSRAM, 16MB Flash, Wi-Fi 4, BLE 5.0, and hardware vector extensions for on-device TinyML audio neural networks.',
      specs: [
        'Dual-Core 240 MHz',
        'TinyML DSP Accel',
        'Native USB-C OTG',
        '45 Programmable GPIOs',
        'Hardware I2S & I2C'
      ]
    };

    // DevKitC-1 spans 22 pins along breadboard rows 21 to 42
    this.startRow = 21;
    this.endRow = 42;
    this.pinCount = 22; // per side

    this.pinPositions = {};
    this.init();
  }

  init() {
    this.createPCB();
    this.createRFShield();
    this.createUSBConnector();
    this.createButtonsAndLEDs();
    this.createHeaderPins();
    this.mapPins();
  }

  createPCB() {
    // Standard DevKitC-1 dimensions: 54mm x 28mm x 1.6mm
    const pcbLength = (this.pinCount - 1) * this.breadboard.pitch + 0.6; // ~5.9 cm
    const pcbWidth = 2.7; // 27mm
    const pcbHeight = 0.16;

    const pcbGeo = new THREE.BoxGeometry(pcbLength, pcbHeight, pcbWidth);

    // Dark matte solder mask with gold traces
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x121720,
      roughness: 0.35,
      metalness: 0.15
    });

    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;
    pcb.receiveShadow = true;

    // Position ESP32 PCB elevated just above breadboard (resting on pin plastic headers)
    const yPos = this.breadboard.height + 0.7; // ~7mm standoff
    const centerX = (this.breadboard.getRowX(this.startRow) + this.breadboard.getRowX(this.endRow)) / 2;

    this.group.position.set(centerX, yPos, 0);
    this.group.add(pcb);
    this.pcb = pcb;

    // Golden edge silkscreen pads
    this.createSilkscreen(pcbLength, pcbWidth);
  }

  createSilkscreen(w, d) {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // Dark matte PCB surface
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Silkscreen white text & logos
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 68px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESP32-S3-DevKitC-1', canvas.width / 2, 220);

    ctx.font = 'bold 42px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('TinyML Sound Awareness Engine • Espressif Systems', canvas.width / 2, 290);

    // Gold contact pads and Pin Labels along top & bottom edges
    const numPins = 22;
    const padW = 72;
    const padH = 120;
    const startX = 220;
    const spacing = (canvas.width - 440) / (numPins - 1);

    // Active pins color definitions
    const topPinConfig = {
      0: { label: '3V3', color: '#ef4444' },
      1: { label: 'GND', color: '#64748b' },
      4: { label: 'IO4 (WS)', color: '#10b981' },
      5: { label: 'IO5 (SCK)', color: '#10b981' },
      6: { label: 'IO6 (SD)', color: '#10b981' },
      9: { label: 'IO15 (R)', color: '#3b82f6' },
      10: { label: 'IO16 (G)', color: '#3b82f6' },
      11: { label: 'IO17 (B)', color: '#3b82f6' },
      17: { label: 'IO21 (SDA)', color: '#14b8a6' },
      18: { label: 'IO22 (SCL)', color: '#14b8a6' }
    };

    const botPinConfig = {
      4: { label: 'IO8 (Fire)', color: '#a855f7' },
      5: { label: 'IO9 (Bell)', color: '#a855f7' },
      6: { label: 'IO10 (Baby)', color: '#a855f7' },
      7: { label: 'IO11 (Horn)', color: '#a855f7' },
      13: { label: 'IO18 (Vibe)', color: '#eab308' },
      14: { label: 'IO14 (Buzz)', color: '#38bdf8' },
      21: { label: '5V (USB)', color: '#ef4444' }
    };

    for (let i = 0; i < numPins; i++) {
      const x = startX + i * spacing;

      // Top header pads
      ctx.fillStyle = '#f59e0b'; // Gold contact pad
      ctx.fillRect(x - padW / 2, 25, padW, padH);

      // Top pin label & badge
      const topConf = topPinConfig[i];
      if (topConf) {
        ctx.fillStyle = topConf.color;
        ctx.beginPath();
        ctx.roundRect(x - 65, 160, 130, 48, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(topConf.label, x, 194);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`P${i}`, x, 190);
      }

      // Bottom header pads
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - padW / 2, canvas.height - 145, padW, padH);

      // Bottom pin label & badge
      const botConf = botPinConfig[i];
      if (botConf) {
        ctx.fillStyle = botConf.color;
        ctx.beginPath();
        ctx.roundRect(x - 65, canvas.height - 215, 130, 48, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(botConf.label, x, canvas.height - 181);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`P${i}`, x, canvas.height - 180);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false; // Zero downscaling blur!
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;

    const silkGeo = new THREE.PlaneGeometry(w - 0.05, d - 0.05);
    const silkMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.15
    });

    const silk = new THREE.Mesh(silkGeo, silkMat);
    silk.rotation.x = -Math.PI / 2;
    silk.position.y = 0.081;
    this.group.add(silk);
  }

  createRFShield() {
    // Metal RF shielding can (ESP32-S3-WROOM-1 module)
    const canLength = 2.4;
    const canWidth = 1.8;
    const canHeight = 0.32;

    const canGeo = new THREE.BoxGeometry(canLength, canHeight, canWidth);
    const canMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.88,
      roughness: 0.22
    });

    const can = new THREE.Mesh(canGeo, canMat);
    can.position.set(-0.6, 0.24, 0);
    can.castShadow = true;
    can.receiveShadow = true;
    this.group.add(can);

    // Engraved text on RF shield
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESP32-S3', 512, 320);
    ctx.font = 'bold 52px monospace';
    ctx.fillText('WROOM-1', 512, 410);

    ctx.font = '36px monospace';
    ctx.fillText('FCC ID: 2AC7Z-ESPS3WROOM1', 512, 540);
    ctx.fillText('CE • RoHS • 16MB FLASH', 512, 610);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    const labelGeo = new THREE.PlaneGeometry(canLength - 0.1, canWidth - 0.1);
    const labelMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.8
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.rotation.x = -Math.PI / 2;
    label.position.set(-0.6, 0.401, 0);
    this.group.add(label);

    // PCB Antenna trace area (distinct black/gold pattern on left of shield)
    const antGeo = new THREE.BoxGeometry(0.8, 0.16, 1.8);
    const antMat = new THREE.MeshStandardMaterial({
      color: 0x090d12,
      roughness: 0.5
    });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.set(-2.25, 0.08, 0);
    this.group.add(ant);
  }

  createUSBConnector() {
    // USB-C Connector facing right (towards breadboard center/front)
    const usbLength = 0.9;
    const usbWidth = 0.8;
    const usbHeight = 0.35;

    const usbGeo = new THREE.BoxGeometry(usbLength, usbHeight, usbWidth);
    const usbMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15
    });

    const usb = new THREE.Mesh(usbGeo, usbMat);
    usb.position.set(2.4, 0.25, 0);
    usb.castShadow = true;
    this.group.add(usb);

    // Inner USB-C cavity & tongue
    const cavityGeo = new THREE.BoxGeometry(0.1, 0.18, 0.6);
    const cavityMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8 });
    const cavity = new THREE.Mesh(cavityGeo, cavityMat);
    cavity.position.set(2.81, 0.25, 0);
    this.group.add(cavity);
  }

  createButtonsAndLEDs() {
    // BOOT and RESET buttons
    const btnMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });

    const btnGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.12, 16);
    const baseGeo = new THREE.BoxGeometry(0.3, 0.1, 0.25);

    // Reset Button
    const rstBase = new THREE.Mesh(baseGeo, baseMat);
    rstBase.position.set(1.4, 0.12, -0.7);
    const rstBtn = new THREE.Mesh(btnGeo, btnMat);
    rstBtn.position.set(1.4, 0.22, -0.7);
    this.group.add(rstBase, rstBtn);

    // Boot Button
    const bootBase = new THREE.Mesh(baseGeo, baseMat);
    bootBase.position.set(1.4, 0.12, 0.7);
    const bootBtn = new THREE.Mesh(btnGeo, btnMat);
    bootBtn.position.set(1.4, 0.22, 0.7);
    this.group.add(bootBase, bootBtn);

    // Power Indicator LED (Red)
    const pwrLedGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);
    const pwrLedMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const pwrLed = new THREE.Mesh(pwrLedGeo, pwrLedMat);
    pwrLed.position.set(1.8, 0.12, -0.6);
    this.group.add(pwrLed);

    // RGB / Status LED (WS2812B or IO indicator)
    const statusLedMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const statusLed = new THREE.Mesh(pwrLedGeo, statusLedMat);
    statusLed.position.set(1.8, 0.12, 0.6);
    this.group.add(statusLed);
  }

  createHeaderPins() {
    // 2x 22-pin header strips connecting ESP32 to breadboard row E (top) and row F (bottom)
    const pinGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Gold plated
      metalness: 0.9,
      roughness: 0.2
    });

    const headerBlockGeo = new THREE.BoxGeometry(
      (this.pinCount - 1) * this.breadboard.pitch + 0.3,
      0.25,
      0.25
    );
    const headerBlockMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7
    });

    // Top header block (Z = -1.0)
    const topBlock = new THREE.Mesh(headerBlockGeo, headerBlockMat);
    topBlock.position.set(0, -0.2, -1.0);
    this.group.add(topBlock);

    // Bottom header block (Z = 1.0)
    const botBlock = new THREE.Mesh(headerBlockGeo, headerBlockMat);
    botBlock.position.set(0, -0.2, 1.0);
    this.group.add(botBlock);

    // Individual pins
    for (let r = this.startRow; r <= this.endRow; r++) {
      const relX = this.breadboard.getRowX(r) - this.group.position.x;

      // Top pin (into breadboard row E)
      const pinTop = new THREE.Mesh(pinGeo, pinMat);
      pinTop.position.set(relX, -0.4, -1.0);
      this.group.add(pinTop);

      // Bottom pin (into breadboard row F)
      const pinBot = new THREE.Mesh(pinGeo, pinMat);
      pinBot.position.set(relX, -0.4, 1.0);
      this.group.add(pinBot);
    }
  }

  mapPins() {
    // Map breadboard rows occupied by ESP32 to pin names
    // Top side: Row E (Z = -0.45), Bottom side: Row F (Z = 0.45)
    // Row 21 to 42 (22 pins per side)
    // We map functional pins to specific breadboard rows:
    this.pinMap = {
      // 3.3V power output
      '3V3': { row: 21, col: 'E', name: '3.3V Out' },
      // GND
      'GND': { row: 22, col: 'E', name: 'GND' },
      // 5V / VBUS (USB 5V for motor)
      '5V': { row: 42, col: 'F', name: '5V (VBUS)' },

      // I2S INMP441 pins
      'GPIO4': { row: 25, col: 'E', name: 'GPIO4 (I2S WS)' },
      'GPIO5': { row: 26, col: 'E', name: 'GPIO5 (I2S SCK)' },
      'GPIO6': { row: 27, col: 'E', name: 'GPIO6 (I2S SD)' },

      // RGB LED pins
      'GPIO15': { row: 30, col: 'E', name: 'GPIO15 (LED Red)' },
      'GPIO16': { row: 31, col: 'E', name: 'GPIO16 (LED Green)' },
      'GPIO17': { row: 32, col: 'E', name: 'GPIO17 (LED Blue)' },

      // Vibration Motor Transistor Base
      'GPIO18': { row: 34, col: 'F', name: 'GPIO18 (Motor Base)' },

      // Developer Active Buzzer
      'GPIO14': { row: 35, col: 'F', name: 'GPIO14 (Active Buzzer)' },

      // OLED I2C pins
      'GPIO21': { row: 38, col: 'E', name: 'GPIO21 (OLED SDA)' },
      'GPIO22': { row: 39, col: 'E', name: 'GPIO22 (OLED SCL)' },

      // Tactile Button inputs (INPUT_PULLUP)
      'GPIO8': { row: 25, col: 'F', name: 'GPIO8 (Fire Alarm Button)' },
      'GPIO9': { row: 26, col: 'F', name: 'GPIO9 (Doorbell Button)' },
      'GPIO10': { row: 27, col: 'F', name: 'GPIO10 (Baby Cry Button)' },
      'GPIO11': { row: 28, col: 'F', name: 'GPIO11 (Car Horn Button)' }
    };
  }

  getPinBreadboardHole(pinKey) {
    const pin = this.pinMap[pinKey];
    if (!pin) return null;
    return { row: pin.row, col: pin.col };
  }
}
