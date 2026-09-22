import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export class StorySimulator {
  constructor(app) {
    this.app = app;
    this.isPlaying = false;
    this.currentTimeout = null;

    // 3D Sound Wave Visualizer mesh (concentric spheres expanding into microphone)
    this.createSoundWaveMesh();
  }

  createSoundWaveMesh() {
    this.waveGroup = new THREE.Group();
    this.waveGroup.name = 'Acoustic_Sound_Waves';
    this.waves = [];

    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: 0
    });

    for (let i = 0; i < 4; i++) {
      const geo = new THREE.RingGeometry(0.3, 0.35, 32);
      const mesh = new THREE.Mesh(geo, waveMat.clone());
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      this.waveGroup.add(mesh);
      this.waves.push({ mesh, scale: 0.5 + i * 0.5 });
    }

    this.app.sceneMgr.scene.add(this.waveGroup);
  }

  playStory(soundType = 'fire') {
    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;
    this.soundType = soundType;

    const banner = document.getElementById('story-banner');
    if (banner) {
      banner.classList.remove('hidden');
    }

    // STAGE 1: Sound Inbound to Microphone (0.0s - 1.8s)
    this.stage1_AcousticCapture();
  }

  updateBanner(stageNum, title, desc) {
    const titleEl = document.getElementById('story-stage-title');
    const descEl = document.getElementById('story-stage-desc');
    if (titleEl) titleEl.textContent = `Stage ${stageNum}/5: ${title}`;
    if (descEl) descEl.textContent = desc;
  }

  stage1_AcousticCapture() {
    this.updateBanner(
      '1',
      'INMP441 Acoustic Sound Wave Capture',
      'Environmental sound waves travel through the air into the INMP441 MEMS gold acoustic port (16 kHz 24-bit sampling).'
    );

    // 1. Camera swoops to INMP441
    const micPos = this.app.inmp441.group.position;
    this.app.sceneMgr.smoothTransition(
      new THREE.Vector3(micPos.x - 2.5, micPos.y + 3.0, micPos.z + 3.0),
      new THREE.Vector3(micPos.x, micPos.y + 0.5, micPos.z),
      1200
    );

    // 2. Play acoustic tone
    this.app.soundSynth.playAlert(this.soundType);

    // 3. Position sound waves over microphone
    this.waveGroup.position.set(micPos.x, micPos.y + 0.2, micPos.z);
    this.waves.forEach((w, i) => {
      w.mesh.visible = true;
      w.mesh.material.opacity = 0.8;
      w.mesh.scale.set(1.5, 1.5, 1.5);

      new TWEEN.Tween(w.mesh.scale)
        .to({ x: 0.2, y: 0.2, z: 0.2 }, 1200)
        .delay(i * 150)
        .repeat(2)
        .start();
    });

    // Schedule Stage 2
    this.currentTimeout = setTimeout(() => {
      this.stage2_I2STransmission();
    }, 2000);
  }

  stage2_I2STransmission() {
    this.updateBanner(
      '2',
      'Digital I2S Audio Transmission',
      'High-speed digital audio bit stream transfers across SCK, WS, and SD lines directly to the ESP32-S3 internal FIFO buffer.'
    );

    // Hide sound waves
    this.waves.forEach(w => {
      w.mesh.visible = false;
    });

    // Highlight I2S wires with intense green pulse
    this.app.wireManager.highlightPath('i2s');

    // Camera pans to show path from Mic to ESP32
    this.app.sceneMgr.smoothTransition(
      new THREE.Vector3(-2.0, 7.5, 6.5),
      new THREE.Vector3(-1.5, 1.0, 0),
      1200
    );

    this.currentTimeout = setTimeout(() => {
      this.stage3_TinyMLInference();
    }, 1800);
  }

  stage3_TinyMLInference() {
    this.updateBanner(
      '3',
      'ESP32-S3 TinyML Neural Inference (34ms)',
      'Dual-core Xtensa LX7 executes quantized 1D-CNN using ESP-NN vector extensions. Confidence: 99.2%.'
    );

    // Camera zooms on ESP32 RF Shield
    const espPos = this.app.esp32.group.position;
    this.app.sceneMgr.smoothTransition(
      new THREE.Vector3(espPos.x + 1.2, espPos.y + 3.8, espPos.z + 4.2),
      new THREE.Vector3(espPos.x, espPos.y + 0.8, espPos.z),
      1000
    );

    // Pulse ESP32 LED
    this.app.esp32.group.children.forEach(c => {
      if (c.material && c.material.emissive) {
        c.material.emissiveIntensity = 1.0;
      }
    });

    this.currentTimeout = setTimeout(() => {
      this.stage4_HapticDriver();
    }, 2000);
  }

  stage4_HapticDriver() {
    this.updateBanner(
      '4',
      'GPIO18 Low-Side BJT Actuation',
      'ESP32 pulls GPIO18 HIGH through 1kΩ resistor, saturating 2N2222 NPN BJT to switch 5V power to the vibration motor.'
    );

    // Highlight GPIO18 and motor path
    this.app.wireManager.highlightPath('gpio18');

    // Camera focuses on 2N2222 and motor
    const motorPos = this.app.vibeMotor.group.position;
    this.app.sceneMgr.smoothTransition(
      new THREE.Vector3(motorPos.x - 1.0, motorPos.y + 3.5, motorPos.z + 4.0),
      new THREE.Vector3(motorPos.x - 0.5, motorPos.y + 0.5, motorPos.z),
      1200
    );

    this.currentTimeout = setTimeout(() => {
      this.stage5_MultimodalAlert();
    }, 1800);
  }

  stage5_MultimodalAlert() {
    this.updateBanner(
      '5',
      'Multimodal Alert: Haptic, Visual & Smartphone',
      'Coin motor vibrates, RGB LED flashes alert color, OLED displays detection HUD, and Smartphone receives instant push notification!'
    );

    // Trigger full alert state
    this.app.triggerAlert(this.soundType);

    // Wake up smartphone with push notification
    const alertNames = {
      fire: 'FIRE ALARM DETECTED',
      doorbell: 'DOORBELL DETECTED',
      baby: 'BABY CRYING DETECTED',
      horn: 'VEHICLE HORN DETECTED'
    };

    const alertSubs = {
      fire: 'Emergency Smoke Alarm (3.1 kHz Pulsed) • 94 dB',
      doorbell: 'Front Door Two-Tone Chime • 78 dB',
      baby: 'Infant Distress Frequency Modulation • 82 dB',
      horn: 'Automotive Warning Blast • 96 dB'
    };

    this.app.phone.setNotification(
      this.soundType,
      alertNames[this.soundType] || 'SOUND DETECTED',
      alertSubs[this.soundType] || 'Auditory cue classified',
      '99.2%'
    );

    // Camera glides smoothly to show whole setup + Smartphone
    this.app.sceneMgr.smoothTransition(
      new THREE.Vector3(4.0, 10.0, 13.0),
      new THREE.Vector3(3.0, 0.5, 0),
      1800
    );

    this.currentTimeout = setTimeout(() => {
      this.finish();
    }, 4500);
  }

  finish() {
    this.isPlaying = false;
    const banner = document.getElementById('story-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
  }

  stop() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.isPlaying = false;
    this.waves.forEach(w => {
      w.mesh.visible = false;
    });
    this.app.wireManager.resetHighlight();
    const banner = document.getElementById('story-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
  }
}
