import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { SceneManager } from './scene/SceneManager';
import { Breadboard } from './components/Breadboard';
import { ESP32S3 } from './components/ESP32S3';
import { INMP441 } from './components/INMP441';
import { Capacitors } from './components/Capacitors';
import { RGBLED } from './components/RGBLED';
import { VibrationMotor } from './components/VibrationMotor';
import { Buzzer } from './components/Buzzer';
import { TransistorCircuit } from './components/TransistorCircuit';
import { OLEDDisplay } from './components/OLEDDisplay';
import { PhoneCompanion } from './components/PhoneCompanion';
import { FloatingLabels } from './components/FloatingLabels';
import { WireManager } from './wiring/WireManager';
import { SoundSynthesizer } from './audio/SoundSynthesizer';
import { ExplosionManager } from './scene/ExplosionManager';
import { StorySimulator } from './scene/StorySimulator';
import { SchematicView } from './ui/SchematicView';
import { OverlayUI } from './ui/OverlayUI';
import { PinConnectionsModal } from './ui/PinConnectionsModal';

class EchoSenseApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.sceneMgr = new SceneManager(this.canvas);
    this.soundSynth = new SoundSynthesizer();

    this.currentAlert = 'listening';
    this.alertTimer = null;
    this.activeInspectedWireId = null;
    this.clock = new THREE.Clock();

    this.initSceneObjects();
    this.initRaycaster();
    this.initUI();
    this.animate();
  }

  initSceneObjects() {
    // 1. Breadboard (with internal metal clips & opacity support)
    this.breadboard = new Breadboard();
    this.sceneMgr.scene.add(this.breadboard.group);

    // 2. ESP32-S3 Microcontroller
    this.esp32 = new ESP32S3(this.breadboard);
    this.sceneMgr.scene.add(this.esp32.group);

    // 3. INMP441 I2S Microphone Breakout
    this.inmp441 = new INMP441(this.breadboard);
    this.sceneMgr.scene.add(this.inmp441.group);

    // 4. Power & Decoupling Capacitors (100uF + 0.1uF)
    this.capacitors = new Capacitors(this.breadboard);
    this.sceneMgr.scene.add(this.capacitors.group);

    // 5. Common Cathode RGB Status LED
    this.rgbLed = new RGBLED(this.breadboard);
    this.sceneMgr.scene.add(this.rgbLed.group);

    // 6. 10mm Coin Vibration Motor
    this.vibeMotor = new VibrationMotor(this.breadboard);
    this.sceneMgr.scene.add(this.vibeMotor.group);

    // 7. Active Piezo Buzzer (Developer audio cue)
    this.buzzer = new Buzzer(this.breadboard);
    this.sceneMgr.scene.add(this.buzzer.group);

    // 8. 2N2222 Transistor + 1N4148 Diode + Resistors
    this.transCircuit = new TransistorCircuit(this.breadboard);
    this.sceneMgr.scene.add(this.transCircuit.group);

    // 9. 0.96" SSD1306 OLED Display
    this.oled = new OLEDDisplay(this.breadboard);
    this.sceneMgr.scene.add(this.oled.group);

    // 10. 3D Smartphone Companion (BLE Receiver on desk)
    this.phone = new PhoneCompanion();
    this.sceneMgr.scene.add(this.phone.group);

    // 11. Realistic Jumper Wire Routing System (with animated electron flow & inspector)
    this.wireManager = new WireManager(this.breadboard);
    this.sceneMgr.scene.add(this.wireManager.group);

    // 12. 3D Floating Engineering Labels with Leader Lines
    this.floatingLabels = new FloatingLabels(this.breadboard, this.sceneMgr.camera);
    this.sceneMgr.scene.add(this.floatingLabels.group);

    // 13. Explosion Manager for SolidWorks style vertical lift
    this.explosionMgr = new ExplosionManager({
      oled: this.oled,
      inmp441: this.inmp441,
      esp32: this.esp32,
      rgbLed: this.rgbLed,
      capacitors: this.capacitors,
      transCircuit: this.transCircuit,
      buzzer: this.buzzer,
      vibeMotor: this.vibeMotor,
      breadboard: this.breadboard,
      wireManager: this.wireManager
    });

    // 14. Cinematic 5-Stage Story Simulator
    this.storySim = new StorySimulator(this);

    // 15. Split-View Interactive Schematic Diagram
    this.schematicView = new SchematicView(this);

    // Register interactive components for hover tooltips & focus
    this.interactiveObjects = [
      this.esp32.group,
      this.inmp441.group,
      this.oled.group,
      this.rgbLed.group,
      this.vibeMotor.group,
      this.buzzer.group,
      this.phone.group,
      ...this.capacitors.group.children,
      ...this.transCircuit.group.children
    ];

    this.wireMeshes = this.wireManager.wireRecords.map(w => w.wireMesh);
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.isPointerDown = false;
    this.currentlyHoveredWireId = null;

    let hoverRafPending = false;
    let lastClientX = 0;
    let lastClientY = 0;

    // Mouse move for hover tooltips & circuit path preview (throttled with RAF)
    window.addEventListener('mousemove', (event) => {
      if (this.isPointerDown) return;

      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      lastClientX = event.clientX;
      lastClientY = event.clientY;

      if (!hoverRafPending) {
        hoverRafPending = true;
        requestAnimationFrame(() => {
          hoverRafPending = false;
          if (!this.isPointerDown) {
            this.checkHover(lastClientX, lastClientY);
          }
        });
      }
    });

    let downX = 0;
    let downY = 0;
    let downTime = 0;

    window.addEventListener('pointerdown', (event) => {
      if (event.target === this.canvas) {
        this.isPointerDown = true;
        this.ui.hideTooltip();
      }
      if (event.button !== 0 || event.target !== this.canvas) return;
      downX = event.clientX;
      downY = event.clientY;
      downTime = performance.now();
    });

    window.addEventListener('pointercancel', () => {
      this.isPointerDown = false;
    });

    // Single click for 3D buttons, wires, & opening component details drawer (only if not dragging camera)
    window.addEventListener('pointerup', (event) => {
      this.isPointerDown = false;
      if (event.button !== 0 || event.target !== this.canvas) return;

      const dist = Math.hypot(event.clientX - downX, event.clientY - downY);
      const elapsed = performance.now() - downTime;
      // If user dragged to rotate camera or held down, do not trigger click
      if (dist > 6 || elapsed > 350) return;

      this.raycaster.setFromCamera(this.mouse, this.sceneMgr.camera);

      // 1. Check jumper wires (non-recursive)
      const wireIntersects = this.raycaster.intersectObjects(this.wireMeshes, false);
      if (wireIntersects.length > 0) {
        const hitWire = wireIntersects[0].object;
        if (hitWire.userData?.id) {
          this.inspectPinConnection(hitWire.userData.id);
          return;
        }
      }

      // 2. Check all interactive components to open the details drawer
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root.parent && root.parent !== this.sceneMgr.scene && !root.userData?.name) {
          root = root.parent;
        }
        if (root && root.userData?.name) {
          this.activeComponentMesh = root;
          this.ui.showDrawer(root.userData);

          // Isolate circuit path for this component
          this.isolateComponentCircuit(root.userData.name);
        }
      }
    });

    // Double click to focus camera on component
    window.addEventListener('dblclick', (event) => {
      if (event.target !== this.canvas) return;

      this.raycaster.setFromCamera(this.mouse, this.sceneMgr.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root.parent && root.parent !== this.sceneMgr.scene && !root.userData?.name) {
          root = root.parent;
        }
        if (root) {
          this.sceneMgr.focusOnObject(root);
        }
      }
    });
  }

  checkHover(clientX, clientY) {
    if (!this.canvas || this.isPointerDown) return;

    this.raycaster.setFromCamera(this.mouse, this.sceneMgr.camera);

    // Check wires first (non-recursive)
    const wireIntersects = this.raycaster.intersectObjects(this.wireMeshes, false);
    if (wireIntersects.length > 0) {
      const wireMesh = wireIntersects[0].object;
      const data = wireMesh.userData;
      if (data) {
        this.hoveredObject = wireMesh;
        this.canvas.style.cursor = 'pointer';
        this.ui.showTooltip(clientX, clientY, {
          category: 'JUMPER WIRE CONNECTION',
          name: `${data.fromPin} ➔ ${data.toPin}`,
          desc: `${data.fromHole} ➔ ${data.toHole}`,
          specs: [
            `Color: ${data.colorName || 'Wire'}`,
            `Net: ${data.net?.toUpperCase() || 'SIGNAL'}`,
            `Role: ${data.role || data.name}`
          ]
        });

        if (!this.activeInspectedWireId && this.currentlyHoveredWireId !== data.id) {
          this.currentlyHoveredWireId = data.id;
          this.previewPinConnection(data.id);
        }
        return;
      }
    }

    // Check components
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
    if (intersects.length > 0) {
      let root = intersects[0].object;
      while (root.parent && root.parent !== this.sceneMgr.scene && !root.userData?.name) {
        root = root.parent;
      }
      if (root && root.userData?.name) {
        this.hoveredObject = root;
        this.canvas.style.cursor = 'pointer';
        this.ui.showTooltip(clientX, clientY, root.userData);

        if (this.currentlyHoveredWireId !== null) {
          this.currentlyHoveredWireId = null;
          if (!this.activeInspectedWireId) {
            this.wireManager.clearConnectionHighlight();
          }
        }
        return;
      }
    }

    // Nothing hovered
    if (this.hoveredObject !== null || this.currentlyHoveredWireId !== null) {
      this.hoveredObject = null;
      this.currentlyHoveredWireId = null;
      this.canvas.style.cursor = 'grab';
      this.ui.hideTooltip();

      if (!this.activeInspectedWireId) {
        this.wireManager.clearConnectionHighlight();
      }
    }
  }

  inspectPinConnection(wireId) {
    this.activeInspectedWireId = wireId;
    const res = this.wireManager.highlightConnection(wireId);
    if (!res) return;

    // Focus camera onto the two pin coordinates
    this.sceneMgr.focusOnPinConnection(res.pStart, res.pEnd);

    // Show on-screen HUD banner
    const hud = document.getElementById('connection-hud-banner');
    const title = document.getElementById('hud-connection-title');
    const desc = document.getElementById('hud-connection-desc');

    if (hud && title && desc) {
      title.textContent = `${res.wire.fromPin} ➔ ${res.wire.toPin}`;
      desc.textContent = `${res.wire.fromHole} ➔ ${res.wire.toHole} | ${res.wire.role || res.wire.name}`;
      hud.classList.remove('hidden');
    }
  }

  previewPinConnection(wireId) {
    if (this.activeInspectedWireId) return;
    this.wireManager.highlightConnection(wireId);
  }

  resetPinInspection() {
    this.activeInspectedWireId = null;
    this.wireManager.clearConnectionHighlight();
    const hud = document.getElementById('connection-hud-banner');
    hud?.classList.add('hidden');
    this.sceneMgr.setCameraView('pins');
  }

  isolateComponentCircuit(compName) {
    const netMap = {
      'INMP441 I2S Microphone': 'i2s',
      '0.96" I2C OLED Display (SSD1306)': 'i2c',
      '10mm Coin Vibration Motor': 'motor',
      '2N2222 NPN BJT Transistor': 'gpio18',
      '5mm Common Cathode RGB LED': 'led',
      'Active Piezo Buzzer': 'buzzer',
      'ESP32-S3 DevKitC-1': 'power'
    };
    const target = netMap[compName] || 'all';
    this.wireManager.highlightPath(target);
  }

  initUI() {
    this.ui = new OverlayUI({
      onCameraChange: (viewKey) => this.sceneMgr.setCameraView(viewKey),
      onNetFilter: (netKey) => this.wireManager.filterNet(netKey),
      onTriggerAlert: (alertType) => this.triggerAlert(alertType),
      onToggleAudio: () => this.soundSynth.toggleMute(),
      onExplodeChange: (factor) => this.explosionMgr.setFactor(factor),
      onToggleExplode: () => this.explosionMgr.toggle(),
      onOpacityChange: (alpha) => this.breadboard.setOpacity(alpha),
      onToggleXRay: () => this.sceneMgr.toggleXRay(),
      onToggleLabels: () => this.floatingLabels.toggle(),
      onToggleSchematic: () => this.schematicView.toggle(),
      onPlayStory: (soundType) => this.storySim.playStory(soundType),
      onStopStory: () => this.storySim.stop(),
      onFocusComponent: () => {
        if (this.activeComponentMesh) {
          this.sceneMgr.focusOnObject(this.activeComponentMesh);
        }
      },
      onIsolateCircuit: (data) => {
        this.isolateComponentCircuit(data.name);
      }
    });

    // Initialize Pin Connections Modal & Wiring Map
    this.pinModal = new PinConnectionsModal(this);

    // Reset HUD banner button
    document.getElementById('btn-hud-reset')?.addEventListener('click', () => {
      this.resetPinInspection();
    });

    // Initialize in listening mode
    this.triggerAlert('listening');
  }

  triggerAlert(type) {
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }

    this.currentAlert = type;

    if (type === 'fire') {
      // 1. Red LED Blinking
      this.rgbLed.setColor(0xef4444, 1.0, true);
      // 2. Continuous Heavy Haptic Vibration
      this.vibeMotor.setVibration(1.0, null);
      // 3. OLED: FIRE ALARM DETECTED
      this.oled.setState('fire');
      // 4. Sound: 3.1 kHz Siren Tone
      this.soundSynth.playAlert('fire');
      // 5. UI Status & Telemetry
      this.ui.updateStatus('fire', 'ALERT: FIRE ALARM DETECTED (3.1 kHz)');
      this.ui.updateTelemetry(100, 94);
      // 6. Smartphone Push Notification
      this.phone.setNotification('fire', 'FIRE ALARM DETECTED', 'Emergency Smoke Alarm (3.1 kHz) • 94 dB', '99.4%');

    } else if (type === 'doorbell') {
      // 1. Blue LED
      this.rgbLed.setColor(0x00f0ff, 0.9, false);
      // 2. 2 Vibration Pulses
      this.vibeMotor.setVibration(0.85, 'double-pulse');
      // 3. OLED: DOORBELL DETECTED
      this.oled.setState('doorbell');
      // 4. Sound: Two-Tone Chime
      this.soundSynth.playAlert('doorbell');
      // 5. UI Status & Telemetry
      this.ui.updateStatus('doorbell', 'ALERT: DOORBELL DETECTED (CHIME)');
      this.ui.updateTelemetry(85, 78);
      // 6. Smartphone Push Notification
      this.phone.setNotification('doorbell', 'DOORBELL DETECTED', 'Front Door Two-Tone Chime • 78 dB', '98.7%');

    } else if (type === 'baby') {
      // 1. Warm Yellow LED
      this.rgbLed.setColor(0xf59e0b, 0.9, false);
      // 2. 3 Short Vibrations
      this.vibeMotor.setVibration(0.75, 'triple-pulse');
      // 3. OLED: BABY CRYING
      this.oled.setState('baby');
      // 4. Sound: Modulated Distress Cry
      this.soundSynth.playAlert('baby');
      // 5. UI Status & Telemetry
      this.ui.updateStatus('baby', 'ALERT: BABY CRYING DETECTED');
      this.ui.updateTelemetry(75, 82);
      // 6. Smartphone Push Notification
      this.phone.setNotification('baby', 'BABY CRYING DETECTED', 'Infant Distress Frequency Modulation • 82 dB', '95.8%');

    } else if (type === 'horn') {
      // 1. Bright Orange LED
      this.rgbLed.setColor(0xf97316, 1.0, false);
      // 2. Long Heavy Vibration
      this.vibeMotor.setVibration(0.95, 'long-pulse');
      // 3. OLED: VEHICLE HORN
      this.oled.setState('horn');
      // 4. Sound: Dual Tone Blast
      this.soundSynth.playAlert('horn');
      // 5. UI Status & Telemetry
      this.ui.updateStatus('horn', 'ALERT: VEHICLE HORN DETECTED');
      this.ui.updateTelemetry(95, 96);
      // 6. Smartphone Push Notification
      this.phone.setNotification('horn', 'VEHICLE HORN DETECTED', 'Automotive Dual-Tone Blast • 96 dB', '99.1%');

    } else {
      // Listening / Ambient Mode
      this.rgbLed.setColor(0x00f0ff, 0.25, false);
      this.vibeMotor.setVibration(0);
      this.oled.setState('listening');
      this.phone.clearNotification();
      this.soundSynth.stopAll();
      this.ui.updateStatus('listening', 'ESP32-S3: LISTENING...');
      this.ui.updateTelemetry(0, 42);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    // Update animations & physics
    TWEEN.update();
    this.rgbLed.update(deltaTime);
    this.vibeMotor.update(deltaTime);
    this.oled.update(deltaTime);
    this.wireManager.update(deltaTime); // Electron current flow
    this.phone.update(deltaTime);

    // Render 3D Scene
    this.sceneMgr.render();
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new EchoSenseApp();
});
