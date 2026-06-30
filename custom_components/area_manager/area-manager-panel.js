const TRANSLATIONS = {
  de: {
    title: "Area Manager",
    subtitle: "Geräte ohne Bereichszuweisung erkennen und schnell einem Bereich zuordnen.",
    badge: (n) => `${n} ohne Bereich`,
    tabUnassigned: (n) => `Ohne Bereich (${n})`,
    tabIgnored: (n) => `Ignoriert (${n})`,
    searchPlaceholder: "Gerät, Hersteller oder Modell suchen…",
    allManufacturers: "Alle Hersteller",
    allIntegrations: "Alle Integrationen",
    clearFilter: "Filter zurücksetzen",
    saveAll: (n) => `Alle speichern (${n})`,
    saving: "Wird gespeichert…",
    reload: "Neu laden",
    assign: "Zuweisen",
    ignore: "Ignorieren",
    unignore: "Wieder anzeigen",
    delete: "Löschen",
    confirmDelete: "Gerät wirklich löschen?",
    confirmYes: "Ja, löschen",
    confirmNo: "Abbrechen",
    chooseArea: "— Bereich wählen —",
    colDevice: "Gerät",
    colIntegration: "Integration",
    colArea: "Bereich zuweisen",
    colCurrentArea: "Aktueller Bereich",
    colActions: "Aktionen",
    noArea: "Kein Bereich",
    allDone: "Alle Geräte haben bereits einen Bereich. 🎉",
    ignoredEmpty: "Keine ignorierten Geräte.",
    noFilterMatch: "Keine Geräte entsprechen dem Filter.",
    loading: "Lade Daten…",
    errorLoad: (msg) => `Fehler beim Laden der Daten: ${msg}`,
    errorSave: (msg) => `Fehler beim Speichern: ${msg}`,
    errorDelete: (msg) => `Fehler beim Löschen: ${msg}`,
  },
  en: {
    title: "Area Manager",
    subtitle: "Find devices without an area assignment and quickly assign them to one.",
    badge: (n) => `${n} without area`,
    tabUnassigned: (n) => `Without area (${n})`,
    tabIgnored: (n) => `Ignored (${n})`,
    searchPlaceholder: "Search by device, manufacturer or model…",
    allManufacturers: "All manufacturers",
    allIntegrations: "All integrations",
    clearFilter: "Reset filters",
    saveAll: (n) => `Save all (${n})`,
    saving: "Saving…",
    reload: "Reload",
    assign: "Assign",
    ignore: "Ignore",
    unignore: "Show again",
    delete: "Delete",
    confirmDelete: "Really delete this device?",
    confirmYes: "Yes, delete",
    confirmNo: "Cancel",
    chooseArea: "— Choose area —",
    colDevice: "Device",
    colIntegration: "Integration",
    colArea: "Assign area",
    colCurrentArea: "Current area",
    colActions: "Actions",
    noArea: "No area",
    allDone: "All devices already have an area. 🎉",
    ignoredEmpty: "No ignored devices.",
    noFilterMatch: "No devices match the filter.",
    loading: "Loading…",
    errorLoad: (msg) => `Error loading data: ${msg}`,
    errorSave: (msg) => `Error saving: ${msg}`,
    errorDelete: (msg) => `Error deleting device: ${msg}`,
  },
};

class AreaManagerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._devices = [];
    this._areas = [];
    this._ignoredIds = new Set();
    this._pending = {};
    this._saving = false;
    this._loaded = false;
    this._error = null;
    this._view = "unassigned"; // "unassigned" | "ignored"
    this._confirmDelete = null;
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
      const [devices, areas, ignoredIds] = await Promise.all([
        this._hass.callWS({ type: "config/device_registry/list" }),
        this._hass.callWS({ type: "config/area_registry/list" }),
        this._hass.callWS({ type: "area_manager/get_ignored" }),
      ]);
      this._devices = devices;
      this._areas = areas.slice().sort((a, b) => a.name.localeCompare(b.name));
      this._ignoredIds = new Set(ignoredIds);
    } catch (e) {
      this._error = this._t("errorLoad", e.message);
    }
    this._render();
  }

  async _saveIgnored() {
    try {
      await this._hass.callWS({
        type: "area_manager/set_ignored",
        device_ids: [...this._ignoredIds],
      });
    } catch (e) {
      this._error = this._t("errorSave", e.message);
    }
  }

  async _ignoreDevice(deviceId) {
    this._ignoredIds.add(deviceId);
    await this._saveIgnored();
    this._render();
  }

  async _unignoreDevice(deviceId) {
    this._ignoredIds.delete(deviceId);
    await this._saveIgnored();
    this._render();
  }

  async _deleteDevice(deviceId) {
    this._confirmDelete = null;
    try {
      await this._hass.callWS({
        type: "area_manager/remove_device",
        device_id: deviceId,
      });
      this._devices = this._devices.filter((d) => d.id !== deviceId);
      this._ignoredIds.delete(deviceId);
      await this._saveIgnored();
    } catch (e) {
      this._error = this._t("errorDelete", e.message);
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
    if (filterText) filterText.addEventListener("input", (e) => { this._filterText = e.target.value; reapply(); });

    const filterMfr = this.shadowRoot.getElementById("filter-manufacturer");
    if (filterMfr) filterMfr.addEventListener("change", (e) => { this._filterManufacturer = e.target.value; reapply(); });

    const filterDomain = this.shadowRoot.getElementById("filter-domain");
    if (filterDomain) filterDomain.addEventListener("change", (e) => { this._filterDomain = e.target.value; reapply(); });

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

  _renderUnassignedRows(unassigned) {
    const areaOptions = this._areas
      .map((a) => `<option value="${a.area_id}">${a.name}</option>`)
      .join("");

    return unassigned.map((d) => {
      const label = d.name_by_user || d.name || d.id;
      const sub = [d.manufacturer, d.model].filter(Boolean).join(" · ");
      const domain = d.identifiers?.[0]?.[0] ?? "";
      const selected = this._pending[d.id] || "";
      const isConfirming = this._confirmDelete === d.id;

      const actionCell = isConfirming
        ? `<td class="cell-area cell-confirm" colspan="2">
            <span class="confirm-text">${this._t("confirmDelete")}</span>
            <button class="btn-confirm-yes" data-device="${d.id}">${this._t("confirmYes")}</button>
            <button class="btn-confirm-no" data-device="${d.id}">${this._t("confirmNo")}</button>
          </td>`
        : `<td class="cell-area">
            <select class="area-select" data-device="${d.id}">
              <option value="">${this._t("chooseArea")}</option>
              ${areaOptions}
            </select>
          </td>
          <td class="cell-actions">
            <button class="btn-assign" data-device="${d.id}" ${!selected ? "disabled" : ""}>${this._t("assign")}</button>
            <button class="btn-ignore" data-device="${d.id}">${this._t("ignore")}</button>
            <button class="btn-delete" data-device="${d.id}">${this._t("delete")}</button>
          </td>`;

      return `
        <tr class="device-row${isConfirming ? " device-row--confirming" : ""}"
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
          ${actionCell}
        </tr>`;
    }).join("");
  }

  _renderIgnoredRows(ignored) {
    return ignored.map((d) => {
      const label = d.name_by_user || d.name || d.id;
      const sub = [d.manufacturer, d.model].filter(Boolean).join(" · ");
      const domain = d.identifiers?.[0]?.[0] ?? "";
      const area = this._areas.find((a) => a.area_id === d.area_id);
      const areaLabel = area ? area.name : this._t("noArea");

      return `
        <tr class="device-row">
          <td class="cell-name">
            <div class="device-name">${label}</div>
            ${sub ? `<div class="device-sub">${sub}</div>` : ""}
          </td>
          <td class="cell-integration">
            ${domain ? `<span class="domain-chip">${domain}</span>` : `<span class="domain-chip muted">—</span>`}
          </td>
          <td class="cell-area">
            <span class="area-label ${!d.area_id ? "muted" : ""}">${areaLabel}</span>
          </td>
          <td class="cell-actions">
            <button class="btn-unignore" data-device="${d.id}">${this._t("unignore")}</button>
          </td>
        </tr>`;
    }).join("");
  }

  _render() {
    const unassigned = this._devices.filter((d) => !d.area_id && !this._ignoredIds.has(d.id));
    const ignored = this._devices.filter((d) => this._ignoredIds.has(d.id));
    const pendingCount = Object.values(this._pending).filter(Boolean).length;
    const hasFilter = this._filterText || this._filterManufacturer || this._filterDomain;

    const manufacturers = [
      ...new Set(unassigned.map((d) => d.manufacturer).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    const domains = [
      ...new Set(unassigned.map((d) => d.identifiers?.[0]?.[0]).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    const CSS = `
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
        .subtitle { color: var(--secondary-text-color, #888); margin: 4px 0 16px; font-size: 0.95em; }
        .tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          border-bottom: 2px solid var(--divider-color, #e0e0e0);
        }
        .tab {
          padding: 8px 18px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.95em;
          color: var(--secondary-text-color, #888);
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          border-radius: 0;
          transition: color 0.15s;
        }
        .tab.active {
          color: var(--primary-color, #03a9f4);
          border-bottom-color: var(--primary-color, #03a9f4);
          font-weight: 500;
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
        .toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
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
        .device-row--confirming { background: rgba(244,67,54,0.06); }
        .cell-name { padding: 10px 16px; }
        .cell-integration { padding: 10px 16px; width: 120px; }
        .cell-area { padding: 10px 16px; width: 200px; }
        .cell-actions { padding: 10px 12px; width: 220px; white-space: nowrap; }
        .cell-confirm { width: 420px; }
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
        .area-label { font-size: 0.9em; }
        .area-label.muted { color: var(--secondary-text-color, #888); font-style: italic; }
        .area-select {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
          font-size: 0.95em;
        }
        button { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: 500; transition: opacity 0.15s; }
        button:disabled { opacity: 0.4; cursor: default; }
        .btn-assign { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); margin-right: 4px; }
        .btn-ignore { background: var(--secondary-background-color, #e8e8e8); color: var(--primary-text-color); margin-right: 4px; }
        .btn-delete { background: transparent; border: 1px solid var(--error-color, #f44336); color: var(--error-color, #f44336); }
        .btn-unignore { background: var(--secondary-background-color, #e8e8e8); color: var(--primary-text-color); }
        .confirm-text { font-size: 0.9em; margin-right: 8px; color: var(--error-color, #f44336); font-weight: 500; }
        .btn-confirm-yes { background: var(--error-color, #f44336); color: #fff; margin-right: 4px; }
        .btn-confirm-no { background: transparent; border: 1px solid var(--divider-color, #ccc); color: var(--primary-text-color); }
        .btn-save-all { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); padding: 9px 20px; }
        .btn-reload { background: transparent; border: 1px solid var(--divider-color, #ccc); color: var(--primary-text-color); padding: 8px 16px; }
        .loading { text-align: center; padding: 48px 0; color: var(--secondary-text-color, #888); }
      </style>`;

    const unassignedContent = unassigned.length === 0
      ? `<div class="empty">${this._t("allDone")}</div>`
      : `
        <div class="filter-bar">
          <input type="search" id="filter-text" class="filter-input"
            placeholder="${this._t("searchPlaceholder")}" value="${this._filterText}">
          <select id="filter-manufacturer" class="filter-select">
            <option value="">${this._t("allManufacturers")}</option>
            ${manufacturers.map((m) => `<option value="${m}" ${this._filterManufacturer === m ? "selected" : ""}>${m}</option>`).join("")}
          </select>
          <select id="filter-domain" class="filter-select">
            <option value="">${this._t("allIntegrations")}</option>
            ${domains.map((d) => `<option value="${d}" ${this._filterDomain === d ? "selected" : ""}>${d}</option>`).join("")}
          </select>
          <button class="btn-clear-filter" id="clear-filter" style="${hasFilter ? "" : "display:none"}">${this._t("clearFilter")}</button>
        </div>
        <div class="toolbar">
          <button class="btn-save-all" id="save-all" ${this._saving || pendingCount === 0 ? "disabled" : ""}>
            ${this._saving ? this._t("saving") : this._t("saveAll", pendingCount)}
          </button>
          <button class="btn-reload" id="reload">${this._t("reload")}</button>
        </div>
        <div class="empty-filter" id="empty-filter">${this._t("noFilterMatch")}</div>
        <table>
          <thead><tr>
            <th>${this._t("colDevice")}</th>
            <th>${this._t("colIntegration")}</th>
            <th>${this._t("colArea")}</th>
            <th>${this._t("colActions")}</th>
          </tr></thead>
          <tbody>${this._renderUnassignedRows(unassigned)}</tbody>
        </table>`;

    const ignoredContent = ignored.length === 0
      ? `<div class="empty">${this._t("ignoredEmpty")}</div>`
      : `
        <table>
          <thead><tr>
            <th>${this._t("colDevice")}</th>
            <th>${this._t("colIntegration")}</th>
            <th>${this._t("colCurrentArea")}</th>
            <th>${this._t("colActions")}</th>
          </tr></thead>
          <tbody>${this._renderIgnoredRows(ignored)}</tbody>
        </table>`;

    this.shadowRoot.innerHTML = `
      ${CSS}
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
        : `
          <div class="tabs">
            <button class="tab ${this._view === "unassigned" ? "active" : ""}" data-view="unassigned">
              ${this._t("tabUnassigned", unassigned.length)}
            </button>
            <button class="tab ${this._view === "ignored" ? "active" : ""}" data-view="ignored">
              ${this._t("tabIgnored", ignored.length)}
            </button>
          </div>
          ${this._view === "unassigned" ? unassignedContent : ignoredContent}
          ${this._view === "ignored" ? "" : ""}
        `}
    `;

    // Tab switching
    this.shadowRoot.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this._view = e.target.dataset.view;
        this._confirmDelete = null;
        this._render();
      });
    });

    // Unassigned view listeners
    if (this._view === "unassigned") {
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

      this.shadowRoot.querySelectorAll(".btn-assign").forEach((btn) =>
        btn.addEventListener("click", (e) => this._saveDevice(e.target.dataset.device))
      );

      this.shadowRoot.querySelectorAll(".btn-ignore").forEach((btn) =>
        btn.addEventListener("click", (e) => this._ignoreDevice(e.target.dataset.device))
      );

      this.shadowRoot.querySelectorAll(".btn-delete").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          this._confirmDelete = e.target.dataset.device;
          this._render();
        })
      );

      this.shadowRoot.querySelectorAll(".btn-confirm-yes").forEach((btn) =>
        btn.addEventListener("click", (e) => this._deleteDevice(e.target.dataset.device))
      );

      this.shadowRoot.querySelectorAll(".btn-confirm-no").forEach((btn) =>
        btn.addEventListener("click", () => {
          this._confirmDelete = null;
          this._render();
        })
      );

      const saveAll = this.shadowRoot.getElementById("save-all");
      if (saveAll) saveAll.addEventListener("click", () => this._saveAll());

      const reload = this.shadowRoot.getElementById("reload");
      if (reload) {
        reload.addEventListener("click", () => {
          this._loaded = false;
          this._pending = {};
          this._confirmDelete = null;
          this._load();
        });
      }

      this._bindFilterListeners();
      this._applyFilter();
    }

    // Ignored view listeners
    if (this._view === "ignored") {
      this.shadowRoot.querySelectorAll(".btn-unignore").forEach((btn) =>
        btn.addEventListener("click", (e) => this._unignoreDevice(e.target.dataset.device))
      );
    }
  }
}

customElements.define("area-manager-panel", AreaManagerPanel);
