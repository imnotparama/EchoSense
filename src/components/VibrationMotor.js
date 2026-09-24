import * as THREE from 'three';

export class VibrationMotor {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'Coin_Vibration_Motor';
    this.group.userData = {
      name: '10mm Coin Vibration Motor',
      category: 'HAPTIC ACTUATOR',
      desc: 'Eccentric Rotating Mass (ERM) 10mm flat coin motor powered from the 5V (USB VBUS) rail. Delivers tactile vibration bursts to alert individuals who are deaf or hard-of-hearing to emergency and environmental auditory cues.',
      specs: [
        '10mm Diameter × 3mm Height',
        '5V DC High-Torque Drive',
        '12,000 RPM Max Speed',
        'Tactile Alert Patterns',
        '2N2222 Low-Side BJT Switched'
      ]
    };

    this.isVibrating = false;
    this.vibrationIntensity = 0;
    this.vibrationPattern = null;
    this.patternTime = 0;

    this.init();
  }

  init() {
    this.createMotorBody();
    this.createLeads();
    this.createHapticRipples();
  }

  createMotorBody() {
    // 10mm diameter = 1.0cm, 3mm height = 0.3cm
    const radius = 0.5;
    const height = 0.3;

    const motorGroup = new THREE.Group();

    // Brushed metal outer cylinder
    const bodyGeo = new THREE.CylinderGeometry(radius, radius, height, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.9,
      roughness: 0.25
    });

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = height / 2;

    // Top indentation & circular groove
    const grooveGeo = new THREE.RingGeometry(0.2, 0.35, 32);
    const grooveMat = new THREE.MeshStandardMaterial({ color: 0xa1a1aa, roughness: 0.4 });
    const groove = new THREE.Mesh(grooveGeo, grooveMat);
    groove.rotation.x = -Math.PI / 2;
    groove.position.y = height + 0.001;

    // Blue peel-off adhesive tab on side/bottom with 3M branding texture
    const tabCanvas = document.createElement('canvas');
    tabCanvas.width = 128;
    tabCanvas.height = 128;
    const tCtx = tabCanvas.getContext('2d');
    tCtx.fillStyle = '#0284c7';
    tCtx.fillRect(0, 0, 128, 128);
    tCtx.fillStyle = '#ffffff';
    tCtx.font = 'bold 36px sans-serif';
    tCtx.textAlign = 'center';
    tCtx.fillText('3M', 64, 55);
    tCtx.fillStyle = '#ef4444';
    tCtx.font = 'bold 24px sans-serif';
    tCtx.fillText('▲ PULL', 64, 95);

    const tabTex = new THREE.CanvasTexture(tabCanvas);
    tabTex.minFilter = THREE.LinearFilter;

    const tabGeo = new THREE.BoxGeometry(0.32, 0.02, 0.42);
    const tabMat = new THREE.MeshStandardMaterial({ map: tabTex, roughness: 0.5 });
    const tab = new THREE.Mesh(tabGeo, tabMat);
    tab.position.set(radius + 0.1, 0.01, 0);

    motorGroup.add(body, groove, tab);

    // Position on breadboard surface at rows 55-58, columns G-I
    const posX = this.breadboard.getRowX(56);
    const posZ = this.breadboard.getColZ('H');
    const posY = this.breadboard.height + 0.02;

    motorGroup.position.set(posX, posY, posZ);
    this.group.add(motorGroup);
    this.motorGroup = motorGroup;
    this.basePosition = motorGroup.position.clone();
  }

  createLeads() {
    // Molded black strain relief boot on side of motor
    const bootGeo = new THREE.BoxGeometry(0.12, 0.14, 0.22);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const boot = new THREE.Mesh(bootGeo, bootMat);
    boot.position.set(this.basePosition.x - 0.46, this.basePosition.y + 0.12, this.basePosition.z);
    this.group.add(boot);

    // Flying leads coming out of motor (Red +5V, Black Negative)
    // Red lead goes to row 55 col F, Black lead goes to row 57 col F (Collector of 2N2222)
    const leadMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const leadMatBlack = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

    const p1 = new THREE.Vector3(this.basePosition.x - 0.48, this.basePosition.y + 0.12, this.basePosition.z - 0.05);
    const p1B = new THREE.Vector3(this.basePosition.x - 0.48, this.basePosition.y + 0.12, this.basePosition.z + 0.05);
    const p2Red = this.breadboard.getHolePos({ row: 55, col: 'F' });
    const p2Black = this.breadboard.getHolePos({ row: 57, col: 'F' });

    // Red wire curve
    const curveRed = new THREE.CatmullRomCurve3([
      p1,
      new THREE.Vector3(p1.x - 0.3, p1.y + 0.3, p1.z - 0.2),
      new THREE.Vector3(p2Red.x + 0.1, p2Red.y + 0.2, p2Red.z),
      p2Red
    ]);
    const geoRed = new THREE.TubeGeometry(curveRed, 20, 0.035, 8, false);
    const wireRed = new THREE.Mesh(geoRed, leadMatRed);
    wireRed.castShadow = true;

    // Black wire curve
    const curveBlack = new THREE.CatmullRomCurve3([
      p1B,
      new THREE.Vector3(p1B.x - 0.25, p1B.y + 0.25, p1B.z + 0.15),
      new THREE.Vector3(p2Black.x + 0.1, p2Black.y + 0.2, p2Black.z),
      p2Black
    ]);
    const geoBlack = new THREE.TubeGeometry(curveBlack, 20, 0.035, 8, false);
    const wireBlack = new THREE.Mesh(geoBlack, leadMatBlack);
    wireBlack.castShadow = true;

    this.group.add(wireRed, wireBlack);
  }

  createHapticRipples() {
    // Concentric visual haptic shockwave rings on breadboard surface during vibration
    this.ripples = [];
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(0.5, 0.56, 32);
      const ring = new THREE.Mesh(ringGeo, rippleMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(this.basePosition.x, this.breadboard.height + 0.03, this.basePosition.z);
      ring.visible = false;
      this.group.add(ring);
      this.ripples.push({ mesh: ring, scale: 1.0 + i * 0.3, opacity: 0 });
    }
  }

  setVibration(intensity, pattern = null) {
    this.vibrationIntensity = intensity;
    this.isVibrating = intensity > 0;
    this.vibrationPattern = pattern;
    this.patternTime = 0;

    this.ripples.forEach(r => {
      r.mesh.visible = this.isVibrating;
    });
  }

  update(deltaTime) {
    if (!this.isVibrating || this.vibrationIntensity <= 0) {
      this.motorGroup.position.copy(this.basePosition);
      this.ripples.forEach(r => {
        r.mesh.visible = false;
      });
      return;
    }

    this.patternTime += deltaTime;

    // Evaluate vibration pattern if active
    let activeNow = true;
    if (this.vibrationPattern === 'double-pulse') {
      // Doorbell: 2 pulses (e.g. 0-0.3s ON, 0.3-0.5s OFF, 0.5-0.8s ON, then cycle)
      const t = this.patternTime % 1.2;
      activeNow = (t < 0.3) || (t > 0.45 && t < 0.75);
    } else if (this.vibrationPattern === 'triple-pulse') {
      // Baby Cry: 3 short pulses
      const t = this.patternTime % 1.5;
      activeNow = (t < 0.2) || (t > 0.35 && t < 0.55) || (t > 0.7 && t < 0.9);
    } else if (this.vibrationPattern === 'long-pulse') {
      // Car Horn: Long sustained burst
      const t = this.patternTime % 1.6;
      activeNow = t < 1.0;
    }

    if (activeNow) {
      // High-frequency mechanical displacement shake
      const jitterAmount = 0.035 * this.vibrationIntensity;
      const jx = (Math.random() - 0.5) * jitterAmount;
      const jz = (Math.random() - 0.5) * jitterAmount;
      this.motorGroup.position.set(
        this.basePosition.x + jx,
        this.basePosition.y,
        this.basePosition.z + jz
      );

      // Animate concentric haptic ripples
      this.ripples.forEach((r, idx) => {
        r.mesh.visible = true;
        r.scale += deltaTime * 2.5;
        if (r.scale > 2.5) {
          r.scale = 1.0;
        }
        r.mesh.scale.set(r.scale, r.scale, 1);
        const fade = Math.max(0, 1.0 - (r.scale - 1.0) / 1.5);
        r.mesh.material.opacity = fade * 0.7 * this.vibrationIntensity;
      });
    } else {
      this.motorGroup.position.copy(this.basePosition);
      this.ripples.forEach(r => {
        r.mesh.material.opacity = 0;
      });
    }
  }
}
