const TRANSLATIONS = {
  de: {
    title: "Area Manager",
    subtitle: "Geräte ohne Bereichszuweisung erkennen und schnell einem Bereich zuordnen.",
    badge: (n) => `${n} ohne Bereich`,
    searchPlaceholder: "Gerät, Hersteller oder Modell suchen…",
    allManufacturers: "Alle Hersteller",
    allIntegrations: "Alle Integrationen",
    clearFilter: "Filter zurücksetzen",
    saveAll: (n) => `Alle speichern (${n})`,
    saving: "Wird gespeichert…",
    reload: "Neu laden",
    assign: "Zuweisen",
    chooseArea: "— Bereich wählen —",
    colDevice: "Gerät",
    colIntegration: "Integration",
    colArea: "Bereich zuweisen",
    allDone: "Alle Geräte haben bereits einen Bereich. 🎉",
    noFilterMatch: "Keine Geräte entsprechen dem Filter.",
    loading: "Lade Daten…",
    errorLoad: (msg) => `Fehler beim Laden der Daten: ${msg}`,
    errorSave: (msg) => `Fehler beim Speichern: ${msg}`,
  },
  en: {
    title: "Area Manager",
    subtitle: "Find devices without an area assignment and quickly assign them to one.",
    badge: (n) => `${n} without area`,
    searchPlaceholder: "Search by device, manufacturer or model…",
    allManufacturers: "All manufacturers",
    allIntegrations: "All integrations",
    clearFilter: "Reset filters",
    saveAll: (n) => `Save all (${n})`,
    saving: "Saving…",
    reload: "Reload",
    assign: "Assign",
    chooseArea: "— Choose area —",
    colDevice: "Device",
    colIntegration: "Integration",
    colArea: "Assign area",
    allDone: "All devices already have an area. 🎉",
    noFilterMatch: "No devices match the filter.",
    loading: "Loading…",
    errorLoad: (msg) => `Error loading data: ${msg}`,
    errorSave: (msg) => `Error saving: ${msg}`,
  },
};

class AreaManagerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._devices = [];
    this._areas = [];
    this._pending = {};
    this._saving = false;
    this._loaded = false;
    this._error = null;
    this._filterText = "";
    this._filterManufacturer = "";
    this._filterDomain = "";
  }

  _t(key, ...args) {
    const lang = (this._hass?.language || "de").split("-")[0];
    const dict = TRANSLATIONS[lang] || TRANSLATIONS["de"];
    const val = dict[key];
    return typeof val === "function" ? val(...args) : (val ?? key);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) {
      this._loaded = true;
      this._load();
    }
  }

  async _load() {
    this._error = null;
    this._render();
    try {
      const [devices, areas] = await Promise.all([
        this._hass.callWS({ type: "config/device_registry/list" }),
        this._hass.callWS({ type: "config/area_registry/list" }),
      ]);
      this._devices = devices;
      this._areas = areas.slice().sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      this._error = this._t("errorLoad", e.message);
    }
    this._render();
  }

  async _saveDevice(deviceId) {
    const areaId = this._pending[deviceId];
    if (!areaId) return;
    try {
      await this._hass.callWS({
        type: "config/device_registry/update",
        device_id: deviceId,
        area_id: areaId,
      });
      delete this._pending[deviceId];
      const dev = this._devices.find((d) => d.id === deviceId);
      if (dev) dev.area_id = areaId;
      this._render();
    } catch (e) {
      this._error = this._t("errorSave", e.message);
      this._render();
    }
  }

  async _saveAll() {
    const toSave = Object.entries(this._pending).filter(([, v]) => v);
    if (!toSave.length) return;
    this._saving = true;
    this._render();
    try {
      await Promise.all(
        toSave.map(([deviceId, areaId]) =>
          this._hass.callWS({
            type: "config/device_registry/update",
            device_id: deviceId,
            area_id: areaId,
          })
        )
      );
      toSave.forEach(([deviceId, areaId]) => {
        delete this._pending[deviceId];
        const dev = this._devices.find((d) => d.id === deviceId);
        if (dev) dev.area_id = areaId;
      });
    } catch (e) {
      this._error = this._t("errorSave", e.message);
    }
    this._saving = false;
    this._render();
  }

  // Filters rows in-place — no re-render, no focus loss
  _applyFilter() {
    const text = this._filterText.toLowerCase().trim();
    const mfr = this._filterManufacturer;
    const domain = this._filterDomain;
    let visible = 0;

    this.shadowRoot.querySelectorAll(".device-row").forEach((row) => {
      const matchText =
        !text ||
        (row.dataset.name || "").toLowerCase().includes(text) ||
        (row.dataset.sub || "").toLowerCase().includes(text);
      const matchMfr = !mfr || row.dataset.manufacturer === mfr;
      const matchDomain = !domain || row.dataset.domain === domain;

      const show = matchText && matchMfr && matchDomain;
      row.style.display = show ? "" : "none";
      if (show) visible++;
    });

    const badge = this.shadowRoot.getElementById("badge");
    if (badge) badge.textContent = this._t("badge", visible);

    const emptyFilter = this.shadowRoot.getElementById("empty-filter");
    if (emptyFilter) emptyFilter.style.display = visible === 0 ? "" : "none";

    const clearBtn = this.shadowRoot.getElementById("clear-filter");
    if (clearBtn) clearBtn.style.display = (text || mfr || domain) ? "" : "none";
  }

  _bindFilterListeners() {
    const reapply = () => this._applyFilter();

    const filterText = this.shadowRoot.getElementById("filter-text");
    if (filterText) {
      filterText.addEventListener("input", (e) => {
        this._filterText = e.target.value;
        reapply();
      });
    }

    const filterMfr = this.shadowRoot.getElementById("filter-manufacturer");
    if (filterMfr) {
      filterMfr.addEventListener("change", (e) => {
        this._filterManufacturer = e.target.value;
        reapply();
      });
    }

    const filterDomain = this.shadowRoot.getElementById("filter-domain");
    if (filterDomain) {
      filterDomain.addEventListener("change", (e) => {
        this._filterDomain = e.target.value;
        reapply();
      });
    }

    const clearBtn = this.shadowRoot.getElementById("clear-filter");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this._filterText = "";
        this._filterManufacturer = "";
        this._filterDomain = "";
        const ft = this.shadowRoot.getElementById("filter-text");
        const fm = this.shadowRoot.getElementById("filter-manufacturer");
        const fd = this.shadowRoot.getElementById("filter-domain");
        if (ft) ft.value = "";
        if (fm) fm.value = "";
        if (fd) fd.value = "";
        reapply();
      });
    }
  }

  _render() {
    const unassigned = this._devices.filter((d) => !d.area_id);
    const pendingCount = Object.values(this._pending).filter(Boolean).length;

    const areaOptions = this._areas
      .map((a) => `<option value="${a.area_id}">${a.name}</option>`)
      .join("");

    const manufacturers = [
      ...new Set(unassigned.map((d) => d.manufacturer).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    const domains = [
      ...new Set(
        unassigned
          .map((d) => d.identifiers?.[0]?.[0] ?? null)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    const hasFilter = this._filterText || this._filterManufacturer || this._filterDomain;

    const rows = unassigned
      .map((d) => {
        const label = d.name_by_user || d.name || d.id;
        const sub = [d.manufacturer, d.model].filter(Boolean).join(" · ");
        const domain = d.identifiers?.[0]?.[0] ?? "";
        const selected = this._pending[d.id] || "";
        return `
          <tr class="device-row"
              data-name="${label}"
              data-manufacturer="${d.manufacturer || ""}"
              data-domain="${domain}"
              data-sub="${sub}">
            <td class="cell-name">
              <div class="device-name">${label}</div>
              ${sub ? `<div class="device-sub">${sub}</div>` : ""}
            </td>
            <td class="cell-integration">
              ${domain ? `<span class="domain-chip">${domain}</span>` : `<span class="domain-chip muted">—</span>`}
            </td>
            <td class="cell-area">
              <select class="area-select" data-device="${d.id}">
                <option value="">${this._t("chooseArea")}</option>
                ${areaOptions}
              </select>
            </td>
            <td class="cell-action">
              <button class="btn-assign" data-device="${d.id}" ${!selected ? "disabled" : ""}>
                ${this._t("assign")}
              </button>
            </td>
          </tr>`;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 16px 24px;
          font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
          color: var(--primary-text-color);
        }
        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        h1 { font-size: 1.6em; font-weight: 400; margin: 0; }
        .badge {
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          border-radius: 12px;
          padding: 2px 10px;
          font-size: 0.8em;
          font-weight: 500;
        }
        .subtitle {
          color: var(--secondary-text-color, #888);
          margin: 4px 0 20px;
          font-size: 0.95em;
        }
        .filter-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
          align-items: center;
        }
        .filter-input {
          flex: 1 1 200px;
          min-width: 160px;
          padding: 8px 12px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 6px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
          font-size: 0.95em;
        }
        .filter-select {
          flex: 0 1 180px;
          padding: 7px 10px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 6px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
          font-size: 0.95em;
        }
        .btn-clear-filter {
          background: transparent;
          border: 1px solid var(--divider-color, #ccc);
          color: var(--secondary-text-color, #888);
          padding: 7px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.88em;
          white-space: nowrap;
        }
        .toolbar {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          align-items: center;
        }
        .error {
          background: var(--error-color, #f44336);
          color: #fff;
          padding: 10px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .empty, .empty-filter {
          color: var(--secondary-text-color, #888);
          text-align: center;
          padding: 48px 0;
          font-size: 1.1em;
        }
        .empty-filter { display: none; }
        table {
          width: 100%;
          border-collapse: collapse;
          background: var(--card-background-color, #fff);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: var(--ha-card-box-shadow, 0 2px 6px rgba(0,0,0,0.1));
        }
        thead th {
          text-align: left;
          padding: 12px 16px;
          font-size: 0.85em;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--secondary-text-color, #888);
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
        }
        .device-row:not(:last-child) td { border-bottom: 1px solid var(--divider-color, #e0e0e0); }
        .device-row:hover { background: var(--secondary-background-color, #f5f5f5); }
        .cell-name { padding: 10px 16px; }
        .cell-integration { padding: 10px 16px; width: 130px; }
        .cell-area { padding: 10px 16px; width: 220px; }
        .cell-action { padding: 10px 16px; width: 110px; }
        .device-name { font-weight: 500; }
        .device-sub { font-size: 0.82em; color: var(--secondary-text-color, #888); margin-top: 2px; }
        .domain-chip {
          display: inline-block;
          background: var(--secondary-background-color, #f0f0f0);
          color: var(--secondary-text-color, #555);
          border-radius: 10px;
          padding: 2px 9px;
          font-size: 0.8em;
          font-family: monospace;
        }
        .domain-chip.muted { opacity: 0.4; }
        .area-select {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
          font-size: 0.95em;
        }
        button {
          padding: 7px 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
          font-weight: 500;
          transition: opacity 0.15s;
        }
        button:disabled { opacity: 0.4; cursor: default; }
        .btn-assign {
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          width: 100%;
        }
        .btn-save-all {
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          padding: 9px 20px;
        }
        .btn-reload {
          background: transparent;
          border: 1px solid var(--divider-color, #ccc);
          color: var(--primary-text-color);
          padding: 8px 16px;
        }
        .loading {
          text-align: center;
          padding: 48px 0;
          color: var(--secondary-text-color, #888);
        }
      </style>

      <div class="header">
        <h1>${this._t("title")}</h1>
        ${this._loaded && !this._error
          ? `<span class="badge" id="badge">${this._t("badge", unassigned.length)}</span>`
          : ""}
      </div>
      <p class="subtitle">${this._t("subtitle")}</p>

      ${this._error ? `<div class="error">${this._error}</div>` : ""}

      ${!this._loaded && !this._error
        ? `<div class="loading">${this._t("loading")}</div>`
        : unassigned.length === 0
        ? `<div class="empty">${this._t("allDone")}</div>`
        : `
          <div class="filter-bar">
            <input
              type="search"
              id="filter-text"
              class="filter-input"
              placeholder="${this._t("searchPlaceholder")}"
              value="${this._filterText}"
            >
            <select id="filter-manufacturer" class="filter-select">
              <option value="">${this._t("allManufacturers")}</option>
              ${manufacturers.map((m) =>
                `<option value="${m}" ${this._filterManufacturer === m ? "selected" : ""}>${m}</option>`
              ).join("")}
            </select>
            <select id="filter-domain" class="filter-select">
              <option value="">${this._t("allIntegrations")}</option>
              ${domains.map((d) =>
                `<option value="${d}" ${this._filterDomain === d ? "selected" : ""}>${d}</option>`
              ).join("")}
            </select>
            <button class="btn-clear-filter" id="clear-filter" style="${hasFilter ? "" : "display:none"}">
              ${this._t("clearFilter")}
            </button>
          </div>
          <div class="toolbar">
            <button class="btn-save-all" id="save-all" ${this._saving || pendingCount === 0 ? "disabled" : ""}>
              ${this._saving ? this._t("saving") : this._t("saveAll", pendingCount)}
            </button>
            <button class="btn-reload" id="reload">${this._t("reload")}</button>
          </div>
          <div class="empty-filter" id="empty-filter">${this._t("noFilterMatch")}</div>
          <table>
            <thead>
              <tr>
                <th>${this._t("colDevice")}</th>
                <th>${this._t("colIntegration")}</th>
                <th>${this._t("colArea")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>`
      }

      ${unassigned.length > 0 || !this._loaded ? "" : `
        <div class="toolbar" style="margin-top:16px">
          <button class="btn-reload" id="reload">${this._t("reload")}</button>
        </div>`}
    `;

    this.shadowRoot.querySelectorAll(".area-select").forEach((sel) => {
      if (this._pending[sel.dataset.device]) sel.value = this._pending[sel.dataset.device];
      sel.addEventListener("change", (e) => {
        const id = e.target.dataset.device;
        this._pending[id] = e.target.value;
        const btn = this.shadowRoot.querySelector(`.btn-assign[data-device="${id}"]`);
        if (btn) btn.disabled = !e.target.value;
        const saveAll = this.shadowRoot.getElementById("save-all");
        if (saveAll) {
          const count = Object.values(this._pending).filter(Boolean).length;
          saveAll.disabled = count === 0;
          saveAll.textContent = this._t("saveAll", count);
        }
      });
    });

    this.shadowRoot.querySelectorAll(".btn-assign").forEach((btn) => {
      btn.addEventListener("click", (e) => this._saveDevice(e.target.dataset.device));
    });

    const saveAll = this.shadowRoot.getElementById("save-all");
    if (saveAll) saveAll.addEventListener("click", () => this._saveAll());

    const reload = this.shadowRoot.getElementById("reload");
    if (reload) {
      reload.addEventListener("click", () => {
        this._loaded = false;
        this._pending = {};
        this._load();
      });
    }

    this._bindFilterListeners();
    // Re-apply existing filter state after every re-render (e.g. after save)
    this._applyFilter();
  }
}

customElements.define("area-manager-panel", AreaManagerPanel);
