export class OverlayUI {
  constructor(callbacks) {
    this.callbacks = callbacks;

    // Tooltip elements
    this.tooltipEl = document.getElementById('component-tooltip');
    this.tooltipCat = document.getElementById('tooltip-category');
    this.tooltipTitle = document.getElementById('tooltip-title');
    this.tooltipDesc = document.getElementById('tooltip-desc');
    this.tooltipSpecs = document.getElementById('tooltip-specs');

    // Status elements
    this.statusBadge = document.getElementById('device-status-badge');
    this.statusDot = this.statusBadge?.querySelector('.status-dot');
    this.statusText = document.getElementById('status-text');

    // Pipeline elements
    this.pipelineStrip = document.getElementById('pipeline-strip');
    this.pipelineTimer = document.getElementById('pipeline-timer');
    this.pipeNodes = {
      sound: document.getElementById('pipe-sound'),
      mic: document.getElementById('pipe-mic'),
      mcu: document.getElementById('pipe-mcu'),
      ai: document.getElementById('pipe-ai'),
      actuators: document.getElementById('pipe-actuators'),
      mobile: document.getElementById('pipe-mobile')
    };

    // Sidebar & Pinout elements
    this.sidebarPinTable = document.getElementById('sidebar-pin-table');
    this.selectedCompNameEl = document.getElementById('selected-comp-name');

    // Connection Focus HUD elements
    this.hudBanner = document.getElementById('connection-hud-banner');
    this.hudSrcPin = document.getElementById('hud-src-pin');
    this.hudWireDesc = document.getElementById('hud-wire-desc');
    this.hudDestPin = document.getElementById('hud-dest-pin');
    this.hudNetBadge = document.getElementById('hud-net-badge');
    this.hudDesc = document.getElementById('hud-connection-desc');

    // Mobile Companion Window elements
    this.mobileWindow = document.getElementById('mobile-companion-window');
    this.phoneNotifCard = document.getElementById('phone-notification-card');
    this.phoneIdleCard = document.getElementById('phone-idle-card');
    this.notifIcon = document.getElementById('notif-icon');
    this.notifTitle = document.getElementById('notif-title');
    this.notifDesc = document.getElementById('notif-desc');
    this.notifHaptic = document.getElementById('notif-haptic-pattern');

    // Signal Flow Architecture Modal
    this.signalFlowModal = document.getElementById('signal-flow-view');

    // Modal & Audio
    this.modalEl = document.getElementById('pinout-modal');
    this.audioBtn = document.getElementById('btn-audio-toggle');
    this.audioLabel = document.getElementById('audio-btn-label');
    this.xrayBtn = document.getElementById('btn-xray-toggle');
    this.xrayLabel = document.getElementById('xray-label');
    this.explodeBtn = document.getElementById('btn-explode-toggle');
    this.explodeLabel = document.getElementById('explode-label');

    this.initPinSpecsMap();
    this.initEvents();

    // Default select INMP441 in sidebar pin table
    this.populateSidebarPinout('inmp441');
  }

