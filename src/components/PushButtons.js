import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export class PushButtons {
  /**
   * @param {import('./Breadboard').Breadboard} breadboard
   * @param {Function} onButtonTrigger
   */
  constructor(breadboard, onButtonTrigger) {
    this.breadboard = breadboard;
    this.onButtonTrigger = onButtonTrigger;
    this.group = new THREE.Group();
    this.group.name = 'Push_Buttons_Root';

    // 4 Tactile push buttons (6x6mm) along bottom of breadboard
    // Spanning rows 12-14, 18-20, 44-46, 50-52 at columns I-J
    this.buttons = [
      {
        id: 'fire',
        name: 'Fire Alarm Button',
        label: 'FIRE ALARM',
        gpio: 'GPIO8',
        color: 0xef4444,
        rowStart: 12,
        desc: 'Simulates the high-frequency acoustic signature of an EN54/NFPA standard fire smoke alarm (3.1 kHz pulsed siren). Triggers emergency priority visual flashing and continuous high-intensity tactile vibration.',
        specs: ['GPIO8 (INPUT_PULLUP)', 'Tactile 6×6mm', 'Active LOW', 'Emergency Priority 1']
      },
      {
        id: 'doorbell',
        name: 'Doorbell Button',
        label: 'DOORBELL',
        gpio: 'GPIO9',
        color: 0x38bdf8,
        rowStart: 18,
        desc: 'Simulates a residential two-tone chime acoustic event (660 Hz / 550 Hz ding-dong). Triggers blue status LED illumination and a distinct 2-pulse haptic pattern.',
        specs: ['GPIO9 (INPUT_PULLUP)', 'Tactile 6×6mm', 'Active LOW', 'Notification Priority 3']
      },
      {
        id: 'baby',
        name: 'Baby Cry Button',
        label: 'BABY CRY',
        gpio: 'GPIO10',
        color: 0xf59e0b,
        rowStart: 44,
        desc: 'Simulates an infant distress wail (400-600 Hz harmonic pitch modulation). Triggers warm yellow LED and a 3-short-burst tactile feedback rhythm.',
        specs: ['GPIO10 (INPUT_PULLUP)', 'Tactile 6×6mm', 'Active LOW', 'Alert Priority 2']
      },
      {
        id: 'horn',
        name: 'Car Horn Button',
        label: 'CAR HORN',
        gpio: 'GPIO11',
        color: 0xf97316,
        rowStart: 50,
        desc: 'Simulates vehicle dual-tone warning blast (400 Hz & 500 Hz dissonant horn). Triggers bright orange LED alert and a long heavy tactile warning pulse.',
        specs: ['GPIO11 (INPUT_PULLUP)', 'Tactile 6×6mm', 'Active LOW', 'Hazard Priority 2']
      }
    ];

    this.buttonMeshes = [];
    this.init();
  }

  init() {
    this.buttons.forEach((btnConfig) => {
      this.createTactileButton(btnConfig);
    });
  }

  createTactileButton(config) {
    const btnGroup = new THREE.Group();
    btnGroup.name = `Button_${config.id}`;
    btnGroup.userData = {
      id: config.id,
      name: config.name,
      category: 'TACTILE SIMULATION SWITCH',
      desc: config.desc,
      specs: config.specs,
      isClickable: true
    };

    // 6mm x 6mm tactile button housing (0.6cm x 0.6cm x 0.35cm)
    const baseGeo = new THREE.BoxGeometry(0.6, 0.35, 0.6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Black plastic
      roughness: 0.6
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = true;
    base.position.y = this.breadboard.height + 0.175;

    // Metallic top retaining plate with circular aperture
    const plateGeo = new THREE.BoxGeometry(0.61, 0.04, 0.61);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.9,
      roughness: 0.2
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = base.position.y + 0.18;

    // Raised round actuator plunger (button cap)
    const plungerRadius = 0.16;
    const plungerHeight = 0.25;
    const plungerGeo = new THREE.CylinderGeometry(plungerRadius, plungerRadius, plungerHeight, 24);
    const plungerMat = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.3,
      metalness: 0.1
    });

    const plunger = new THREE.Mesh(plungerGeo, plungerMat);
    plunger.castShadow = true;
    plunger.position.y = plate.position.y + plungerHeight / 2 - 0.04;
    plunger.userData = btnGroup.userData; // For raycasting

    // Metal pins (4 leads spanning rows r and r+2 at columns I and J)
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });
    const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);

    const pin1 = new THREE.Mesh(pinGeo, pinMat);
    pin1.position.set(-0.25, this.breadboard.height + 0.1, -0.2);
    const pin2 = new THREE.Mesh(pinGeo, pinMat);
    pin2.position.set(-0.25, this.breadboard.height + 0.1, 0.2);
    const pin3 = new THREE.Mesh(pinGeo, pinMat);
    pin3.position.set(0.25, this.breadboard.height + 0.1, -0.2);
    const pin4 = new THREE.Mesh(pinGeo, pinMat);
    pin4.position.set(0.25, this.breadboard.height + 0.1, 0.2);

    // Position button at bottom breadboard area
    const posX = (this.breadboard.getRowX(config.rowStart) + this.breadboard.getRowX(config.rowStart + 2)) / 2;
    const posZ = (this.breadboard.getColZ('I') + this.breadboard.getColZ('J')) / 2;

    btnGroup.position.set(posX, 0, posZ);
    btnGroup.add(base, plate, plunger, pin1, pin2, pin3, pin4);

    this.group.add(btnGroup);
    this.buttonMeshes.push({
      id: config.id,
      group: btnGroup,
      plunger: plunger,
      defaultY: plunger.position.y
    });
  }

  pressButton(id) {
    const btn = this.buttonMeshes.find(b => b.id === id);
    if (!btn) return;

    // Animate plunger spring depression
    new TWEEN.Tween(btn.plunger.position)
      .to({ y: btn.defaultY - 0.12 }, 70)
      .easing(TWEEN.Easing.Quadratic.Out)
      .yoyo(true)
      .repeat(1)
      .start();

    if (this.onButtonTrigger) {
      this.onButtonTrigger(id);
    }
  }

  getClickableMeshes() {
    return this.buttonMeshes.map(b => b.plunger);
  }
}
