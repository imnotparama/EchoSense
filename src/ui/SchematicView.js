export class SchematicView {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('schematic-split-container');
    this.isOpen = false;

    this.init();
  }

  init() {
    this.renderSVGSchematic();
    this.bindEvents();
  }

  renderSVGSchematic() {
    this.container.innerHTML = `
      <div class="schematic-header">
        <div class="sch-title-wrap">
          <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          <span class="sch-title">INTERACTIVE CIRCUIT SCHEMATIC</span>
        </div>
        <button class="sch-close-btn" id="btn-close-schematic">&times;</button>
      </div>
      <div class="schematic-canvas-wrap">
        <svg id="schematic-svg" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <!-- STYLES -->
          <defs>
            <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1e293b"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- 1. ESP32-S3 BLOCK -->
          <g id="sch-esp32" class="sch-node" data-net="esp32">
            <rect x="260" y="80" width="280" height="420" rx="8" fill="url(#chipGrad)" stroke="#38bdf8" stroke-width="2"/>
            <text x="400" y="115" fill="#f8fafc" font-size="18" font-family="monospace" font-weight="bold" text-anchor="middle">ESP32-S3 DevKitC-1</text>
            <text x="400" y="135" fill="#94a3b8" font-size="12" font-family="sans-serif" text-anchor="middle">Xtensa Dual-Core 240MHz • TinyML DSP</text>

            <!-- LEFT PINS (I2S, Power, Buttons) -->
            <g class="sch-pin" data-pin="inmp_ws"><rect x="230" y="170" width="30" height="20" rx="3" fill="#10b981"/><text x="220" y="185" fill="#ffffff" font-size="11" font-family="monospace" text-anchor="end">GPIO4 (WS)</text></g>
            <g class="sch-pin" data-pin="inmp_sck"><rect x="230" y="205" width="30" height="20" rx="3" fill="#10b981"/><text x="220" y="220" fill="#ffffff" font-size="11" font-family="monospace" text-anchor="end">GPIO5 (SCK)</text></g>
            <g class="sch-pin" data-pin="inmp_sd"><rect x="230" y="240" width="30" height="20" rx="3" fill="#10b981"/><text x="220" y="255" fill="#ffffff" font-size="11" font-family="monospace" text-anchor="end">GPIO6 (SD)</text></g>

            <g class="sch-pin" data-pin="gpio8"><rect x="230" y="285" width="30" height="20" rx="3" fill="#a855f7"/><text x="220" y="300" fill="#ffffff" font-size="11" font-family="monospace" text-anchor="end">GPIO8 (Fire)</text></g>
            <g class="sch-pin" data-pin="gpio9"><rect x="230" y="320" width="30" height="20" rx="3" fill="#a855f7"/><text x="220" y="335" fill="#ffffff" font-size="11" font-family="monospace" text-anchor="end">GPIO9 (Bell)</text></g>
            <g class="sch-pin" data-pin="gpio10"><rect x="230" y="355" width="30" height="20" rx="3" fill="#a855f7"/><text x="220" y="370" fill="#ffffff" font-size="11" font-family="monospace" text-anchor="end">GPIO10 (Baby)</text></g>
            <g class="sch-pin" data-pin="gpio11"><rect x="230" y="390" width="30" height="20" rx="3" fill="#a855f7"/><text x="220" y="405" fill="#ffffff" font-size="11" font-family="monospace" text-anchor="end">GPIO11 (Horn)</text></g>

            <g class="sch-pin" data-pin="pwr_3v3"><rect x="230" y="435" width="30" height="20" rx="3" fill="#ef4444"/><text x="220" y="450" fill="#ffffff" font-size="11" font-family="monospace" text-anchor="end">3.3V Out</text></g>
            <g class="sch-pin" data-pin="gnd_top"><rect x="230" y="465" width="30" height="20" rx="3" fill="#475569"/><text x="220" y="480" fill="#ffffff" font-size="11" font-family="monospace" text-anchor="end">GND</text></g>

            <!-- RIGHT PINS (LED, Motor, I2C, Buzzer, 5V) -->
            <g class="sch-pin" data-pin="led_red"><rect x="540" y="170" width="30" height="20" rx="3" fill="#3b82f6"/><text x="580" y="185" fill="#ffffff" font-size="11" font-family="monospace">GPIO15 (LED-R)</text></g>
            <g class="sch-pin" data-pin="led_grn"><rect x="540" y="205" width="30" height="20" rx="3" fill="#3b82f6"/><text x="580" y="220" fill="#ffffff" font-size="11" font-family="monospace">GPIO16 (LED-G)</text></g>
            <g class="sch-pin" data-pin="led_blu"><rect x="540" y="240" width="30" height="20" rx="3" fill="#3b82f6"/><text x="580" y="255" fill="#ffffff" font-size="11" font-family="monospace">GPIO17 (LED-B)</text></g>

            <g class="sch-pin" data-pin="gpio18"><rect x="540" y="285" width="30" height="20" rx="3" fill="#eab308"/><text x="580" y="300" fill="#ffffff" font-size="11" font-family="monospace">GPIO18 (Motor)</text></g>
            <g class="sch-pin" data-pin="buzzer"><rect x="540" y="325" width="30" height="20" rx="3" fill="#3b82f6"/><text x="580" y="340" fill="#ffffff" font-size="11" font-family="monospace">GPIO14 (Buzzer)</text></g>

            <g class="sch-pin" data-pin="i2c_sda"><rect x="540" y="370" width="30" height="20" rx="3" fill="#14b8a6"/><text x="580" y="385" fill="#ffffff" font-size="11" font-family="monospace">GPIO21 (SDA)</text></g>
            <g class="sch-pin" data-pin="i2c_scl"><rect x="540" y="405" width="30" height="20" rx="3" fill="#14b8a6"/><text x="580" y="420" fill="#ffffff" font-size="11" font-family="monospace">GPIO22 (SCL)</text></g>

            <g class="sch-pin" data-pin="pwr_5v"><rect x="540" y="450" width="30" height="20" rx="3" fill="#ef4444"/><text x="580" y="465" fill="#ffffff" font-size="11" font-family="monospace">5V (VBUS)</text></g>
          </g>

          <!-- 2. INMP441 MICROPHONE BLOCK (Left) -->
          <g id="sch-inmp441" class="sch-node" data-net="i2s">
            <rect x="40" y="160" width="130" height="120" rx="6" fill="#4a154b" stroke="#cbd5e1" stroke-width="1.5"/>
            <text x="105" y="185" fill="#f8fafc" font-size="14" font-family="monospace" font-weight="bold" text-anchor="middle">INMP441</text>
            <text x="105" y="202" fill="#e2e8f0" font-size="10" font-family="sans-serif" text-anchor="middle">I2S Audio MEMS</text>
            <circle cx="105" cy="235" r="14" fill="#d4af37"/>
            <!-- Connecting wires -->
            <path d="M 170 180 L 230 180" stroke="#10b981" stroke-width="2"/>
            <path d="M 170 215 L 230 215" stroke="#10b981" stroke-width="2"/>
            <path d="M 170 250 L 230 250" stroke="#10b981" stroke-width="2"/>
          </g>

          <!-- 3. MOTOR DRIVER (2N2222 + Motor + Diode) (Right) -->
          <g id="sch-motor" class="sch-node" data-net="motor">
            <!-- 1k Resistor -->
            <rect x="610" y="285" width="40" height="18" rx="2" fill="#e5d0b1" stroke="#854d0e" stroke-width="1.5"/>
            <text x="630" y="298" fill="#1e293b" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">1kΩ</text>
            <path d="M 570 295 L 610 295" stroke="#eab308" stroke-width="2"/>
            <!-- 2N2222 Transistor -->
            <circle cx="680" cy="295" r="18" fill="#18181b" stroke="#cbd5e1" stroke-width="1.5"/>
            <text x="680" y="299" fill="#ffffff" font-size="9" font-family="monospace" text-anchor="middle">2N2222</text>
            <path d="M 650 295 L 662 295" stroke="#eab308" stroke-width="2"/>
            <!-- Coin Motor -->
            <circle cx="740" cy="240" r="22" fill="#d4d4d8" stroke="#3b82f6" stroke-width="2"/>
            <text x="740" y="244" fill="#0f172a" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">MOTOR</text>
            <!-- Diode 1N4148 -->
            <rect x="720" y="290" width="30" height="14" rx="2" fill="#ef4444" stroke="#111111" stroke-width="1.5"/>
            <text x="735" y="301" fill="#ffffff" font-size="8" font-family="monospace" text-anchor="middle">1N4148</text>
          </g>

          <!-- 4. SSD1306 OLED (Top Right) -->
          <g id="sch-oled" class="sch-node" data-net="i2c">
            <rect x="620" y="370" width="130" height="90" rx="6" fill="#1e3a8a" stroke="#38bdf8" stroke-width="1.5"/>
            <text x="685" y="395" fill="#ffffff" font-size="13" font-family="monospace" font-weight="bold" text-anchor="middle">SSD1306 OLED</text>
            <rect x="635" y="405" width="100" height="40" rx="3" fill="#020617" stroke="#38bdf8"/>
            <text x="685" y="428" fill="#38bdf8" font-size="10" font-family="monospace" text-anchor="middle">128x64 I2C</text>
          </g>

          <!-- 5. RGB LED (Top Right) -->
          <g id="sch-led" class="sch-node" data-net="led">
            <circle cx="700" cy="180" r="16" fill="#f43f5e" stroke="#ffffff" stroke-width="1.5"/>
            <text x="700" y="184" fill="#ffffff" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">RGB</text>
            <text x="700" y="210" fill="#94a3b8" font-size="9" font-family="sans-serif" text-anchor="middle">Common Cathode</text>
          </g>
        </svg>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('btn-close-schematic')?.addEventListener('click', () => {
      this.toggle(false);
    });

    // Clicking any pin/node in the SVG highlights it in both 2D and 3D
    this.container.querySelectorAll('.sch-pin, .sch-node').forEach(node => {
      node.addEventListener('click', () => {
        const pinKey = node.getAttribute('data-pin') || node.getAttribute('data-net');
        if (pinKey) {
          this.app.wireManager.highlightPath(pinKey);

          // Visual highlight in SVG
          this.container.querySelectorAll('.sch-pin, .sch-node').forEach(n => n.classList.remove('active-sch'));
          node.classList.add('active-sch');
        }
      });
    });
  }

  toggle(visible) {
    this.isOpen = visible !== undefined ? visible : !this.isOpen;
    if (this.isOpen) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
      this.app.wireManager.resetHighlight();
    }
    return this.isOpen;
  }
}
