export class OverlayUI {
  constructor(callbacks) {
    this.callbacks = callbacks;

    this.tooltipEl = document.getElementById('component-tooltip');
    this.tooltipCat = document.getElementById('tooltip-category');
    this.tooltipTitle = document.getElementById('tooltip-title');
    this.tooltipDesc = document.getElementById('tooltip-desc');
    this.tooltipSpecs = document.getElementById('tooltip-specs');

    this.statusBadge = document.getElementById('device-status-badge');
    this.statusDot = this.statusBadge?.querySelector('.status-dot');
    this.statusText = document.getElementById('status-text');

    this.hapticValEl = document.getElementById('tel-haptic-val');
    this.hapticBarEl = document.getElementById('tel-haptic-bar');
    this.micValEl = document.getElementById('tel-mic-val');
    this.micBarEl = document.getElementById('tel-mic-bar');
    this.aiStatusEl = document.getElementById('tel-ai-status');
    this.confidenceEl = document.getElementById('tel-confidence');
    this.telDetectedSound = document.getElementById('tel-detected-sound');
    this.telInferTime = document.getElementById('tel-infer-time');
    this.cpuLoadVal = document.getElementById('cpu-load-val');
    this.cpuBar = document.getElementById('cpu-bar');
    this.ramLoadVal = document.getElementById('ram-load-val');
    this.ramBar = document.getElementById('ram-bar');

    this.valExploded = document.getElementById('val-exploded');
    this.sliderExploded = document.getElementById('slider-exploded');

    this.modalEl = document.getElementById('pinout-modal');
    this.audioBtn = document.getElementById('btn-audio-toggle');
    this.audioLabel = document.getElementById('audio-btn-label');

    // Component Drawer elements
    this.drawerEl = document.getElementById('component-drawer');
    this.drawerCat = document.getElementById('drawer-cat');
    this.drawerTitle = document.getElementById('drawer-title');
    this.drawerDesc = document.getElementById('drawer-desc');
    this.drawerRole = document.getElementById('drawer-role');
    this.drawerVoltage = document.getElementById('drawer-voltage');
    this.drawerProtocol = document.getElementById('drawer-protocol');
    this.drawerGpios = document.getElementById('drawer-gpios');
    this.drawerStatus = document.getElementById('drawer-status');
    this.drawerConn = document.getElementById('drawer-connections');
    this.activeDrawerData = null;

    // Pin Connection Inspector HUD elements
    this.hudBanner = document.getElementById('connection-hud-banner');
    this.hudSrcPin = document.getElementById('hud-src-pin');
    this.hudWireDesc = document.getElementById('hud-wire-desc');
    this.hudDestComp = document.getElementById('hud-dest-comp');
    this.hudDestPin = document.getElementById('hud-dest-pin');
    this.hudNetBadge = document.getElementById('hud-net-badge');
    this.hudDesc = document.getElementById('hud-connection-desc');

    this.initEvents();
  }

