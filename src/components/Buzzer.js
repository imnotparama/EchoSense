import * as THREE from 'three';

export class Buzzer {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'Active_Piezo_Buzzer';
    this.group.userData = {
      name: '12mm Active Piezo Buzzer',
      category: 'DEBUG SOUND CUE',
      desc: 'Active 5V piezo acoustic sounder connected to GPIO14. Included as a developer auditory confirmation tool during hardware testing and algorithm validation, ensuring developers hear the classification outcome alongside visual & haptic cues.',
      specs: [
        '12mm Diameter Cylindrical Can',
        'Built-in 2.3 kHz Oscillation',
        '85 dB SPL @ 10cm',
        '5V DC Operating Voltage',
        'GPIO14 Driven'
      ]
    };

    // Positioned at breadboard rows 51-52, column I-J
    this.posRowPos = 51;
    this.posRowNeg = 52;
    this.init();
  }

  init() {
    const radius = 0.6; // 12mm diameter = 1.2cm
    const height = 0.95; // 9.5mm height

    // Black cylindrical plastic body
    const bodyGeo = new THREE.CylinderGeometry(radius, radius, height, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.5,
      metalness: 0.1
    });

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.position.y = this.breadboard.height + height / 2 + 0.15;

    // Top sound emission cavity / aperture
    const holeGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.y = body.position.y + height / 2 + 0.01;

    // Top "+" polarity marking
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 50px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+', 80, 80);
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('BUZZER', 128, 190);

    const tex = new THREE.CanvasTexture(canvas);
    const topGeo = new THREE.CircleGeometry(radius * 0.95, 32);
    const topMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
    const topCap = new THREE.Mesh(topGeo, topMat);
    topCap.rotation.x = -Math.PI / 2;
    topCap.position.y = body.position.y + height / 2 + 0.02;

    // Metal pins into breadboard
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });
    const pinGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8);

    const pin1 = new THREE.Mesh(pinGeo, pinMat);
    pin1.position.set(-0.2, this.breadboard.height + 0.1, 0);

    const pin2 = new THREE.Mesh(pinGeo, pinMat);
    pin2.position.set(0.2, this.breadboard.height + 0.1, 0);

    // Position on breadboard
    const posX = (this.breadboard.getRowX(this.posRowPos) + this.breadboard.getRowX(this.posRowNeg)) / 2;
    const posZ = this.breadboard.getColZ('I');

    this.group.position.set(posX, 0, posZ);
    this.group.add(body, hole, topCap, pin1, pin2);
  }
}
