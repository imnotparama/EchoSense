import * as THREE from 'three';

export class RGBLED {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   */
  constructor(breadboard) {
    this.breadboard = breadboard;
    this.group = new THREE.Group();
    this.group.name = 'RGB_Status_LED';
    this.group.userData = {
      name: '5mm Common Cathode RGB LED',
      category: 'VISUAL INDICATOR',
      desc: 'High-brightness 5mm diffused RGB LED configured with a shared common cathode tied to GND. Provides immediate color-coded visual alert hierarchy for users with hearing impairments, categorizing acoustic events by urgency.',
      specs: [
        'Common Cathode (Pin 2 to GND)',
        'Red: 625nm (GPIO15 via 220Ω)',
        'Green: 520nm (GPIO16 via 220Ω)',
        'Blue: 465nm (GPIO17 via 220Ω)',
        'Diffused Milky Epoxy Lens'
      ]
    };

    // Pins occupy rows 46, 47, 48, 49 at column C
    // Pin 1: Red (Row 46)
    // Pin 2: Cathode (Row 47) - longest pin
    // Pin 3: Blue (Row 48)
    // Pin 4: Green (Row 49)
    this.rows = {
      red: 46,
      cathode: 47,
      blue: 48,
      green: 49
    };

    this.currentColor = new THREE.Color(0x00f0ff);
    this.targetIntensity = 0.5;
    this.blinkActive = false;
    this.blinkTimer = 0;

    this.init();
  }

  init() {
    this.createLens();
    this.createLeads();
    this.createLight();
  }

  createLens() {
    // 5mm diffused LED bulb geometry (cylinder base + hemispherical dome)
    const bulbGroup = new THREE.Group();
    const radius = 0.25; // 2.5mm radius = 5mm diameter
    const height = 0.5;

    // Cylindrical base with rim
    const cylGeo = new THREE.CylinderGeometry(radius, radius, height, 24);
    const rimGeo = new THREE.CylinderGeometry(radius * 1.15, radius * 1.15, 0.08, 24);

    // Hemispherical dome on top
    const domeGeo = new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);

    this.ledMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
      transmission: 0.6,
      opacity: 0.9,
      transparent: true,
      roughness: 0.3,
      metalness: 0.05,
      ior: 1.5
    });

    const cyl = new THREE.Mesh(cylGeo, this.ledMaterial);
    cyl.position.y = height / 2;

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.3,
      transparent: true,
      opacity: 0.85
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.04;

    const dome = new THREE.Mesh(domeGeo, this.ledMaterial);
    dome.position.y = height;

    // Internal metallic leadframe anvil & post
    const postGeo = new THREE.BoxGeometry(0.04, 0.3, 0.04);
    const anvilGeo = new THREE.BoxGeometry(0.1, 0.12, 0.04);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });

    const post = new THREE.Mesh(postGeo, metalMat);
    post.position.set(-0.06, 0.25, 0);

    const anvil = new THREE.Mesh(anvilGeo, metalMat);
    anvil.position.set(0.06, 0.28, 0);

    bulbGroup.add(cyl, rim, dome, post, anvil);

    // Position bulb above the 4 leads
    const centerX = (this.breadboard.getRowX(46) + this.breadboard.getRowX(49)) / 2;
    const posZ = this.breadboard.getColZ('C');
    const posY = this.breadboard.height + 0.85;

    bulbGroup.position.set(centerX, posY, posZ);
    this.group.add(bulbGroup);
    this.bulbGroup = bulbGroup;
  }

  createLeads() {
    // 4 metal wire legs bent down into breadboard rows 46, 47, 48, 49
    const leadMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.9,
      roughness: 0.15
    });

    const colZ = this.breadboard.getColZ('C');
    const bulbY = this.breadboard.height + 0.85;
    const boardY = this.breadboard.height + 0.01;

    const leadPositions = [
      { row: this.rows.red, name: 'Red Anode' },
      { row: this.rows.cathode, name: 'Common Cathode' },
      { row: this.rows.blue, name: 'Blue Anode' },
      { row: this.rows.green, name: 'Green Anode' }
    ];

    leadPositions.forEach((lead) => {
      const x = this.breadboard.getRowX(lead.row);
      const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, bulbY - boardY, 8);
      const leadMesh = new THREE.Mesh(leadGeo, leadMat);
      leadMesh.position.set(x, (bulbY + boardY) / 2, colZ);
      this.group.add(leadMesh);
    });
  }

  createLight() {
    // Dynamic PointLight casting light onto breadboard and adjacent components
    this.pointLight = new THREE.PointLight(0x00f0ff, 1.5, 4.0, 1.2);
    this.pointLight.position.set(
      (this.breadboard.getRowX(46) + this.breadboard.getRowX(49)) / 2,
      this.breadboard.height + 1.2,
      this.breadboard.getColZ('C')
    );
    this.pointLight.castShadow = false;
    this.group.add(this.pointLight);
  }

  setColor(hexColor, intensity = 1.0, blink = false) {
    this.currentColor.setHex(hexColor);
    this.targetIntensity = intensity;
    this.blinkActive = blink;
    this.ledMaterial.emissive.setHex(hexColor);
    this.ledMaterial.emissiveIntensity = intensity;
    this.pointLight.color.setHex(hexColor);
    this.pointLight.intensity = intensity * 2.0;
  }

  update(deltaTime) {
    if (this.blinkActive) {
      this.blinkTimer += deltaTime * 8.0;
      const factor = (Math.sin(this.blinkTimer) + 1.0) / 2.0;
      const intensity = factor * this.targetIntensity;
      this.ledMaterial.emissiveIntensity = intensity;
      this.pointLight.intensity = intensity * 2.5;
    }
  }
}
