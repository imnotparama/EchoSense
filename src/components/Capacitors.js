import * as THREE from 'three';

export class Capacitors {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'Filter_Capacitors';

    this.init();
  }

  init() {
    this.createElectrolyticCap();
    this.createCeramicCap();
  }

  createElectrolyticCap() {
    // 100 µF Electrolytic Capacitor:
    // Placed across 3.3V rail (+top) and GND rail (-top) near row 6 (close to INMP441 mic)
    const capGroup = new THREE.Group();
    capGroup.name = 'Capacitor_100uF';
    capGroup.userData = {
      name: '100 µF Electrolytic Capacitor',
      category: 'POWER FILTERING',
      desc: 'Low-ESR bulk electrolytic capacitor placed across the 3.3V power rail right beside the INMP441 microphone. Absorbs transient switching ripple and stabilizes analog bias voltages for clean audio ADC sampling.',
      specs: [
        '100 µF Capacitance',
        '16V Rating',
        'Low-ESR Radial Can',
        'Polarity: Cathode Stripe (-)'
      ]
    };

    // Aluminum cylindrical body with black vinyl sleeve
    const radius = 0.3;
    const height = 0.75;
    const bodyGeo = new THREE.CylinderGeometry(radius, radius, height, 20);

    // Texture with negative polarity stripe
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Black body
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Silver/white negative stripe
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(180, 0, 50, canvas.height);

    // Minus signs on stripe
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('-', 205, 50);
    ctx.fillText('-', 205, 110);
    ctx.fillText('-', 205, 170);
    ctx.fillText('-', 205, 230);

    // Value text
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('100µF', 90, 110);
    ctx.font = '16px monospace';
    ctx.fillText('16V', 90, 150);

    const texture = new THREE.CanvasTexture(canvas);
    const bodyMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.3
    });

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.position.y = this.breadboard.height + height / 2 + 0.2;

    // Aluminum top indent
    const topGeo = new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, 0.05, 20);
    const topMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
    const topCap = new THREE.Mesh(topGeo, topMat);
    topCap.position.y = body.position.y + height / 2 + 0.02;

    // Metal leads (Positive to +top rail, Negative to -top rail)
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 });
    const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);

    const lead1 = new THREE.Mesh(leadGeo, leadMat);
    lead1.position.set(0, this.breadboard.height + 0.15, -0.15);

    const lead2 = new THREE.Mesh(leadGeo, leadMat);
    lead2.position.set(0, this.breadboard.height + 0.15, 0.15);

    // Position at row 6, between +top and -top rails
    const posX = this.breadboard.getRowX(6);
    const posZ = (this.breadboard.getRailZ('+top') + this.breadboard.getRailZ('-top')) / 2;

    capGroup.position.set(posX, 0, posZ);
    capGroup.add(body, topCap, lead1, lead2);
    this.group.add(capGroup);
  }

  createCeramicCap() {
    // 0.1 µF (100nF) Ceramic Capacitor:
    // Placed between VDD (Row 8, Col A) and GND (Row 9, Col A) right next to INMP441 pins
    const capGroup = new THREE.Group();
    capGroup.name = 'Capacitor_0.1uF';
    capGroup.userData = {
      name: '0.1 µF Ceramic Decoupling Capacitor',
      category: 'HIGH-FREQUENCY DECOUPLING',
      desc: 'Standard 100nF (code 104) ceramic disc capacitor placed directly across the INMP441 VDD and GND pins. Shunts high-frequency radio frequency (RF) and digital switching noise to ground before it reaches the sensitive MEMS transducer.',
      specs: [
        '0.1 µF (100 nF)',
        'Code: 104',
        'Non-Polarized Ceramic Disc',
        '50V Dielectric Rating'
      ]
    };

    // Disc body (flattened sphere or cylinder)
    const discGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16);
    discGeo.rotateZ(Math.PI / 2);

    // Yellow/amber ceramic color
    const discMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Amber/Tan ceramic
      roughness: 0.6,
      metalness: 0.05
    });

    const disc = new THREE.Mesh(discGeo, discMat);
    disc.castShadow = true;
    disc.position.y = this.breadboard.height + 0.45;

    // Leads bent into rows 8 and 9 (Col A)
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.2 });
    const leadGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.35, 8);

    const lead1 = new THREE.Mesh(leadGeo, leadMat);
    lead1.position.set(-0.12, this.breadboard.height + 0.18, 0);

    const lead2 = new THREE.Mesh(leadGeo, leadMat);
    lead2.position.set(0.12, this.breadboard.height + 0.18, 0);

    const posX = (this.breadboard.getRowX(8) + this.breadboard.getRowX(9)) / 2;
    const posZ = this.breadboard.getColZ('A');

    capGroup.position.set(posX, 0, posZ);
    capGroup.add(disc, lead1, lead2);
    this.group.add(capGroup);
  }
}