  initPinSpecsMap() {
    this.pinSpecsMap = {
      inmp441: {
        name: 'INMP441 I2S MICROPHONE',
        sub: '24-bit Digital Audio MEMS Transducer',
        protocol: 'I²S Bus (16 kHz)',
        voltage: '3.3V DC',
        pins: [
          { name: 'VDD', role: 'Analog & Digital Power', target: '3.3V Power Rail', pinKey: '3V3', color: 'Red', proto: 'Power' },
          { name: 'GND', role: 'Digital Ground Reference', target: 'Top - GND Rail', pinKey: 'GND', color: 'Black', proto: 'GND' },
          { name: 'WS', role: 'Left/Right Frame Sync Clock', target: 'ESP32 GPIO4', pinKey: 'GPIO4', color: 'Green', proto: 'I²S Clock' },
          { name: 'SCK', role: 'Serial Continuous Bit Clock', target: 'ESP32 GPIO5', pinKey: 'GPIO5', color: 'Green', proto: 'I²S Clock' },
          { name: 'SD', role: '24-bit Serial Audio Data Stream', target: 'ESP32 GPIO6', pinKey: 'GPIO6', color: 'Purple', proto: 'I²S Data' },
          { name: 'L/R', role: 'Channel Select (GND=Left)', target: 'Top - GND Rail', pinKey: 'GND', color: 'Black', proto: 'GND' }
        ]
      },
      esp32: {
        name: 'ESP32-S3 DevKitC-1',
        sub: 'Xtensa Dual-Core 240MHz • TinyML DSP',
        protocol: 'I²S / I²C / GPIO / BLE',
        voltage: '5.0V USB / 3.3V Core',
        pins: [
          { name: '3V3', role: 'Regulated 3.3V LDO Output', target: 'Top + 3.3V Rail', pinKey: '3V3', color: 'Red', proto: 'Power' },
          { name: '5V', role: 'Raw 5V USB VBUS Power', target: 'Bottom + 5V Rail', pinKey: '5V', color: 'Red', proto: 'Power' },
          { name: 'GND', role: 'Common Return Reference', target: 'Ground Rail', pinKey: 'GND', color: 'Black', proto: 'GND' },
          { name: 'GPIO4', role: 'I2S Word Select (WS)', target: 'INMP441 WS', pinKey: 'GPIO4', color: 'Green', proto: 'I²S' },
          { name: 'GPIO5', role: 'I2S Serial Clock (SCK)', target: 'INMP441 SCK', pinKey: 'GPIO5', color: 'Green', proto: 'I²S' },
          { name: 'GPIO6', role: 'I2S Serial Data (SD)', target: 'INMP441 SD', pinKey: 'GPIO6', color: 'Purple', proto: 'I²S' },
          { name: 'GPIO14', role: 'Active Buzzer Pulse Drive', target: 'Piezo Buzzer (+)', pinKey: 'GPIO14', color: 'Blue', proto: 'GPIO' },
          { name: 'GPIO18', role: 'Motor PWM Sinking Control', target: '2N2222 Base (1kΩ)', pinKey: 'GPIO18', color: 'Yellow', proto: 'PWM' },
          { name: 'GPIO21', role: 'I2C Serial Data (SDA)', target: 'SSD1306 SDA', pinKey: 'GPIO21', color: 'Teal', proto: 'I²C' },
          { name: 'GPIO22', role: 'I2C Serial Clock (SCL)', target: 'SSD1306 SCL', pinKey: 'GPIO22', color: 'Teal', proto: 'I²C' }
        ]
      },
      oled: {
        name: 'SSD1306 0.96" OLED DISPLAY',
        sub: '128x64 Monochrome HUD Framebuffer',
        protocol: 'I²C Bus (0x3C)',
        voltage: '3.3V DC',
        pins: [
          { name: 'VCC', role: 'Display Controller & Charge Pump', target: 'Top + 3.3V Rail', pinKey: '3V3', color: 'Red', proto: 'Power' },
          { name: 'GND', role: 'Logic Ground Reference', target: 'Top - GND Rail', pinKey: 'GND', color: 'Black', proto: 'GND' },
          { name: 'SDA', role: 'I2C Serial Data Line (400 kHz)', target: 'ESP32 GPIO21', pinKey: 'GPIO21', color: 'Teal', proto: 'I²C' },
          { name: 'SCL', role: 'I2C Serial Clock Line (400 kHz)', target: 'ESP32 GPIO22', pinKey: 'GPIO22', color: 'Teal', proto: 'I²C' }
        ]
      },
      vibeMotor: {
        name: '10mm COIN VIBRATION MOTOR',
        sub: '5V ERM Tactile Haptic Actuator',
        protocol: 'Low-Side Transistor PWM',
        voltage: '5.0V USB',
        pins: [
          { name: 'Motor (+)', role: '5V High-Current Supply & Diode Cathode', target: 'Bottom + 5V Rail', pinKey: '5V', color: 'Red', proto: 'Power' },
          { name: 'Motor (-)', role: 'Switched Ground via Transistor', target: '2N2222 Collector', pinKey: 'GPIO18', color: 'Yellow', proto: 'Actuator' },
          { name: 'Base', role: '1kΩ Current-Limiting Base Drive', target: 'ESP32 GPIO18', pinKey: 'GPIO18', color: 'Yellow', proto: 'PWM' },
          { name: 'Emitter', role: 'Ground Return Sink', target: 'Bottom - GND Rail', pinKey: 'GND', color: 'Black', proto: 'GND' }
        ]
      },
      rgbLed: {
        name: 'COMMON CATHODE RGB STATUS LED',
        sub: 'Visual Multi-Color Alert Indicator',
        protocol: 'Current-Limited GPIO Output',
        voltage: '3.3V Logic',
        pins: [
          { name: 'Cathode', role: 'Common Ground Return Pin', target: 'Top - GND Rail', pinKey: 'GND', color: 'Black', proto: 'GND' },
          { name: 'Red Anode', role: 'Red LED Die (Fire Emergency)', target: '220Ω ➔ GPIO15', pinKey: 'led_red', color: 'Orange', proto: 'GPIO' },
          { name: 'Green Anode', role: 'Green LED Die (Doorbell / OK)', target: '220Ω ➔ GPIO16', pinKey: 'led_green', color: 'Green', proto: 'GPIO' },
          { name: 'Blue Anode', role: 'Blue LED Die (Listening Status)', target: '220Ω ➔ GPIO17', pinKey: 'led_blue', color: 'Blue', proto: 'GPIO' }
        ]
      },
      buzzer: {
        name: 'ACTIVE 5V PIEZO SOUNDER',
        sub: 'Developer Auditory Debugging Cue',
        protocol: 'Direct GPIO Drive',
        voltage: '5.0V VBUS',
        pins: [
          { name: 'Buzzer (+)', role: 'Positive Signal Drive Pin', target: 'ESP32 GPIO14', pinKey: 'GPIO14', color: 'Blue', proto: 'GPIO' },
          { name: 'Buzzer (-)', role: 'Ground Return Path', target: 'Bottom - GND Rail', pinKey: 'GND', color: 'Black', proto: 'GND' }
        ]
      },
      transCircuit: {
        name: '2N2222 DRIVER & PASSIVES',
        sub: 'Low-Side Switch + 1N4148 Diode',
        protocol: 'Discrete Power Switching',
        voltage: '5.0V / 3.3V',
        pins: [
          { name: 'Base', role: '1kΩ Resistor Input', target: 'ESP32 GPIO18', pinKey: 'GPIO18', color: 'Yellow', proto: 'PWM' },
          { name: 'Collector', role: 'Switched Motor & Flyback Clamp', target: 'Motor (-) & 1N4148', pinKey: 'GPIO18', color: 'Yellow', proto: 'Driver' },
          { name: 'Emitter', role: 'Saturated Ground Sink', target: 'Bottom - GND Rail', pinKey: 'GND', color: 'Black', proto: 'GND' }
        ]
      },
      capacitors: {
        name: 'FILTER DECOUPLING CAPACITORS',
        sub: '100µF Bulk Can + 0.1µF Ceramic Filter',
        protocol: 'Power Rail Filtering',
        voltage: '3.3V DC',
        pins: [
          { name: '100µF (+)', role: 'Bulk Audio Rail Decoupling', target: 'Top + 3.3V Rail', pinKey: '3V3', color: 'Red', proto: 'Filter' },
          { name: '100µF (-)', role: 'Low-ESR Ground Return', target: 'Top - GND Rail', pinKey: 'GND', color: 'Black', proto: 'GND' },
          { name: '0.1µF VDD', role: 'High-Freq RF Noise Bypass', target: 'INMP441 Pin 1 (VDD)', pinKey: '3V3', color: 'Orange', proto: 'Bypass' },
          { name: '0.1µF GND', role: 'Direct Ground Shunt', target: 'INMP441 Pin 2 (GND)', pinKey: 'GND', color: 'Black', proto: 'GND' }
        ]
      }
    };
  }

