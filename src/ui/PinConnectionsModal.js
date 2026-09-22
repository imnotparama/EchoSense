/**
 * Interactive Pin Connections Modal & Wiring Map
 * Allows users to inspect all 28 circuit connections with exact breadboard hole coordinates,
 * filter by subsystem, search by pin/signal, and one-click fly to inspect in 3D.
 */
export class PinConnectionsModal {
  constructor(app) {
    this.app = app;
    this.modalEl = document.getElementById('pin-connections-modal');
    this.tableBody = document.getElementById('pin-table-body');
    this.searchInput = document.getElementById('pin-search-input');
    this.filterChips = document.querySelectorAll('.pin-filter-chip');
    this.totalCountEl = document.getElementById('pin-total-count');

    this.currentFilter = 'all';
    this.searchQuery = '';
    this.connections = [];

    this.init();
  }

  init() {
    this.connections = this.app.wireManager.getPinConnectionsList();
    this.renderTable();
    this.bindEvents();
  }

  bindEvents() {
    // Open modal button in header
    document.getElementById('btn-pin-map')?.addEventListener('click', () => {
      this.open();
    });

    // Close button
    document.getElementById('btn-close-pin-modal')?.addEventListener('click', () => {
      this.close();
    });

    // Close on backdrop click
    this.modalEl?.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    // Search input
    this.searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });

    // Filter chips
    this.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.getAttribute('data-filter') || 'all';
        this.renderTable();
      });
    });
  }

  open() {
    this.connections = this.app.wireManager.getPinConnectionsList();
    this.modalEl?.classList.remove('hidden');
    this.renderTable();
  }

  close() {
    this.modalEl?.classList.add('hidden');
  }

  renderTable() {
    if (!this.tableBody) return;

    const filtered = this.connections.filter(c => {
      // Net category filter
      const matchesCategory =
        this.currentFilter === 'all' ||
        (this.currentFilter === 'power' && (c.net === 'power' || c.net === 'ground')) ||
        c.net === this.currentFilter;

      // Text search filter
      const matchesSearch =
        !this.searchQuery ||
        c.name.toLowerCase().includes(this.searchQuery) ||
        (c.fromPin && c.fromPin.toLowerCase().includes(this.searchQuery)) ||
        (c.fromHole && c.fromHole.toLowerCase().includes(this.searchQuery)) ||
        (c.toPin && c.toPin.toLowerCase().includes(this.searchQuery)) ||
        (c.toHole && c.toHole.toLowerCase().includes(this.searchQuery)) ||
        (c.role && c.role.toLowerCase().includes(this.searchQuery)) ||
        (c.colorName && c.colorName.toLowerCase().includes(this.searchQuery));

      return matchesCategory && matchesSearch;
    });

    if (this.totalCountEl) {
      this.totalCountEl.textContent = `${filtered.length} of ${this.connections.length} Connections`;
    }

    this.tableBody.innerHTML = '';

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="6" class="pin-empty-msg">
          No pin connections match "${this.searchQuery}" in category "${this.currentFilter}".
        </td>
      `;
      this.tableBody.appendChild(tr);
      return;
    }

    filtered.forEach(conn => {
      const tr = document.createElement('tr');
      tr.className = 'pin-row';
      tr.setAttribute('data-wire-id', conn.id);

      const colorHex = '#' + (conn.color || 0x00f0ff).toString(16).padStart(6, '0');

      tr.innerHTML = `
        <td class="col-wire">
          <div class="wire-badge-wrap">
            <span class="wire-dot" style="background-color: ${colorHex}; box-shadow: 0 0 8px ${colorHex}"></span>
            <span class="wire-color-name">${conn.colorName || 'Wire'}</span>
          </div>
        </td>
        <td class="col-source">
          <div class="pin-block">
            <span class="pin-label source-pin">${conn.fromPin}</span>
            <span class="pin-coord">${conn.fromHole}</span>
          </div>
        </td>
        <td class="col-arrow">
          <span class="pin-arrow">➔</span>
        </td>
        <td class="col-dest">
          <div class="pin-block">
            <span class="pin-label dest-pin">${conn.toPin}</span>
            <span class="pin-coord">${conn.toHole}</span>
          </div>
        </td>
        <td class="col-role">
          <span class="pin-role-desc">${conn.role || conn.name}</span>
        </td>
        <td class="col-action">
          <button class="btn-inspect-pin" data-wire-id="${conn.id}" title="Focus 3D camera and highlight pins">
            <span>🔍 Inspect</span>
          </button>
        </td>
      `;

      tr.querySelector('.btn-inspect-pin')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
        this.app.inspectPinConnection(conn.id);
      });

      // Hovering row previews wire in 3D
      tr.addEventListener('mouseenter', () => {
        this.app.previewPinConnection(conn.id);
      });

      tr.addEventListener('mouseleave', () => {
        if (!this.app.activeInspectedWireId) {
          this.app.wireManager.clearConnectionHighlight();
        }
      });

      this.tableBody.appendChild(tr);
    });
  }
}
