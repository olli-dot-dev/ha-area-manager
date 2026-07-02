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
    colEntities: "Entitäten",
    expandEntities: "Entitäten einblenden",
    collapseEntities: "Entitäten ausblenden",
    entityCount: (n) => `${n} Entität${n !== 1 ? "en" : ""}`,
    dlgManufacturer: "Hersteller",
    dlgModel: "Modell",
    dlgIntegration: "Integration",
    dlgArea: "Bereich",
    dlgEntities: "Entitäten",
    dlgNoEntities: "Keine Entitäten vorhanden.",
    dlgGoToDevice: "Zur Geräteseite",
    dlgClose: "Schließen",
    dlgLoading: "Lade Details…",
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
    colEntities: "Entities",
    expandEntities: "Show entities",
    collapseEntities: "Hide entities",
    entityCount: (n) => `${n} ${n !== 1 ? "entities" : "entity"}`,
    dlgManufacturer: "Manufacturer",
    dlgModel: "Model",
    dlgIntegration: "Integration",
    dlgArea: "Area",
    dlgEntities: "Entities",
    dlgNoEntities: "No entities.",
    dlgGoToDevice: "Go to device page",
    dlgClose: "Close",
    dlgLoading: "Loading details…",
  },
};

class AreaManagerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._devices = [];
    this._areas = [];
    this._entities = [];
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
    this._entitiesExpanded = false;
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
      const [devices, areas, entities, ignoredIds] = await Promise.all([
        this._hass.callWS({ type: "config/device_registry/list" }),
        this._hass.callWS({ type: "config/area_registry/list" }),
        this._hass.callWS({ type: "config/entity_registry/list" }),
        this._hass.callWS({ type: "area_manager/get_ignored" }),
      ]);
      this._devices = devices;
      this._areas = areas.slice().sort((a, b) => a.name.localeCompare(b.name));
      this._entities = entities;
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

  async _showDeviceDetail(device) {
    // Remove any existing dialog
    const existing = this.shadowRoot.getElementById("area-mgr-dlg");
    if (existing) existing.remove();

    const label = device.name_by_user || device.name || device.id;
    const domain = device.identifiers?.[0]?.[0] ?? "—";
    const areaName = this._areas.find((a) => a.area_id === device.area_id)?.name
      || this._t("noArea");

    const dlg = document.createElement("dialog");
    dlg.id = "area-mgr-dlg";
    dlg.innerHTML = `
      <div class="dlg-header">
        <h2 class="dlg-title">${label}</h2>
        <button class="dlg-close" id="dlg-close" title="${this._t("dlgClose")}">✕</button>
      </div>
      <div class="dlg-body">
        <dl class="dlg-grid">
          ${device.manufacturer ? `<dt>${this._t("dlgManufacturer")}</dt><dd>${device.manufacturer}</dd>` : ""}
          ${device.model ? `<dt>${this._t("dlgModel")}</dt><dd>${device.model}</dd>` : ""}
          <dt>${this._t("dlgIntegration")}</dt><dd><span class="dlg-chip">${domain}</span></dd>
          <dt>${this._t("dlgArea")}</dt><dd>${areaName}</dd>
        </dl>
        <p class="dlg-section">${this._t("dlgEntities")}</p>
        <p class="dlg-loading" id="dlg-loading">${this._t("dlgLoading")}</p>
        <ul class="dlg-entity-list" id="dlg-entity-list" style="display:none"></ul>
        <p class="dlg-empty-entities" id="dlg-empty-entities" style="display:none">${this._t("dlgNoEntities")}</p>
        <button class="dlg-nav-btn" id="dlg-nav">${this._t("dlgGoToDevice")} ↗</button>
      </div>`;

    this.shadowRoot.appendChild(dlg);
    dlg.showModal();

    // Native close (button, backdrop click, Escape) always fires "close" — remove on that
    // single event so Escape (which only triggers the browser default close()) is handled too.
    dlg.addEventListener("close", () => dlg.remove());
    dlg.querySelector("#dlg-close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.querySelector("#dlg-nav").addEventListener("click", () => {
      dlg.close();
      history.pushState(null, "", `/config/devices/device/${device.id}`);
      window.dispatchEvent(new CustomEvent("location-changed", { bubbles: true }));
    });

    // Use already-loaded entity data
    const entities = this._entities.filter((e) => e.device_id === device.id);
    dlg.querySelector("#dlg-loading").style.display = "none";
    if (entities.length === 0) {
      dlg.querySelector("#dlg-empty-entities").style.display = "";
    } else {
      const list = dlg.querySelector("#dlg-entity-list");
      list.style.display = "";
      list.innerHTML = entities.map((e) => {
        const name = e.name || e.original_name;
        return `<li>
          ${name ? `<span class="dlg-entity-name">${name}</span>` : ""}
          <span class="dlg-entity-id">${e.entity_id}</span>
        </li>`;
      }).join("");
    }
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
        (row.dataset.sub || "").toLowerCase().includes(text) ||
        (row.dataset.entities || "").toLowerCase().includes(text);
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

      const devEntities = this._entities.filter((e) => e.device_id === d.id);
      const entitiesText = devEntities.map((e) => e.name || e.original_name || e.entity_id).join(" ");
      const entityCell = `<td class="cell-entities">
        <span class="entity-count">${this._t("entityCount", devEntities.length)}</span>
        <div class="entity-details">${
          devEntities.map((e) => {
            const name = e.name || e.original_name;
            return `<div class="entity-row">
              ${name ? `<span class="entity-row-name">${name}</span>` : ""}
              <span class="entity-row-id">${e.entity_id}</span>
            </div>`;
          }).join("")
        }</div>
      </td>`;

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
            data-device-id="${d.id}"
            data-name="${label}"
            data-manufacturer="${d.manufacturer || ""}"
            data-domain="${domain}"
            data-sub="${sub}"
            data-entities="${entitiesText}">
          <td class="cell-name">
            <div class="device-name">${label}</div>
            ${sub ? `<div class="device-sub">${sub}</div>` : ""}
          </td>
          <td class="cell-integration">
            ${domain ? `<span class="domain-chip">${domain}</span>` : `<span class="domain-chip muted">—</span>`}
          </td>
          ${entityCell}
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

      const devEntities = this._entities.filter((e) => e.device_id === d.id);
      const entitiesText = devEntities.map((e) => e.name || e.original_name || e.entity_id).join(" ");
      const entityCell = `<td class="cell-entities">
        <span class="entity-count">${this._t("entityCount", devEntities.length)}</span>
        <div class="entity-details">${
          devEntities.map((e) => {
            const name = e.name || e.original_name;
            return `<div class="entity-row">
              ${name ? `<span class="entity-row-name">${name}</span>` : ""}
              <span class="entity-row-id">${e.entity_id}</span>
            </div>`;
          }).join("")
        }</div>
      </td>`;

      return `
        <tr class="device-row" data-device-id="${d.id}" data-entities="${entitiesText}">
          <td class="cell-name">
            <div class="device-name">${label}</div>
            ${sub ? `<div class="device-sub">${sub}</div>` : ""}
          </td>
          <td class="cell-integration">
            ${domain ? `<span class="domain-chip">${domain}</span>` : `<span class="domain-chip muted">—</span>`}
          </td>
          ${entityCell}
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
          table-layout: fixed;
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
        .device-row:hover { background: var(--table-row-alternative-background-color, rgba(0, 0, 0, 0.06)); }
        .device-row--confirming { background: rgba(244,67,54,0.06); }
        .device-row td { vertical-align: top; }
        .cell-name { padding: 10px 16px; }
        .cell-integration { padding: 10px 16px; width: 110px; }
        .cell-entities { padding: 8px 16px; width: 220px; }
        .cell-area { padding: 10px 16px; width: 190px; }
        .cell-actions { padding: 10px 12px; width: 220px; white-space: nowrap; }
        .cell-confirm { width: 420px; }
        .entity-count { font-size: 0.85em; color: var(--secondary-text-color, #888); }
        .entity-details { display: none; }
        table.entities-expanded .entity-details { display: block; }
        table.entities-expanded .entity-count { display: none; }
        .entity-row { line-height: 1.35; margin-bottom: 3px; }
        .entity-row:last-child { margin-bottom: 0; }
        .entity-row-name { display: block; font-size: 0.88em; overflow-wrap: anywhere; }
        .entity-row-id { display: block; font-size: 0.78em; font-family: monospace; color: var(--secondary-text-color, #888); overflow-wrap: anywhere; }
        .device-name { font-weight: 500; overflow-wrap: anywhere; }
        .device-sub { font-size: 0.82em; color: var(--secondary-text-color, #888); margin-top: 2px; overflow-wrap: anywhere; }
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
        .btn-ignore { background: var(--secondary-background-color, #e8e8e8); color: var(--primary-text-color); border: 1px solid var(--divider-color, #ccc); margin-right: 4px; }
        .btn-delete { background: transparent; border: 1px solid var(--error-color, #f44336); color: var(--error-color, #f44336); }
        .btn-unignore { background: var(--secondary-background-color, #e8e8e8); color: var(--primary-text-color); border: 1px solid var(--divider-color, #ccc); }
        .confirm-text { font-size: 0.9em; margin-right: 8px; color: var(--error-color, #f44336); font-weight: 500; }
        .btn-confirm-yes { background: var(--error-color, #f44336); color: #fff; margin-right: 4px; }
        .btn-confirm-no { background: transparent; border: 1px solid var(--divider-color, #ccc); color: var(--primary-text-color); }
        .btn-save-all { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); padding: 9px 20px; }
        .btn-reload { background: transparent; border: 1px solid var(--divider-color, #ccc); color: var(--primary-text-color); padding: 8px 16px; }
        .btn-toggle-entities { background: transparent; border: 1px solid var(--divider-color, #ccc); color: var(--primary-text-color); padding: 8px 16px; }
        .loading { text-align: center; padding: 48px 0; color: var(--secondary-text-color, #888); }
        .cell-name, .cell-integration { cursor: pointer; }
        /* Device detail dialog */
        #area-mgr-dlg {
          border: none;
          border-radius: 12px;
          padding: 0;
          max-width: 560px;
          width: 90vw;
          max-height: 82vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0,0,0,0.28);
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
          font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
        }
        #area-mgr-dlg::backdrop { background: rgba(0,0,0,0.48); }
        .dlg-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
          flex-shrink: 0;
        }
        .dlg-title { margin: 0; font-size: 1.15em; font-weight: 500; }
        .dlg-close {
          background: none;
          border: none;
          font-size: 1.3em;
          line-height: 1;
          cursor: pointer;
          color: var(--secondary-text-color, #888);
          padding: 4px 8px;
          border-radius: 4px;
        }
        .dlg-close:hover { background: var(--secondary-background-color, #f0f0f0); }
        .dlg-body { overflow-y: auto; padding: 16px 20px; flex: 1; }
        .dlg-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 6px 16px;
          margin: 0 0 20px;
          font-size: 0.93em;
        }
        .dlg-grid dt { color: var(--secondary-text-color, #888); font-size: 0.88em; align-self: center; margin: 0; }
        .dlg-grid dd { margin: 0; }
        .dlg-chip {
          display: inline-block;
          background: var(--secondary-background-color, #f0f0f0);
          color: var(--secondary-text-color, #555);
          border-radius: 10px;
          padding: 1px 9px;
          font-size: 0.85em;
          font-family: monospace;
        }
        .dlg-section {
          font-size: 0.82em;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--secondary-text-color, #888);
          margin: 0 0 8px;
        }
        .dlg-loading, .dlg-empty-entities { color: var(--secondary-text-color, #888); font-size: 0.9em; margin: 0 0 16px; }
        .dlg-entity-list { list-style: none; padding: 0; margin: 0 0 20px; }
        .dlg-entity-list li {
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding: 7px 0;
          border-bottom: 1px solid var(--divider-color, #e8e8e8);
        }
        .dlg-entity-list li:last-child { border-bottom: none; }
        .dlg-entity-name { font-size: 0.9em; font-weight: 500; }
        .dlg-entity-id { font-family: monospace; font-size: 0.82em; color: var(--secondary-text-color, #777); }
        .dlg-nav-btn {
          display: inline-block;
          background: none;
          border: 1px solid var(--primary-color, #03a9f4);
          color: var(--primary-color, #03a9f4);
          padding: 7px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.88em;
          font-weight: 500;
        }
        .dlg-nav-btn:hover { background: rgba(3,169,244,0.08); }
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
          <button class="btn-toggle-entities" id="toggle-entities">
            ${this._entitiesExpanded ? this._t("collapseEntities") : this._t("expandEntities")}
          </button>
        </div>
        <div class="empty-filter" id="empty-filter">${this._t("noFilterMatch")}</div>
        <table>
          <colgroup>
            <col>
            <col style="width:110px">
            <col style="width:220px">
            <col style="width:190px">
            <col style="width:220px">
          </colgroup>
          <thead><tr>
            <th>${this._t("colDevice")}</th>
            <th>${this._t("colIntegration")}</th>
            <th>${this._t("colEntities")}</th>
            <th>${this._t("colArea")}</th>
            <th>${this._t("colActions")}</th>
          </tr></thead>
          <tbody>${this._renderUnassignedRows(unassigned)}</tbody>
        </table>`;

    const ignoredContent = ignored.length === 0
      ? `<div class="empty">${this._t("ignoredEmpty")}</div>`
      : `
        <table>
          <colgroup>
            <col>
            <col style="width:110px">
            <col style="width:220px">
            <col style="width:190px">
            <col style="width:220px">
          </colgroup>
          <thead><tr>
            <th>${this._t("colDevice")}</th>
            <th>${this._t("colIntegration")}</th>
            <th>${this._t("colEntities")}</th>
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

      const toggleEntities = this.shadowRoot.getElementById("toggle-entities");
      if (toggleEntities) {
        toggleEntities.addEventListener("click", () => {
          this._entitiesExpanded = !this._entitiesExpanded;
          const table = this.shadowRoot.querySelector("table");
          if (table) table.classList.toggle("entities-expanded", this._entitiesExpanded);
          toggleEntities.textContent = this._entitiesExpanded
            ? this._t("collapseEntities")
            : this._t("expandEntities");
        });
      }

      // Restore expand state after re-render
      const table = this.shadowRoot.querySelector("table");
      if (table && this._entitiesExpanded) table.classList.add("entities-expanded");

      this._bindFilterListeners();
      this._applyFilter();
    }

    // Ignored view listeners
    if (this._view === "ignored") {
      this.shadowRoot.querySelectorAll(".btn-unignore").forEach((btn) =>
        btn.addEventListener("click", (e) => this._unignoreDevice(e.target.dataset.device))
      );
    }

    // Row click → device detail dialog (both views)
    const tbody = this.shadowRoot.querySelector("table tbody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        if (e.target.closest("button, select")) return;
        const row = e.target.closest(".device-row[data-device-id]");
        if (!row) return;
        const device = this._devices.find((d) => d.id === row.dataset.deviceId);
        if (device) this._showDeviceDetail(device);
      });
    }
  }
}

customElements.define("area-manager-panel", AreaManagerPanel);
