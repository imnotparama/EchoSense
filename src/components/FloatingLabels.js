import * as THREE from 'three';

export class FloatingLabels {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   * @param {THREE.Camera} camera
   */
  constructor(breadboard, camera) {
    this.breadboard = breadboard;
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.name = 'Floating_3D_Labels';

    this.labels = [];
    this.isVisible = true;

    this.init();
  }

  init() {
    // 1. Component High-Level Engineering Callouts
    const componentLabels = [
      {
        text: 'ESP32-S3 DevKitC-1',
        sub: 'Dual-Core 240MHz • TinyML DSP',
        anchor: new THREE.Vector3(0.5, this.breadboard.height + 1.2, 0),
        offset: new THREE.Vector3(0, 3.2, -1.8),
        color: '#00f0ff'
      },
      {
        text: '0.96" SSD1306 OLED',
        sub: 'I2C 128x64 HUD Display',
        anchor: new THREE.Vector3(-1.0, this.breadboard.height + 1.1, -1.3),
        offset: new THREE.Vector3(-1.2, 3.6, -3.2),
        color: '#38bdf8'
      },
      {
        text: 'INMP441 I2S Mic',
        sub: '24-bit MEMS Studio Audio',
        anchor: new THREE.Vector3(-5.5, this.breadboard.height + 1.0, -1.3),
        offset: new THREE.Vector3(-6.2, 3.2, -2.8),
        color: '#10b981'
      },
      {
        text: 'RGB Status LED',
        sub: 'Common Cathode (5mm Diffused)',
        anchor: new THREE.Vector3(4.0, this.breadboard.height + 1.3, -1.0),
        offset: new THREE.Vector3(4.8, 3.4, -2.2),
        color: '#f43f5e'
      },
      {
        text: '10mm Vibration Motor',
        sub: '5V ERM Haptic Actuator',
        anchor: new THREE.Vector3(6.1, this.breadboard.height + 0.5, 0.9),
        offset: new THREE.Vector3(7.4, 2.8, 1.8),
        color: '#eab308'
      },
      {
        text: '2N2222 Driver & 1N4148',
        sub: 'Low-Side BJT + Flyback Diode',
        anchor: new THREE.Vector3(6.3, this.breadboard.height + 0.6, -0.5),
        offset: new THREE.Vector3(7.2, 2.6, -1.2),
        color: '#a855f7'
      },
      {
        text: 'Active Piezo Buzzer',
        sub: '12mm 5V Developer Audio Cue',
        anchor: new THREE.Vector3(5.0, this.breadboard.height + 1.0, 1.2),
        offset: new THREE.Vector3(5.8, 3.0, 2.6),
        color: '#3b82f6'
      },
      {
        text: '100µF + 0.1µF Decoupling',
        sub: 'Audio Rail Noise Suppressors',
        anchor: new THREE.Vector3(-3.8, this.breadboard.height + 0.8, -1.3),
        offset: new THREE.Vector3(-4.4, 3.4, -2.4),
        color: '#06b6d4'
      }
    ];

    componentLabels.forEach(cfg => this.createCalloutBadge(cfg));

    // 2. Pin Callout Badges
    const pinLabels = [
      { text: 'GPIO4 (WS)', pos: this.breadboard.getHolePos({ row: 25, col: 'D' }) },
      { text: 'GPIO5 (SCK)', pos: this.breadboard.getHolePos({ row: 26, col: 'D' }) },
      { text: 'GPIO6 (SD)', pos: this.breadboard.getHolePos({ row: 27, col: 'D' }) },
      { text: 'GPIO14 (Buzzer)', pos: this.breadboard.getHolePos({ row: 35, col: 'G' }) },
      { text: 'GPIO15 (Red)', pos: this.breadboard.getHolePos({ row: 30, col: 'D' }) },
      { text: 'GPIO16 (Grn)', pos: this.breadboard.getHolePos({ row: 31, col: 'D' }) },
      { text: 'GPIO17 (Blu)', pos: this.breadboard.getHolePos({ row: 32, col: 'D' }) },
      { text: 'GPIO18 (Motor)', pos: this.breadboard.getHolePos({ row: 34, col: 'G' }) },
      { text: 'GPIO21 (SDA)', pos: this.breadboard.getHolePos({ row: 38, col: 'D' }) },
      { text: 'GPIO22 (SCL)', pos: this.breadboard.getHolePos({ row: 39, col: 'D' }) }
    ];

    pinLabels.forEach(p => this.createPinBadge(p));
  }

  createCalloutBadge(cfg) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Background pill
    ctx.fillStyle = 'rgba(10, 15, 30, 0.94)';
    ctx.beginPath();
    ctx.roundRect(16, 16, canvas.width - 32, canvas.height - 32, 36);
    ctx.fill();

    // High-contrast glowing border
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Left indicator bar
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.roundRect(24, 24, 20, canvas.height - 48, 10);
    ctx.fill();

    // Text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px monospace';
    ctx.fillText(cfg.text, 75, 135);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 42px sans-serif';
    ctx.fillText(cfg.sub, 75, 230);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false; // No blur!
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.75, 1.0);
    sprite.position.copy(cfg.offset);

    // Leader Line with anchor dot
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(cfg.color),
      transparent: true,
      opacity: 0.85,
      linewidth: 2
    });

    const points = [
      cfg.anchor,
      new THREE.Vector3(cfg.offset.x, cfg.offset.y - 0.35, cfg.offset.z)
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeo, lineMat);

    // Anchor sphere dot
    const dotGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(cfg.color) });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(cfg.anchor);

    const badgeGroup = new THREE.Group();
    badgeGroup.add(sprite, line, dot);
    this.group.add(badgeGroup);
    this.labels.push(badgeGroup);
  }

  createPinBadge(p) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 24);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 56px monospace';
    ctx.fillText(p.text, canvas.width / 2, 105);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false; // No blur!
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.9, 0.28, 1.0);
    sprite.position.set(p.pos.x, p.pos.y + 0.45, p.pos.z);

    this.group.add(sprite);
    this.labels.push(sprite);
  }

  toggle(visible) {
    this.isVisible = visible !== undefined ? visible : !this.isVisible;
    this.group.visible = this.isVisible;
    return this.isVisible;
  }
}