  initEvents() {
    // Clean View toggle
    document.getElementById('btn-clean-view')?.addEventListener('click', () => {
      document.body.classList.toggle('clean-mode');
    });

    // Component Drawer buttons
    document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
      this.closeDrawer();
    });

    document.getElementById('btn-drawer-focus')?.addEventListener('click', () => {
      if (this.activeDrawerData && this.callbacks.onFocusComponent) {
        this.callbacks.onFocusComponent(this.activeDrawerData);
      }
    });

    document.getElementById('btn-drawer-isolate')?.addEventListener('click', () => {
      if (this.activeDrawerData && this.callbacks.onIsolateCircuit) {
        this.callbacks.onIsolateCircuit(this.activeDrawerData);
      }
    });
    // Camera toolbar presets
    document.querySelectorAll('.cam-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view');
        this.callbacks.onCameraChange(view);
      });
    });

    // Connection Legend chips (Always-visible net isolation)
    document.querySelectorAll('.legend-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.legend-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const net = chip.getAttribute('data-net');
        this.callbacks.onNetFilter(net);
      });
    });

    // Breadboard Transparency Stepper (100%, 75%, 50%, 25%, 0% - Hide Plastic Completely)
    document.querySelectorAll('.trans-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.trans-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const alpha = parseFloat(btn.getAttribute('data-opacity'));
        this.callbacks.onOpacityChange(alpha);
      });
    });

    // Pin Inspector Reset button
    document.getElementById('btn-hud-reset')?.addEventListener('click', () => {
      this.hidePinInspector();
      if (this.callbacks.onResetInspection) {
        this.callbacks.onResetInspection();
      }
    });

    // Alert trigger buttons (Software simulation dock)
    document.querySelectorAll('.alert-trigger-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const alertType = btn.getAttribute('data-alert');
        this.callbacks.onTriggerAlert(alertType);
      });
    });

    // Exploded View Slider & Button
    this.sliderExploded?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 100;
      this.valExploded.textContent = `${Math.round(val * 100)}%`;
      this.callbacks.onExplodeChange(val);
    });

    document.getElementById('btn-toggle-explode')?.addEventListener('click', () => {
      const isExp = this.callbacks.onToggleExplode();
      const pct = isExp ? 100 : 0;
      this.sliderExploded.value = pct;
      this.valExploded.textContent = `${pct}%`;
    });

    // X-Ray Mode Toggle
    const xrayBtn = document.getElementById('btn-xray-toggle');
    xrayBtn?.addEventListener('click', () => {
      const isXRay = this.callbacks.onToggleXRay();
      xrayBtn.classList.toggle('primary-btn', isXRay);
    });

    // 3D Floating Labels Toggle
    const labelsBtn = document.getElementById('btn-labels-toggle');
    labelsBtn?.addEventListener('click', () => {
      const isVisible = this.callbacks.onToggleLabels();
      labelsBtn.classList.toggle('primary-btn', isVisible);
    });

    // Split-View Interactive Schematic Toggle
    const schBtn = document.getElementById('btn-schematic-toggle');
    schBtn?.addEventListener('click', () => {
      const isOpen = this.callbacks.onToggleSchematic();
      schBtn.classList.toggle('primary-btn', isOpen);
    });

    // Cinematic Story Simulation Button
    document.getElementById('btn-story-sim')?.addEventListener('click', () => {
      this.callbacks.onPlayStory('fire');
    });

    document.getElementById('btn-stop-story')?.addEventListener('click', () => {
      this.callbacks.onStopStory();
    });

    // Audio toggle
    this.audioBtn?.addEventListener('click', () => {
      const isMuted = this.callbacks.onToggleAudio();
      this.audioLabel.textContent = isMuted ? 'Sound: OFF' : 'Sound: ON';
      this.audioBtn.style.opacity = isMuted ? '0.6' : '1.0';
    });

    // Pinout modal
    document.getElementById('btn-pinout-modal')?.addEventListener('click', () => {
      this.modalEl.classList.remove('hidden');
    });

    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      this.modalEl.classList.add('hidden');
    });

    this.modalEl?.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.modalEl.classList.add('hidden');
      }
    });
  }

  showDrawer(data) {
    if (!data) return;
    this.activeDrawerData = data;

    this.drawerCat.textContent = data.category || 'HARDWARE COMPONENT';
    this.drawerTitle.textContent = data.name || 'Component Details';
    this.drawerDesc.textContent = data.desc || '';
    this.drawerRole.textContent = data.role || data.desc || 'Primary functional module in the assistive prototype pipeline.';

    // Detailed engineering specifications
    const specsMap = {
      'INMP441 I2S Microphone': {
        voltage: '3.3V DC (VDD Rail)',
        protocol: 'I2S (24-bit PCM Mono DMA)',
        gpios: 'GPIO4 (WS), GPIO5 (SCK), GPIO6 (SD)',
        status: 'Active (Sampling @ 16,000 Hz)'
      },
      'ESP32-S3 DevKitC-1': {
        voltage: '5.0V USB / 3.3V LDO Out',
        protocol: 'I2S, I2C, PWM, BLE 5.0 GATT',
        gpios: 'GPIO4-6, 14, 15-18, 21-22',
        status: 'Running (Xtensa Dual LX7 @ 240MHz)'
      },
      '0.96" I2C OLED Display (SSD1306)': {
        voltage: '3.3V DC (VCC Rail)',
        protocol: 'I2C Fast Mode (400 kHz)',
        gpios: 'GPIO21 (SDA), GPIO22 (SCL)',
        status: 'Active (128x64 Dynamic Framebuffer)'
      },
      '10mm Coin Vibration Motor': {
        voltage: '5.0V DC (VBUS USB Rail)',
        protocol: 'Low-Side Transistor Switched',
        gpios: 'GPIO18 (PWM to 2N2222 Base)',
        status: 'Tactile Haptic Actuator (12,000 RPM)'
      },
      '5mm Common Cathode RGB LED': {
        voltage: '3.3V DC (220Ω Current Limited)',
        protocol: 'Direct GPIO Tri-State PWM',
        gpios: 'GPIO15 (R), GPIO16 (G), GPIO17 (B)',
        status: 'Tri-Color Visual Indicator'
      },
      '2N2222 NPN BJT Transistor': {
        voltage: '5.0V Collector / 0.7V Base',
        protocol: 'Low-Side Saturation Driver',
        gpios: 'GPIO18 (1kΩ Base Resistor)',
        status: 'Sinking 80mA Motor Current'
      },
      'Active Piezo Buzzer': {
        voltage: '5.0V DC (USB VBUS Rail)',
        protocol: 'Direct Digital Logic Out',
        gpios: 'GPIO14 (Active HIGH)',
        status: 'Auditory Debugging Transducer'
      }
    };

    const sp = specsMap[data.name] || {
      voltage: '3.3V / 5.0V DC',
      protocol: 'Discrete Hardware Net',
      gpios: 'Direct Breadboard Tie Point',
      status: 'Passive Circuit Element'
    };

    if (this.drawerVoltage) this.drawerVoltage.textContent = sp.voltage;
    if (this.drawerProtocol) this.drawerProtocol.textContent = sp.protocol;
    if (this.drawerGpios) this.drawerGpios.textContent = sp.gpios;
    if (this.drawerStatus) this.drawerStatus.textContent = sp.status;

    // Populate connections table
    this.drawerConn.innerHTML = '';
    const connMap = {
      'INMP441 I2S Microphone': [
        { pin: 'VDD', dest: '3.3V Power Rail', type: 'Power (3.3V)' },
        { pin: 'GND', dest: 'GND Power Rail', type: 'Ground (0V)' },
        { pin: 'SCK', dest: 'ESP32 GPIO5', type: 'I2S Bit Clock' },
        { pin: 'WS', dest: 'ESP32 GPIO4', type: 'I2S Word Select' },
        { pin: 'SD', dest: 'ESP32 GPIO6', type: 'I2S Serial Data' },
        { pin: 'L/R', dest: 'GND Power Rail', type: 'Left Channel Select' }
      ],
      'ESP32-S3 DevKitC-1': [
        { pin: '3V3', dest: 'Top Power Rail (+)', type: 'Regulated 3.3V Out' },
        { pin: '5V (VBUS)', dest: 'Bottom Rail (+)', type: 'USB 5V High Current' },
        { pin: 'GPIO4-6', dest: 'INMP441 Microphone', type: 'Digital I2S Stream' },
        { pin: 'GPIO15-17', dest: '220Ω Resistors → RGB', type: 'PWM Color Drive' },
        { pin: 'GPIO18', dest: '1kΩ → 2N2222 Base', type: 'Motor Switch Signal' },
        { pin: 'GPIO14', dest: 'Active Buzzer (+)', type: 'Acoustic Cue Out' },
        { pin: 'GPIO21-22', dest: 'SSD1306 OLED', type: 'I2C Bus (SDA/SCL)' }
      ],
      '0.96" I2C OLED Display (SSD1306)': [
        { pin: 'VCC', dest: '3.3V Power Rail', type: '3.3V Logic Power' },
        { pin: 'GND', dest: 'GND Power Rail', type: 'Ground (0V)' },
        { pin: 'SDA', dest: 'ESP32 GPIO21', type: 'I2C Serial Data' },
        { pin: 'SCL', dest: 'ESP32 GPIO22', type: 'I2C Serial Clock' }
      ],
      '10mm Coin Vibration Motor': [
        { pin: 'Positive (+)', dest: '5V Rail (USB VBUS)', type: '5V High-Torque' },
        { pin: 'Negative (-)', dest: '2N2222 Collector', type: 'Low-Side Switched' },
        { pin: '1N4148 Diode', dest: 'Across Motor Terminals', type: 'Flyback Clamp' }
      ],
      '5mm Common Cathode RGB LED': [
        { pin: 'Common Cathode', dest: 'GND Rail', type: 'Shared Ground' },
        { pin: 'Red Anode', dest: '220Ω → GPIO15', type: 'Current Limited' },
        { pin: 'Green Anode', dest: '220Ω → GPIO16', type: 'Current Limited' },
        { pin: 'Blue Anode', dest: '220Ω → GPIO17', type: 'Current Limited' }
      ],
      '2N2222 NPN BJT Transistor': [
        { pin: 'Base', dest: '1kΩ → GPIO18', type: 'Base Drive (2.6mA)' },
        { pin: 'Collector', dest: 'Motor Negative', type: '5V Sinking' },
        { pin: 'Emitter', dest: 'GND Rail', type: 'Reference Ground' }
      ],
      'Active Piezo Buzzer': [
        { pin: 'Positive (+)', dest: 'ESP32 GPIO14', type: 'Digital Drive (5V)' },
        { pin: 'Negative (-)', dest: 'GND Rail', type: 'Ground Return (0V)' }
      ]
    };

    const conns = connMap[data.name] || [
      { pin: 'Signal / Power', dest: 'Breadboard Circuit', type: 'Standard Net' }
    ];

    conns.forEach(c => {
      const row = document.createElement('div');
      row.className = 'conn-row';
      row.innerHTML = `
        <span class="conn-pin">${c.pin}</span>
        <span class="conn-dest">${c.dest}</span>
        <span class="conn-type">${c.type}</span>
      `;
      this.drawerConn.appendChild(row);
    });

    this.drawerEl.classList.remove('hidden');
  }

  closeDrawer() {
    this.drawerEl.classList.add('hidden');
    this.activeDrawerData = null;
  }

  showPinInspector(pathway) {
    if (!pathway) return;
    if (this.hudSrcPin) this.hudSrcPin.textContent = pathway.espPin || 'GPIO';
    if (this.hudWireDesc) this.hudWireDesc.textContent = pathway.wireName || 'Jumper Wire';
    if (this.hudDestComp) this.hudDestComp.textContent = pathway.destComp || 'Component';
    if (this.hudDestPin) this.hudDestPin.textContent = pathway.destPin || 'Pin';
    if (this.hudNetBadge) this.hudNetBadge.textContent = (pathway.net || 'SIGNAL').toUpperCase();
    if (this.hudDesc) this.hudDesc.textContent = pathway.purpose || '';
    if (this.hudBanner) this.hudBanner.classList.remove('hidden');
  }

  hidePinInspector() {
    if (this.hudBanner) this.hudBanner.classList.add('hidden');
  }

  showTooltip(x, y, data) {
    if (!data) {
      this.hideTooltip();
      return;
    }

    this.tooltipCat.textContent = data.category || 'HARDWARE COMPONENT';
    this.tooltipTitle.textContent = data.name || 'Component';
    this.tooltipDesc.textContent = data.desc || '';

    this.tooltipSpecs.innerHTML = '';
    if (data.specs && Array.isArray(data.specs)) {
      data.specs.forEach((spec, i) => {
        const pill = document.createElement('span');
        pill.className = `spec-pill ${i === 0 ? 'highlight' : ''}`;
        pill.textContent = spec;
        this.tooltipSpecs.appendChild(pill);
      });
    }

    const tooltipW = 320;
    const tooltipH = 220;
    const posX = Math.min(window.innerWidth - tooltipW - 20, x + 15);
    const posY = Math.max(80, Math.min(window.innerHeight - tooltipH - 20, y - 60));

    this.tooltipEl.style.left = `${posX}px`;
    this.tooltipEl.style.top = `${posY}px`;
    this.tooltipEl.classList.remove('hidden');
  }

  hideTooltip() {
    this.tooltipEl.classList.add('hidden');
  }

  updateStatus(statusKey, label) {
    this.statusText.textContent = label;

    this.statusDot.className = 'status-dot';
    if (statusKey === 'listening') {
      this.statusDot.classList.add('green');
      this.statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      this.statusBadge.style.background = 'rgba(16, 185, 129, 0.1)';
      this.statusText.style.color = '#34d399';
      this.confidenceEl.textContent = '---';
      this.aiStatusEl.textContent = 'RUNNING (31ms)';
      if (this.telDetectedSound) this.telDetectedSound.textContent = 'AMBIENT (LISTENING)';
      if (this.telInferTime) this.telInferTime.textContent = '31 ms (1D-CNN)';
      if (this.cpuLoadVal) this.cpuLoadVal.textContent = '16% (Dual Core)';
      if (this.cpuBar) this.cpuBar.style.width = '16%';
    } else if (statusKey === 'fire') {
      this.statusDot.classList.add('red');
      this.statusBadge.style.borderColor = 'rgba(239, 68, 68, 0.5)';
      this.statusBadge.style.background = 'rgba(239, 68, 68, 0.2)';
      this.statusText.style.color = '#f87171';
      this.confidenceEl.textContent = '99.4%';
      this.aiStatusEl.textContent = 'ALERT (31ms)';
      if (this.telDetectedSound) this.telDetectedSound.textContent = '🔥 FIRE ALARM (3.1 kHz)';
      if (this.telInferTime) this.telInferTime.textContent = '31 ms (Inference)';
      if (this.cpuLoadVal) this.cpuLoadVal.textContent = '26% (DSP Active)';
      if (this.cpuBar) this.cpuBar.style.width = '26%';
    } else if (statusKey === 'doorbell') {
      this.statusDot.classList.add('blue');
      this.statusBadge.style.borderColor = 'rgba(56, 189, 248, 0.5)';
      this.statusBadge.style.background = 'rgba(56, 189, 248, 0.2)';
      this.statusText.style.color = '#38bdf8';
      this.confidenceEl.textContent = '98.7%';
      this.aiStatusEl.textContent = 'ALERT (33ms)';
      if (this.telDetectedSound) this.telDetectedSound.textContent = '🔔 DOORBELL (Chime)';
      if (this.telInferTime) this.telInferTime.textContent = '33 ms (Inference)';
      if (this.cpuLoadVal) this.cpuLoadVal.textContent = '21% (DSP Active)';
      if (this.cpuBar) this.cpuBar.style.width = '21%';
    } else if (statusKey === 'baby') {
      this.statusDot.classList.add('yellow');
      this.statusBadge.style.borderColor = 'rgba(245, 158, 11, 0.5)';
      this.statusBadge.style.background = 'rgba(245, 158, 11, 0.2)';
      this.statusText.style.color = '#fbbf24';
      this.confidenceEl.textContent = '95.8%';
      this.aiStatusEl.textContent = 'ALERT (34ms)';
      if (this.telDetectedSound) this.telDetectedSound.textContent = '👶 BABY CRY (Harmonic)';
      if (this.telInferTime) this.telInferTime.textContent = '34 ms (Inference)';
      if (this.cpuLoadVal) this.cpuLoadVal.textContent = '22% (DSP Active)';
      if (this.cpuBar) this.cpuBar.style.width = '22%';
    } else if (statusKey === 'horn') {
      this.statusDot.classList.add('orange');
      this.statusBadge.style.borderColor = 'rgba(249, 115, 22, 0.5)';
      this.statusBadge.style.background = 'rgba(249, 115, 22, 0.2)';
      this.statusText.style.color = '#fb923c';
      this.confidenceEl.textContent = '99.1%';
      this.aiStatusEl.textContent = 'ALERT (32ms)';
      if (this.telDetectedSound) this.telDetectedSound.textContent = '🚗 CAR HORN (Dual-Tone)';
      if (this.telInferTime) this.telInferTime.textContent = '32 ms (Inference)';
      if (this.cpuLoadVal) this.cpuLoadVal.textContent = '24% (DSP Active)';
      if (this.cpuBar) this.cpuBar.style.width = '24%';
    }

    document.querySelectorAll('.alert-trigger-btn').forEach(b => {
      if (b.getAttribute('data-alert') === statusKey) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  updateTelemetry(hapticPercent, micDb) {
    this.hapticValEl.textContent = hapticPercent > 0 ? `${hapticPercent}% (ACTIVE)` : '0% (IDLE)';
    this.hapticBarEl.style.width = `${hapticPercent}%`;

    this.micValEl.textContent = `${micDb} dB`;
    const micPercent = Math.min(100, Math.max(10, ((micDb - 30) / 70) * 100));
    this.micBarEl.style.width = `${micPercent}%`;
  }
}
