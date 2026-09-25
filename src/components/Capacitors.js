import * as THREE from 'three';

export class Capacitors {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'Filter_Capacitors';
    this.group.userData = {
      name: 'Filter Decoupling Capacitors',
      category: 'POWER CONDITIONING',
      desc: 'Dual decoupling stage comprising a 100µF low-ESR bulk electrolytic capacitor on the 3.3V power bus and a 0.1µF (104) ceramic disc capacitor across INMP441 VDD/GND, eliminating low-frequency ripple and high-frequency switching noise.',
      specs: [
        '100 µF 16V Bulk Electrolytic',
        '0.1 µF (100nF) High-Freq Ceramic Disc',
        'Direct 3.3V Audio Bus Filtering',
        'Low-ESR Transient Absorption'
      ]
    };

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
    const radius = 0.28;
    const height = 0.72;
    const bodyGeo = new THREE.CylinderGeometry(radius, radius, height, 24);

    // Texture with negative polarity stripe and manufacturer markings
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Deep matte black vinyl body
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Silver/white negative stripe
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(360, 0, 90, canvas.height);

    // White negative minus [ - ] signs on stripe
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('-', 405, 55);
    ctx.fillText('-', 405, 120);
    ctx.fillText('-', 405, 185);
    ctx.fillText('-', 405, 245);

    // Golden / white rating text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('100µF', 180, 90);
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('16V 105°C', 180, 140);
    ctx.font = '20px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('LOW ESR • PET', 180, 185);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    const bodyMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.2
    });

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.position.y = this.breadboard.height + height / 2 + 0.16;

    // Bottom molded black rubber seal bung
    const bungGeo = new THREE.CylinderGeometry(radius * 0.95, radius * 0.95, 0.08, 24);
    const bungMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
    const bung = new THREE.Mesh(bungGeo, bungMat);
    bung.position.y = body.position.y - height / 2 - 0.03;

    // Aluminum top with stamped 'X' safety pressure relief vent
    const topGeo = new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, 0.04, 24);
    const topMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.92, roughness: 0.22 });
    const topCap = new THREE.Mesh(topGeo, topMat);
    topCap.position.y = body.position.y + height / 2 + 0.02;

    // Embossed 'X' vent groove
    const ventMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.5 });
    const ventLine1 = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.4, 0.045, 0.025), ventMat);
    const ventLine2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.045, radius * 1.4), ventMat);
    ventLine1.position.y = topCap.position.y + 0.005;
    ventLine2.position.y = topCap.position.y + 0.005;

    // Formed leads plugging into +top and -top power bus rails
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.12 });
    const railPlusZ = this.breadboard.getRailZ('+top');
    const railGndZ = this.breadboard.getRailZ('-top');
    const posZ = (railPlusZ + railGndZ) / 2;
    const holeY = this.breadboard.height;
    const relPlusZ = railPlusZ - posZ;
    const relGndZ = railGndZ - posZ;

    // Positive lead (anode -> +top rail)
    const curvePlus = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, bung.position.y, -0.08),
      new THREE.Vector3(0, bung.position.y - 0.06, relPlusZ * 0.5),
      new THREE.Vector3(0, holeY + 0.04, relPlusZ),
      new THREE.Vector3(0, holeY - 0.22, relPlusZ)
    ]);
    const leadPlus = new THREE.Mesh(new THREE.TubeGeometry(curvePlus, 16, 0.016, 8, false), leadMat);

    // Negative lead (cathode -> -top rail)
    const curveGnd = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, bung.position.y, 0.08),
      new THREE.Vector3(0, bung.position.y - 0.06, relGndZ * 0.5),
      new THREE.Vector3(0, holeY + 0.04, relGndZ),
      new THREE.Vector3(0, holeY - 0.22, relGndZ)
    ]);
    const leadGnd = new THREE.Mesh(new THREE.TubeGeometry(curveGnd, 16, 0.016, 8, false), leadMat);

    // Position at row 6, between +top and -top rails
    const posX = this.breadboard.getRowX(6);

    capGroup.position.set(posX, 0, posZ);
    capGroup.add(body, bung, topCap, ventLine1, ventLine2, leadPlus, leadGnd);
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

    const posX = (this.breadboard.getRowX(8) + this.breadboard.getRowX(9)) / 2;
    const posZ = this.breadboard.getColZ('A');
    const discY = this.breadboard.height + 0.38;

    // Disc body (flattened disc with stamped text)
    const discGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.07, 20);
    discGeo.rotateZ(Math.PI / 2);

    // Stamped 104 marking texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#b45309'; // Amber ceramic
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('104', 128, 120);
    ctx.font = 'bold 30px monospace';
    ctx.fillText('50V Z5U', 128, 175);

    const discTex = new THREE.CanvasTexture(canvas);
    discTex.colorSpace = THREE.SRGBColorSpace;
    discTex.generateMipmaps = false;
    discTex.minFilter = THREE.LinearFilter;
    discTex.magFilter = THREE.LinearFilter;
    discTex.anisotropy = 16;

    const discMat = new THREE.MeshStandardMaterial({
      map: discTex,
      roughness: 0.65,
      metalness: 0.05
    });

    const disc = new THREE.Mesh(discGeo, discMat);
    disc.castShadow = true;
    disc.position.set(0, discY, 0);

    // Formed leads dipping down into Row 8 and Row 9 at Column A
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });
    const row8X = this.breadboard.getRowX(8) - posX;
    const row9X = this.breadboard.getRowX(9) - posX;
    const holeY = this.breadboard.height;

    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.06, discY - 0.07, 0),
      new THREE.Vector3(row8X, discY - 0.14, 0),
      new THREE.Vector3(row8X, holeY + 0.04, 0),
      new THREE.Vector3(row8X, holeY - 0.22, 0)
    ]);
    const lead1Mesh = new THREE.Mesh(new THREE.TubeGeometry(curve1, 16, 0.015, 8, false), leadMat);

    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.06, discY - 0.07, 0),
      new THREE.Vector3(row9X, discY - 0.14, 0),
      new THREE.Vector3(row9X, holeY + 0.04, 0),
      new THREE.Vector3(row9X, holeY - 0.22, 0)
    ]);
    const lead2Mesh = new THREE.Mesh(new THREE.TubeGeometry(curve2, 16, 0.015, 8, false), leadMat);

    capGroup.position.set(posX, 0, posZ);
    capGroup.add(disc, lead1Mesh, lead2Mesh);
    this.group.add(capGroup);
  }
}