  populateSidebarPinout(compKey) {
    this.currentCompKey = compKey;
    const data = this.pinSpecsMap[compKey];
    if (!data || !this.sidebarPinTable) return;

    if (this.selectedCompNameEl) {
      this.selectedCompNameEl.textContent = data.name;
    }

    this.sidebarPinTable.innerHTML = `
      <div class="inspector-badge-row">
        <span class="insp-proto-badge">${data.protocol}</span>
        <span class="insp-volt-badge">${data.voltage}</span>
      </div>
    `;

    data.pins.forEach(pin => {
      const row = document.createElement('div');
      row.className = 'pin-row';
      row.innerHTML = `
        <div class="pin-row-main">
          <div class="pin-title-line">
            <span class="pin-tag">${pin.name}</span>
            <span class="pin-proto">${pin.proto}</span>
          </div>
          <span class="pin-target">${pin.target}</span>
          <span class="pin-role-sub">${pin.role}</span>
        </div>
        <button class="btn-pin-focus" data-pin="${pin.pinKey}" title="Isolate single connection in 3D">Focus</button>
      `;

      // Hover on pin sends moving electrical pulse
      row.addEventListener('mouseenter', () => {
        if (this.callbacks.onHoverPin) {
          this.callbacks.onHoverPin(pin.pinKey);
        }
      });
      row.addEventListener('mouseleave', () => {
        if (this.callbacks.onUnhoverPin) {
          this.callbacks.onUnhoverPin();
        }
      });

      // Focus button or click isolates connection
      row.querySelector('.btn-pin-focus')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.callbacks.onFocusPin) {
          this.callbacks.onFocusPin(pin.pinKey);
        }
      });

