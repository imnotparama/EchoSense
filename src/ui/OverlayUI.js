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

    // Modal & Audio
    this.modalEl = document.getElementById('pinout-modal');
    this.audioBtn = document.getElementById('btn-audio-toggle');
    this.audioLabel = document.getElementById('audio-btn-label');

    this.initPinSpecsMap();
    this.initEvents();

    // Default select INMP441 in sidebar pin table
    this.populateSidebarPinout('inmp441');
  }

  initPinSpecsMap() {
    this.pinSpecsMap = {
      inmp441: {
        name: 'INMP441 I2S MICROPHONE',
        pins: [
          { name: 'VDD', target: '3.3V Power Rail', pinKey: '3V3', color: 'red' },
          { name: 'GND', target: 'Ground Rail', pinKey: 'GND', color: 'black' },
          { name: 'WS', target: 'ESP32 GPIO4', pinKey: 'GPIO4', color: 'green' },
          { name: 'SCK', target: 'ESP32 GPIO5', pinKey: 'GPIO5', color: 'green' },
          { name: 'SD', target: 'ESP32 GPIO6', pinKey: 'GPIO6', color: 'purple' },
          { name: 'L/R', target: 'Ground (Left Ch)', pinKey: 'GND', color: 'black' }
        ]
      },
      esp32: {
        name: 'ESP32-S3 DevKitC-1',
        pins: [
          { name: '3V3', target: 'Top + 3.3V Rail', pinKey: '3V3', color: 'red' },
          { name: '5V', target: 'Bottom + 5V Rail', pinKey: '5V', color: 'red' },
          { name: 'GND', target: 'Ground Rail', pinKey: 'GND', color: 'black' },
          { name: 'GPIO4', target: 'INMP441 WS', pinKey: 'GPIO4', color: 'green' },
          { name: 'GPIO5', target: 'INMP441 SCK', pinKey: 'GPIO5', color: 'green' },
          { name: 'GPIO6', target: 'INMP441 SD', pinKey: 'GPIO6', color: 'purple' },
          { name: 'GPIO14', target: 'Active Buzzer (+)', pinKey: 'GPIO14', color: 'blue' },
          { name: 'GPIO18', target: '2N2222 Base (1kΩ)', pinKey: 'GPIO18', color: 'yellow' },
          { name: 'GPIO21', target: 'OLED SDA (I2C)', pinKey: 'GPIO21', color: 'teal' },
          { name: 'GPIO22', target: 'OLED SCL (I2C)', pinKey: 'GPIO22', color: 'teal' }
        ]
      },
      oled: {
        name: 'SSD1306 0.96" OLED',
        pins: [
          { name: 'VCC', target: '3.3V Power Rail', pinKey: '3V3', color: 'red' },
          { name: 'GND', target: 'Ground Rail', pinKey: 'GND', color: 'black' },
          { name: 'SDA', target: 'ESP32 GPIO21', pinKey: 'GPIO21', color: 'teal' },
          { name: 'SCL', target: 'ESP32 GPIO22', pinKey: 'GPIO22', color: 'teal' }
        ]
      },
      vibeMotor: {
        name: '10mm COIN MOTOR & DRIVER',
        pins: [
          { name: 'Motor (+)', target: '5V Power Rail', pinKey: '5V', color: 'red' },
          { name: 'Motor (-)', target: '2N2222 Collector', pinKey: 'GPIO18', color: 'yellow' },
          { name: 'Base', target: '1kΩ ➔ ESP32 GPIO18', pinKey: 'GPIO18', color: 'yellow' },
          { name: 'Emitter', target: 'Ground Rail', pinKey: 'GND', color: 'black' }
        ]
      },
      rgbLed: {
        name: 'COMMON CATHODE RGB LED',
        pins: [
          { name: 'Cathode', target: 'Ground Rail', pinKey: 'GND', color: 'black' },
          { name: 'Red Anode', target: '220Ω ➔ GPIO15', pinKey: 'led', color: 'orange' },
          { name: 'Green Anode', target: '220Ω ➔ GPIO16', pinKey: 'led', color: 'green' },
          { name: 'Blue Anode', target: '220Ω ➔ GPIO17', pinKey: 'led', color: 'blue' }
        ]
      },
      buzzer: {
        name: 'ACTIVE 5V BUZZER',
        pins: [
          { name: 'Buzzer (+)', target: 'ESP32 GPIO14', pinKey: 'GPIO14', color: 'blue' },
          { name: 'Buzzer (-)', target: 'Ground Rail', pinKey: 'GND', color: 'black' }
        ]
      },
      transCircuit: {
        name: '2N2222 BJT & PASSIVES',
        pins: [
          { name: 'Base', target: '1kΩ ➔ ESP32 GPIO18', pinKey: 'GPIO18', color: 'yellow' },
          { name: 'Collector', target: 'Motor (-) & Diode', pinKey: 'GPIO18', color: 'yellow' },
          { name: 'Emitter', target: 'Ground Rail', pinKey: 'GND', color: 'black' },
          { name: 'Cap 100uF', target: '3.3V to GND Filter', pinKey: '3V3', color: 'red' }
        ]
      }
    };
  }

  populateSidebarPinout(compKey) {
    const data = this.pinSpecsMap[compKey];
    if (!data || !this.sidebarPinTable) return;

    if (this.selectedCompNameEl) {
      this.selectedCompNameEl.textContent = data.name;
    }

    this.sidebarPinTable.innerHTML = '';
    data.pins.forEach(pin => {
      const row = document.createElement('div');
      row.className = 'pin-row';
      row.innerHTML = `
        <span class="pin-tag">${pin.name}</span>
        <span class="pin-arrow">➔</span>
        <span class="pin-target">${pin.target}</span>
        <button class="btn-pin-focus" data-pin="${pin.pinKey}">Focus</button>
      `;

      // Clicking the focus button triggers focus connection mode
      row.querySelector('.btn-pin-focus')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.callbacks.onFocusPin) {
          this.callbacks.onFocusPin(pin.pinKey);
        }
      });

      // Clicking row also triggers focus
      row.addEventListener('click', () => {
        if (this.callbacks.onFocusPin) {
          this.callbacks.onFocusPin(pin.pinKey);
        }
      });

      this.sidebarPinTable.appendChild(row);
    });
  }

  initEvents() {
    // Clean View toggle
    document.getElementById('btn-clean-view')?.addEventListener('click', () => {
      document.body.classList.toggle('clean-mode');
    });

    // Mobile View toggle
    const mobileBtn = document.getElementById('btn-mobile-view');
    mobileBtn?.addEventListener('click', () => {
      if (this.mobileWindow) {
        this.mobileWindow.classList.toggle('hidden');
      }
    });

    document.getElementById('btn-close-mobile')?.addEventListener('click', () => {
      if (this.mobileWindow) {
        this.mobileWindow.classList.add('hidden');
      }
    });

    // Camera preset buttons
    document.querySelectorAll('.cam-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view');
        if (this.callbacks.onCameraChange) {
          this.callbacks.onCameraChange(view);
        }
      });
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
        const opacity = parseFloat(btn.getAttribute('data-opacity'));
        if (this.callbacks.onOpacityChange) {
          this.callbacks.onOpacityChange(opacity);
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
        this.audioLabel.textContent = isMuted ? 'Sound: OFF' : 'Sound: ON';
      }
      this.audioBtn.style.opacity = isMuted ? '0.6' : '1.0';
    });

    // Split-View Interactive Schematic Toggle
    document.getElementById('btn-schematic-toggle')?.addEventListener('click', () => {
      if (this.callbacks.onToggleSchematic) {
        this.callbacks.onToggleSchematic();
      }
    });

    // Pinout / Specs modal
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

  showPinInspector(pathway) {
    if (!pathway || !this.hudBanner) return;

    if (this.hudSrcPin) this.hudSrcPin.textContent = pathway.espPin || 'ESP32 Pin';
    if (this.hudWireDesc) this.hudWireDesc.textContent = pathway.wireName || 'Routed Wire';
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
        if (this.pipelineTimer) {
          this.pipelineTimer.textContent = `${stage.label} (${stage.time})`;
        }
      }, idx * 160);
    });

    // Clear after sequence
    setTimeout(() => {
      Object.values(this.pipeNodes).forEach(node => node?.classList.remove('active'));
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

  updateTelemetry() {
    // Telemetry hook
  }
}
