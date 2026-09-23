import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export class PhoneCompanion {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Smartphone_Companion';
    this.group.userData = {
      name: 'Companion Smartphone (BLE Receiver)',
      category: 'USER INTERFACE & NOTIFICATION',
      desc: 'Smart companion device receiving low-latency Bluetooth Low Energy (BLE 5.0) push notifications from the ESP32-S3 TinyML engine, providing visual and wearable alerts for users who are deaf or hard of hearing.',
      specs: [
        'BLE 5.0 GATT Client',
        'Push Notification Engine',
        'Haptic Motor Synced',
        'Decibel & Confidence Telemetry'
      ]
    };

    // Smartphone dimensions (in cm: 7.2cm wide, 14.8cm tall, 0.78cm thick)
    this.width = 4.2;
    this.length = 8.5;
    this.thickness = 0.45;

    this.activeNotification = null;
    this.screenOn = false;
    this.glowIntensity = 0;
    this.cardAnimY = 370;

    this.baseX = 11.5;
    this.vibrationTime = 0;
    this.vibrationDuration = 0;
    this.vibrationIntensity = 0;

    this.init();
  }

  init() {
    this.createPhoneBody();
    this.createScreen();

    // Scale phone down to ~40% so hardware breadboard circuit remains primary focus
    this.group.scale.set(0.42, 0.42, 0.42);

    // Dock neatly to the side of the circuit on the desk surface
    this.baseX = 11.2;
    this.group.position.set(this.baseX, 0.1, 0.2);
    this.group.rotation.y = -0.12; // Unobtrusive side dock angle
  }

  createPhoneBody() {
    // Rounded rectangular shape
    const shape = new THREE.Shape();
    const w = this.width;
    const l = this.length;
    const r = 0.5;
    const x = -w / 2;
    const y = -l / 2;

    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + l - r);
    shape.quadraticCurveTo(x + w, y + l, x + w - r, y + l);
    shape.lineTo(x + r, y + l);
    shape.quadraticCurveTo(x, y + l, x, y + l - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const extrudeSettings = {
      depth: this.thickness,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2);

    // Dark Titanium / Matte Space Black metallic frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.25
    });

    const body = new THREE.Mesh(geometry, frameMat);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    // Camera island on back (for realism when viewed from below/behind)
    const camIslandGeo = new THREE.BoxGeometry(1.6, 0.1, 1.8);
    const camIsland = new THREE.Mesh(camIslandGeo, frameMat);
    camIsland.position.set(-0.9, -this.thickness / 2 - 0.05, -2.5);
    this.group.add(camIsland);
  }

  createScreen() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    // Front glass screen
    const screenGeo = new THREE.PlaneGeometry(this.width - 0.18, this.length - 0.22);
    this.screenMaterial = new THREE.MeshPhysicalMaterial({
      map: this.texture,
      roughness: 0.1,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: 0x00f0ff,
      emissiveMap: this.texture,
      emissiveIntensity: 0.3
    });

    const screen = new THREE.Mesh(screenGeo, this.screenMaterial);
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = this.thickness / 2 + 0.045;
    this.group.add(screen);

    this.drawScreen();
  }

  triggerVibration(duration = 1.0, intensity = 1.0) {
    this.vibrationTime = 0;
    this.vibrationDuration = duration;
    this.vibrationIntensity = intensity;
  }

  setNotification(type, title, subtitle, confidence = '99.2%') {
    this.activeNotification = {
      type,
      title,
      subtitle,
      confidence,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.screenOn = true;
    this.glowIntensity = 1.3;
    this.cardAnimY = 370;
    this.triggerVibration(1.2, 1.0);
    this.drawScreen();
  }

  clearNotification() {
    this.activeNotification = null;
    this.screenOn = false;
    this.glowIntensity = 0.2;
    this.cardAnimY = 370;
    this.drawScreen();
  }

  drawScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark OLED background wallpaper with deep subtle purple-blue gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#050814');
    bgGrad.addColorStop(0.5, '#0a1026');
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Status Bar (Top)
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('09:41', 30, 45);

    // Battery & Signal icons
    ctx.textAlign = 'right';
    ctx.fillText('5G  100%', w - 30, 45);

    // Dynamic Island / Camera Cutout pill
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 60, 25, 120, 30, 15);
    ctx.fill();

    // Lockscreen Clock
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '300 86px sans-serif';
    ctx.fillText('09:41', w / 2, 220);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 22px sans-serif';
    ctx.fillText('Tuesday, September 22', w / 2, 265);

    // BLE Status Pill
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 140, 295, 280, 40, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('● BLE CONNECTED • ECHOSENSE', w / 2, 321);

    // Push Notification Card (if active)
    if (this.activeNotification) {
      const cardY = this.cardAnimY !== undefined ? this.cardAnimY : 370;
      const cardH = 260;
      const cardW = w - 40;
      const cardX = 20;

      // Notification background (Glassmorphism)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 24);
      ctx.fill();

      // Glowing border matching alert type
      let borderColor = 'rgba(0, 240, 255, 0.8)';
      if (this.activeNotification.type === 'fire') borderColor = 'rgba(239, 68, 68, 0.9)';
      if (this.activeNotification.type === 'doorbell') borderColor = 'rgba(56, 189, 248, 0.9)';
      if (this.activeNotification.type === 'baby') borderColor = 'rgba(245, 158, 11, 0.9)';
      if (this.activeNotification.type === 'horn') borderColor = 'rgba(249, 115, 22, 0.9)';

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // App Header inside card
      ctx.textAlign = 'left';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('ECHOSENSE ASSIST', cardX + 24, cardY + 40);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = '16px sans-serif';
      ctx.fillText('Just now', cardX + cardW - 24, cardY + 40);

      // Alert Title
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(this.activeNotification.title, cardX + 24, cardY + 85);

      // Alert Subtitle / Description
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '18px sans-serif';
      ctx.fillText(this.activeNotification.subtitle, cardX + 24, cardY + 125);

      // Telemetry Tags inside card
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(cardX + 24, cardY + 160, 200, 36, 8);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`CONFIDENCE: ${this.activeNotification.confidence}`, cardX + 34, cardY + 184);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(cardX + 235, cardY + 160, 180, 36, 8);
      ctx.fill();
      ctx.fillStyle = '#a855f7';
      ctx.fillText('HAPTIC: VIBRATING', cardX + 245, cardY + 184);

      // Action buttons
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(cardX + 24, cardY + 210, cardW - 48, 36, 10);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('DISMISS ALERT', cardX + cardW / 2, cardY + 234);
    } else {
      // Idle message
      ctx.textAlign = 'center';
      ctx.fillStyle = '#475569';
      ctx.font = '18px sans-serif';
      ctx.fillText('No new sound alerts', w / 2, 480);
      ctx.font = '15px monospace';
      ctx.fillText('Microphone monitoring in background...', w / 2, 515);
    }

    // Flashlight & Camera shortcuts at bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(80, h - 80, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(w - 80, h - 80, 30, 0, Math.PI * 2);
    ctx.fill();

    // Home Bar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 80, h - 25, 160, 5, 3);
    ctx.fill();

    this.texture.needsUpdate = true;
    if (this.screenMaterial) {
      this.screenMaterial.emissiveIntensity = this.glowIntensity;
    }
  }

  update(deltaTime) {
    if (this.screenOn && this.glowIntensity > 0.4) {
      this.glowIntensity = Math.max(0.4, this.glowIntensity - deltaTime * 0.5);
      if (this.screenMaterial) {
        this.screenMaterial.emissiveIntensity = this.glowIntensity;
      }
    }

    // 3D mechanical vibration oscillation on desk
    if (this.vibrationTime < this.vibrationDuration) {
      this.vibrationTime += deltaTime;
      const progress = this.vibrationTime / this.vibrationDuration;
      const decay = Math.max(0, 1 - progress);
      const freq = 55; // 55 Hz tactile motor buzz
      const xOffset = Math.sin(this.vibrationTime * freq) * 0.02 * this.vibrationIntensity * decay;
      const rotZOffset = Math.sin(this.vibrationTime * freq * 0.8) * 0.012 * this.vibrationIntensity * decay;

      this.group.position.x = this.baseX + xOffset;
      this.group.rotation.z = rotZOffset;
    } else {
      this.group.position.x = this.baseX;
      this.group.rotation.z = 0;
    }
  }
}