      row.addEventListener('click', () => {
        if (this.callbacks.onFocusPin) {
          this.callbacks.onFocusPin(pin.pinKey);
        }
      });

      this.sidebarPinTable.appendChild(row);
    });
  }

  initEvents() {
    // 4 View Modes Switcher
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-mode');
        if (this.callbacks.onModeChange) {
          this.callbacks.onModeChange(mode);
        }
      });
    });

    // Labels Toggle
    const labelsBtn = document.getElementById('btn-labels-toggle');
    const labelsLabel = document.getElementById('labels-label');
    labelsBtn?.addEventListener('click', () => {
      const isVisible = this.callbacks.onToggleLabels ? this.callbacks.onToggleLabels() : false;
      labelsBtn.classList.toggle('active', isVisible);
      if (labelsLabel) {
        labelsLabel.textContent = isVisible ? '🏷️ Labels: ON' : '🏷️ Labels';
      }
    });

    // X-Ray Mode toggle
    this.xrayBtn?.addEventListener('click', () => {
      const isXRay = this.callbacks.onToggleXRay();
      this.xrayBtn.classList.toggle('active', isXRay);
      if (this.xrayLabel) {
        this.xrayLabel.textContent = isXRay ? '🔍 X-Ray: ON' : '🔍 X-Ray';
      }
    });

    // Exploded View toggle
    this.explodeBtn?.addEventListener('click', () => {
      const isExp = this.callbacks.onToggleExplode();
      this.explodeBtn.classList.toggle('active', isExp);
      if (this.explodeLabel) {
        this.explodeLabel.textContent = isExp ? '💥 Exploded' : '💥 Explode';
      }
    });

    // Mobile View toggle
    document.getElementById('btn-mobile-view')?.addEventListener('click', () => {
      if (this.mobileWindow) {
        this.mobileWindow.classList.toggle('hidden');
      }
    });

    document.getElementById('btn-close-mobile')?.addEventListener('click', () => {
      if (this.mobileWindow) {
        this.mobileWindow.classList.add('hidden');
      }
    });

    // Close Signal Flow View
    document.getElementById('btn-close-flow')?.addEventListener('click', () => {
      this.setSignalFlowOpen(false);
      // Switch active tab back to 3D View
      document.querySelectorAll('.mode-tab').forEach(t => {
        if (t.getAttribute('data-mode') === '3d') t.classList.add('active');
        else t.classList.remove('active');
      });
      if (this.callbacks.onModeChange) {
        this.callbacks.onModeChange('3d');
      }
    });

    // Signal Flow Modal Simulation buttons
    document.querySelectorAll('.flow-sim-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const alertType = btn.getAttribute('data-alert');
        if (this.callbacks.onTriggerAlert) {
          this.callbacks.onTriggerAlert(alertType);
        }
      });
    });

    // Clean View toggle
    document.getElementById('btn-clean-view')?.addEventListener('click', () => {
      document.body.classList.toggle('clean-mode');
    });

    // Sidebar Module selection
    document.querySelectorAll('.module-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.module-item').forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        const compKey = item.getAttribute('data-comp');
        this.populateSidebarPinout(compKey);
        if (this.callbacks.onComponentSelect) {
          this.callbacks.onComponentSelect(compKey);
        }
      });
    });

    // Zoom in on active component
    document.getElementById('btn-zoom-comp')?.addEventListener('click', () => {
      if (this.callbacks.onZoomComponent) {
        this.callbacks.onZoomComponent(this.currentCompKey || 'esp32');
      }
    });

    // Reset board overview camera
    document.getElementById('btn-reset-view')?.addEventListener('click', () => {
      if (this.callbacks.onCameraChange) {
        this.callbacks.onCameraChange('reset');
      }
    });

    // Net Filter buttons
    document.querySelectorAll('.net-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.net-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const net = btn.getAttribute('data-net');
        if (this.callbacks.onNetFilter) {
          this.callbacks.onNetFilter(net);
        }
      });
    });

    // Mounting Base style buttons
    document.querySelectorAll('.plate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.plate-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const style = btn.getAttribute('data-style');
        if (this.callbacks.onBaseStyleChange) {
          this.callbacks.onBaseStyleChange(style);
        }
      });
    });

    // Focus HUD Reset button
    document.getElementById('btn-hud-reset')?.addEventListener('click', () => {
      this.hidePinInspector();
      if (this.callbacks.onResetInspection) {
        this.callbacks.onResetInspection();
      }
    });

    // Bottom Simulation Pill Dock
    document.querySelectorAll('.sim-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const alertType = pill.getAttribute('data-alert');
        if (this.callbacks.onTriggerAlert) {
          this.callbacks.onTriggerAlert(alertType);
        }
      });
    });

    // Audio toggle
    this.audioBtn?.addEventListener('click', () => {
      const isMuted = this.callbacks.onToggleAudio();
      if (this.audioLabel) {
        this.audioLabel.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
      }
      this.audioBtn.style.opacity = isMuted ? '0.6' : '1.0';
    });

    // Specs modal
    document.getElementById('btn-pinout-modal')?.addEventListener('click', () => {
      this.modalEl?.classList.remove('hidden');
    });

    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      this.modalEl?.classList.add('hidden');
    });

    this.modalEl?.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.modalEl.classList.add('hidden');
      }
    });
  }

  setSignalFlowOpen(isOpen) {
    if (this.signalFlowModal) {
      if (isOpen) this.signalFlowModal.classList.remove('hidden');
      else this.signalFlowModal.classList.add('hidden');
    }
  }

  showPinInspector(pathway) {
    if (!pathway || !this.hudBanner) return;

    if (this.hudSrcPin) this.hudSrcPin.textContent = pathway.espPin || 'ESP32 Pin';
    if (this.hudWireDesc) this.hudWireDesc.textContent = pathway.wireName || 'Manhattan Routed Wire';
    if (this.hudDestPin) this.hudDestPin.textContent = `${pathway.destComp || ''} — ${pathway.destPin || ''}`;
    if (this.hudNetBadge) this.hudNetBadge.textContent = `${(pathway.net || 'SIGNAL').toUpperCase()} BUS`;
    if (this.hudDesc) this.hudDesc.textContent = pathway.purpose || '';

    this.hudBanner.classList.remove('hidden');
  }

  hidePinInspector() {
    this.hudBanner?.classList.add('hidden');
  }

  showTooltip(x, y, data) {
    if (!data || !this.tooltipEl) {
      this.hideTooltip();
      return;
    }

    if (this.tooltipCat) this.tooltipCat.textContent = data.category || 'HARDWARE MODULE';
    if (this.tooltipTitle) this.tooltipTitle.textContent = data.name || 'Component';
    if (this.tooltipDesc) this.tooltipDesc.textContent = data.desc || '';

    if (this.tooltipSpecs) {
      this.tooltipSpecs.innerHTML = '';
      if (data.specs && Array.isArray(data.specs)) {
        data.specs.forEach((spec, i) => {
          const pill = document.createElement('span');
          pill.className = `spec-pill ${i === 0 ? 'highlight' : ''}`;
          pill.textContent = spec;
          this.tooltipSpecs.appendChild(pill);
        });
      }
    }

    const posX = Math.min(window.innerWidth - 280, x + 15);
    const posY = Math.max(60, Math.min(window.innerHeight - 180, y - 50));

    this.tooltipEl.style.left = `${posX}px`;
    this.tooltipEl.style.top = `${posY}px`;
    this.tooltipEl.classList.remove('hidden');
  }

  hideTooltip() {
    this.tooltipEl?.classList.add('hidden');
  }

  /**
   * Animate the 6-stage end-to-end signal pipeline:
   * Sound Wave ➔ INMP441 ➔ ESP32 DMA ➔ TinyML ➔ Actuators ➔ Mobile BLE
   */
  animatePipeline(alertType) {
    if (!this.pipelineStrip) return;

    // Reset all nodes
    Object.values(this.pipeNodes).forEach(node => node?.classList.remove('active'));
    document.querySelectorAll('.flow-stage-card').forEach(c => c.classList.remove('active'));

    if (alertType === 'reset' || alertType === 'listening') {
      if (this.pipelineTimer) this.pipelineTimer.textContent = 'IDLE (Streaming @ 16 kHz)';
      return;
    }

    const stages = [
      { key: 'sound', time: '+0 ms', label: 'Sound Wave (Acoustic Pressure)' },
      { key: 'mic', time: '+5 ms', label: 'INMP441 MEMS Transducer (24-bit I2S)' },
      { key: 'mcu', time: '+12 ms', label: 'ESP32-S3 DMA Buffer Ring' },
      { key: 'ai', time: '+28 ms', label: 'TinyML 1D-CNN Inference (Xtensa DSP)' },
      { key: 'actuators', time: '+32 ms', label: '2N2222 Driver + LED + Haptic Motor' },
      { key: 'mobile', time: '+36 ms', label: 'BLE 5.0 GATT Push Alert' }
    ];

    stages.forEach((stage, idx) => {
      setTimeout(() => {
        this.pipeNodes[stage.key]?.classList.add('active');
        document.querySelector(`.flow-stage-card[data-stage="${stage.key}"]`)?.classList.add('active');
        if (this.pipelineTimer) {
          this.pipelineTimer.textContent = `${stage.label} (${stage.time})`;
        }
      }, idx * 160);
    });

    // Clear after sequence
    setTimeout(() => {
      Object.values(this.pipeNodes).forEach(node => node?.classList.remove('active'));
      document.querySelectorAll('.flow-stage-card').forEach(c => c.classList.remove('active'));
      if (this.pipelineTimer) {
        this.pipelineTimer.textContent = `ALERT ARMED (TinyML Confirmed)`;
      }
    }, stages.length * 160 + 1200);
  }

  /**
   * Update live status & mobile alert cards
   */
  updateStatus(statusKey, label) {
    if (this.statusText) this.statusText.textContent = label;

    if (this.statusDot) {
      this.statusDot.className = 'status-dot';
      if (statusKey === 'listening') {
        this.statusDot.classList.add('green');
      } else if (statusKey === 'fire') {
        this.statusDot.classList.add('red');
      } else if (statusKey === 'doorbell') {
        this.statusDot.classList.add('blue');
      } else if (statusKey === 'baby') {
        this.statusDot.classList.add('yellow');
      } else if (statusKey === 'horn') {
        this.statusDot.classList.add('orange');
      }
    }

    // Trigger pipeline animation
    this.animatePipeline(statusKey);

    // Update Bottom Dock pills
    document.querySelectorAll('.sim-pill').forEach(pill => {
      const pAlert = pill.getAttribute('data-alert');
      if (pAlert === statusKey || (statusKey === 'listening' && pAlert === 'reset')) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Update Mobile Companion Window
    this.updateMobileView(statusKey);
  }

  updateMobileView(statusKey) {
    if (!this.phoneNotifCard || !this.phoneIdleCard) return;

    if (statusKey === 'listening' || statusKey === 'reset') {
      this.phoneNotifCard.classList.add('hidden');
      this.phoneIdleCard.classList.remove('hidden');
      return;
    }

    const alertDetails = {
      fire: {
        icon: '🔥',
        title: 'EMERGENCY: Fire Alarm',
        desc: 'Continuous 3.1 kHz tonal alarm detected. High urgency vibration alert active.',
        pattern: 'Tactile: Continuous High 240Hz Buzz'
      },
      doorbell: {
        icon: '🔔',
        title: 'NOTIFICATION: Doorbell',
        desc: 'Two-tone chime detected at main entrance. Blue visual alert.',
        pattern: 'Tactile: 2 Distinct Tactile Pulses'
      },
      baby: {
        icon: '👶',
        title: 'ALERT: Baby Crying',
        desc: '450 Hz harmonic vocal crying signature detected. Amber visual alert.',
        pattern: 'Tactile: 3 Rapid Warning Pulses'
      },
      horn: {
        icon: '🚗',
        title: 'WARNING: Vehicle Horn',
        desc: 'High-intensity dual-tone blast detected nearby. Traffic hazard alert.',
        pattern: 'Tactile: Heavy Extended Haptic Thump'
      }
    };

    const d = alertDetails[statusKey];
    if (d) {
      if (this.notifIcon) this.notifIcon.textContent = d.icon;
      if (this.notifTitle) this.notifTitle.textContent = d.title;
      if (this.notifDesc) this.notifDesc.textContent = d.desc;
      if (this.notifHaptic) this.notifHaptic.textContent = d.pattern;

      this.phoneIdleCard.classList.add('hidden');
      this.phoneNotifCard.classList.remove('hidden');

      // Auto-open mobile window if closed when an alert triggers
      if (this.mobileWindow && this.mobileWindow.classList.contains('hidden')) {
        this.mobileWindow.classList.remove('hidden');
      }
    }
  }

  updateTelemetry() {}
}
