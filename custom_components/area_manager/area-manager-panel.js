const TRANSLATIONS = {
  de: {
    title: "Area Manager",
    subtitle: "Geräte ohne Bereichszuweisung erkennen und schnell einem Bereich zuordnen.",
    badge: (n) => `${n} ohne Bereich`,
    tabUnassigned: (n) => `Ohne Bereich (${n})`,
    tabIgnored: (n) => `Ignoriert (${n})`,
    tabAssigned: (n) => `Zugewiesen (${n})`,
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
    unassignOption: "— Kein Bereich —",
    renameTitle: "Umbenennen",
    selectAll: "Alle auswählen",
    bulkSelectedCount: (n) => `${n} ausgewählt`,
    bulkClear: "Auswahl aufheben",
    colDevice: "Gerät",
    colIntegration: "Integration",
    colArea: "Bereich zuweisen",
    colCurrentArea: "Aktueller Bereich",
    colActions: "Aktionen",
    noArea: "Kein Bereich",
    allDone: "Alle Geräte haben bereits einen Bereich. 🎉",
    ignoredEmpty: "Keine ignorierten Geräte.",
    assignedEmpty: "Noch keine Geräte mit Bereich.",
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
    dlgCreatedAt: "Hinzugefügt am",
    dlgEntities: "Entitäten",
    dlgNoEntities: "Keine Entitäten vorhanden.",
    dlgShowDetails: "Details anzeigen",
    dlgHideDetails: "Details ausblenden",
    dlgState: "Status",
    dlgLastSeen: "Zuletzt gesehen",
    dlgAttributes: "Attribute",
    dlgNoState: "Kein Status verfügbar",
    dlgLastSeenNote: (restartTime) => `⚠️ nahe am letzten HA-Neustart (${restartTime}) — der tatsächliche Zeitpunkt könnte länger her sein`,
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
    tabAssigned: (n) => `Assigned (${n})`,
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
    unassignOption: "— No area —",
    renameTitle: "Rename",
    selectAll: "Select all",
    bulkSelectedCount: (n) => `${n} selected`,
    bulkClear: "Clear selection",
    colDevice: "Device",
    colIntegration: "Integration",
    colArea: "Assign area",
    colCurrentArea: "Current area",
    colActions: "Actions",
    noArea: "No area",
    allDone: "All devices already have an area. 🎉",
    ignoredEmpty: "No ignored devices.",
    assignedEmpty: "No devices with an area yet.",
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
    dlgCreatedAt: "Added on",
    dlgEntities: "Entities",
    dlgNoEntities: "No entities.",
    dlgShowDetails: "Show details",
    dlgHideDetails: "Hide details",
    dlgState: "State",
    dlgLastSeen: "Last seen",
    dlgAttributes: "Attributes",
    dlgNoState: "No state available",
    dlgLastSeenNote: (restartTime) => `⚠️ close to the last HA restart (${restartTime}) — the actual time could be older`,
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
    this._selected = new Set();
    this._saving = false;
    this._loaded = false;
    this._error = null;
    this._view = "unassigned"; // "unassigned" | "ignored" | "assigned"
    this._confirmDelete = null;
    this._filterText = "";
    this._filterManufacturer = "";
    this._filterDomain = "";
    this._entitiesExpanded = false;
    this._setupTime = null;
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
      const [devices, areas, entities, ignoredIds, setupTime] = await Promise.all([
        this._hass.callWS({ type: "config/device_registry/list" }),
        this._hass.callWS({ type: "config/area_registry/list" }),
        this._hass.callWS({ type: "config/entity_registry/list" }),
        this._hass.callWS({ type: "area_manager/get_ignored" }),
        this._hass.callWS({ type: "area_manager/get_setup_time" }),
      ]);
      this._devices = devices;
      this._areas = areas.slice().sort((a, b) => a.name.localeCompare(b.name));
      this._entities = entities;
      this._ignoredIds = new Set(ignoredIds);
      this._setupTime = setupTime;
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
    this._selected.delete(deviceId);
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
      this._selected.delete(deviceId);
      await this._saveIgnored();
    } catch (e) {
      this._error = this._t("errorDelete", e.message);
    }
    this._render();
  }

  // The "no area" option in the assigned tab's dropdown uses this sentinel
  // instead of an empty string, since empty string already means "nothing
  // chosen yet" for the unassigned tab's placeholder option.
  static UNASSIGN_SENTINEL = "__none__";

  _resolveAreaId(rawValue) {
    return rawValue === AreaManagerPanel.UNASSIGN_SENTINEL ? null : rawValue;
  }

  // Registry timestamps may arrive as Unix seconds (number) or an ISO string
  // depending on HA version, so handle both defensively rather than assume one.
  _formatTimestamp(value) {
    if (value === undefined || value === null || value === "") return "—";
    const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(this._hass?.language || "de");
  }

  // "Last seen" timestamps get rewritten on every HA restart (the integration
  // writes a fresh state, e.g. "unavailable", on startup), so a value that
  // merely coincides with our own setup time likely just reflects "since at
  // least the last restart" rather than genuine recent activity. Flag that.
  _lastSeenNote(isoValue) {
    if (!isoValue || !this._setupTime) return null;
    const diffMs = Math.abs(new Date(isoValue) - new Date(this._setupTime));
    if (Number.isNaN(diffMs) || diffMs > 5 * 60 * 1000) return null;
    return this._t("dlgLastSeenNote", this._formatTimestamp(this._setupTime));
  }

  async _saveDevice(deviceId) {
    const raw = this._pending[deviceId];
    if (!raw) return;
    const areaId = this._resolveAreaId(raw);
    try {
      await this._hass.callWS({
        type: "config/device_registry/update",
        device_id: deviceId,
        area_id: areaId,
      });
      delete this._pending[deviceId];
      this._selected.delete(deviceId);
      const dev = this._devices.find((d) => d.id === deviceId);
      if (dev) dev.area_id = areaId;
      this._render();
    } catch (e) {
      this._error = this._t("errorSave", e.message);
      this._render();
    }
  }

  // Excludes pending entries that match the device's current area (e.g. the
  // user picked a different area in the "assigned" tab, then picked it back)
  // so counts/save-all don't act on a no-op change.
  _pendingEntries() {
    return Object.entries(this._pending).filter(([id, v]) => {
      if (!v) return false;
      const dev = this._devices.find((d) => d.id === id);
      const current = (dev && dev.area_id) || "";
      return v !== current;
    });
  }

  async _saveAll() {
    const toSave = this._pendingEntries();
    if (!toSave.length) return;
    this._saving = true;
    this._render();
    try {
      await Promise.all(
        toSave.map(([deviceId, raw]) =>
          this._hass.callWS({
            type: "config/device_registry/update",
            device_id: deviceId,
            area_id: this._resolveAreaId(raw),
          })
        )
      );
      toSave.forEach(([deviceId, raw]) => {
        delete this._pending[deviceId];
        this._selected.delete(deviceId);
        const dev = this._devices.find((d) => d.id === deviceId);
        if (dev) dev.area_id = this._resolveAreaId(raw);
      });
    } catch (e) {
      this._error = this._t("errorSave", e.message);
    }
    this._saving = false;
    this._render();
  }

  async _bulkAssign(rawAreaId) {
    if (!rawAreaId || this._selected.size === 0) return;
    const areaId = this._resolveAreaId(rawAreaId);
    const ids = [...this._selected];
    this._saving = true;
    this._render();
    try {
      await Promise.all(
        ids.map((deviceId) =>
          this._hass.callWS({
            type: "config/device_registry/update",
            device_id: deviceId,
            area_id: areaId,
          })
        )
      );
      ids.forEach((deviceId) => {
        delete this._pending[deviceId];
        this._selected.delete(deviceId);
        const dev = this._devices.find((d) => d.id === deviceId);
        if (dev) dev.area_id = areaId;
      });
    } catch (e) {
      this._error = this._t("errorSave", e.message);
    }
    this._saving = false;
    this._render();
  }

  async _renameDevice(deviceId, newName) {
    try {
      await this._hass.callWS({
        type: "config/device_registry/update",
        device_id: deviceId,
        name_by_user: newName || null,
      });
      const dev = this._devices.find((d) => d.id === deviceId);
      if (dev) dev.name_by_user = newName || null;
      return true;
    } catch (e) {
      this._error = this._t("errorSave", e.message);
      return false;
    }
  }

  async _showDeviceDetail(device) {
    // Remove any existing dialog
    const existing = this.shadowRoot.getElementById("area-mgr-dlg");
    if (existing) existing.remove();

    const label = device.name_by_user || device.name || device.id;
    const domain = device.identifiers?.[0]?.[0] ?? "—";
    const areaName = this._areas.find((a) => a.area_id === device.area_id)?.name
      || this._t("noArea");
    const isIgnored = this._ignoredIds.has(device.id);

    // Devices have no "last seen" of their own — derive it as the most recent
    // activity across all of the device's entities, so a stale device (all
    // entities long inactive) is obvious at a glance without expanding details.
    const entities = this._entities.filter((e) => e.device_id === device.id);
    const lastSeenValues = entities
      .map((e) => this._hass.states?.[e.entity_id])
      .filter(Boolean)
      .map((s) => s.last_reported || s.last_updated)
      .filter(Boolean);
    const deviceLastSeen = lastSeenValues.length
      ? lastSeenValues.reduce((latest, v) => (new Date(v) > new Date(latest) ? v : latest))
      : null;

    const areaOptionsHtml = this._areas
      .map((a) => `<option value="${a.area_id}" ${a.area_id === device.area_id ? "selected" : ""}>${a.name}</option>`)
      .join("");
    const areaSelectOptions = device.area_id
      ? `<option value="${AreaManagerPanel.UNASSIGN_SENTINEL}">${this._t("unassignOption")}</option>${areaOptionsHtml}`
      : `<option value="">${this._t("chooseArea")}</option>${areaOptionsHtml}`;

    const dlg = document.createElement("dialog");
    dlg.id = "area-mgr-dlg";
    dlg.innerHTML = `
      <div class="dlg-header">
        <div class="dlg-title-row">
          <h2 class="dlg-title" id="dlg-title-text">${label}</h2>
          <button class="btn-rename" id="dlg-rename" title="${this._t("renameTitle")}">✏️</button>
        </div>
        <button class="dlg-close" id="dlg-close" title="${this._t("dlgClose")}">✕</button>
      </div>
      <div class="dlg-body">
        <p class="dlg-rename-error" id="dlg-rename-error" style="display:none"></p>
        <dl class="dlg-grid">
          ${device.manufacturer ? `<dt>${this._t("dlgManufacturer")}</dt><dd>${device.manufacturer}</dd>` : ""}
          ${device.model ? `<dt>${this._t("dlgModel")}</dt><dd>${device.model}</dd>` : ""}
          <dt>${this._t("dlgIntegration")}</dt><dd><span class="dlg-chip">${domain}</span></dd>
          <dt>${this._t("dlgArea")}</dt><dd>${areaName}</dd>
          ${device.created_at ? `<dt>${this._t("dlgCreatedAt")}</dt><dd>${this._formatTimestamp(device.created_at)}</dd>` : ""}
          ${deviceLastSeen ? `<dt>${this._t("dlgLastSeen")}</dt><dd>${this._formatTimestamp(deviceLastSeen)}${this._lastSeenNote(deviceLastSeen) ? `<div class="dlg-lastseen-note">${this._lastSeenNote(deviceLastSeen)}</div>` : ""}</dd>` : ""}
        </dl>
        <div class="dlg-actions">
          <select class="area-select" id="dlg-area-select" data-current-area="${device.area_id || ""}">
            ${areaSelectOptions}
          </select>
          <button class="btn-assign" id="dlg-assign" disabled>${this._t("assign")}</button>
          ${!device.area_id ? `<button class="${isIgnored ? "btn-unignore" : "btn-ignore"}" id="dlg-ignore-toggle">${isIgnored ? this._t("unignore") : this._t("ignore")}</button>` : ""}
          <span id="dlg-delete-slot"></span>
        </div>
        <div class="dlg-section-row">
          <p class="dlg-section">${this._t("dlgEntities")}</p>
          <button class="btn-toggle-entities" id="dlg-toggle-details">${this._t("dlgShowDetails")}</button>
        </div>
        <p class="dlg-loading" id="dlg-loading">${this._t("dlgLoading")}</p>
        <ul class="dlg-entity-list" id="dlg-entity-list" style="display:none"></ul>
        <p class="dlg-empty-entities" id="dlg-empty-entities" style="display:none">${this._t("dlgNoEntities")}</p>
        <button class="dlg-nav-btn" id="dlg-nav">${this._t("dlgGoToDevice")} ↗</button>
      </div>`;

    this.shadowRoot.appendChild(dlg);
    dlg.showModal();

    // Renaming keeps the modal open (user may still want to assign/ignore/delete
    // afterwards), so it deliberately never calls _render() while open — that would
    // wipe shadowRoot.innerHTML (and the open dialog with it) mid-edit. Instead the
    // full re-render is deferred to the "close" handler below, only if a rename happened.
    let renamed = false;

    // Native close (button, backdrop click, Escape) always fires "close" — remove on that
    // single event so Escape (which only triggers the browser default close()) is handled too.
    dlg.addEventListener("close", () => { dlg.remove(); if (renamed) this._render(); });
    dlg.querySelector("#dlg-close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.querySelector("#dlg-nav").addEventListener("click", () => {
      dlg.close();
      history.pushState(null, "", `/config/devices/device/${device.id}`);
      window.dispatchEvent(new CustomEvent("location-changed", { bubbles: true }));
    });

    // Rename (header pencil icon)
    const renameBtn = dlg.querySelector("#dlg-rename");
    renameBtn.addEventListener("click", () => {
      const titleText = dlg.querySelector("#dlg-title-text");
      const originalLabel = titleText.textContent;
      const input = document.createElement("input");
      input.type = "text";
      input.className = "rename-input";
      input.value = device.name_by_user || device.name || device.id;
      titleText.replaceWith(input);
      renameBtn.style.display = "none";
      input.focus();
      input.select();

      let committed = false;
      const restoreTitle = (text) => {
        const h2 = document.createElement("h2");
        h2.className = "dlg-title";
        h2.id = "dlg-title-text";
        h2.textContent = text;
        input.replaceWith(h2);
        renameBtn.style.display = "";
      };
      const cancel = () => {
        if (committed) return;
        committed = true;
        restoreTitle(originalLabel);
      };
      const commit = async () => {
        if (committed) return;
        committed = true;
        const newName = input.value.trim();
        const ok = await this._renameDevice(device.id, newName);
        if (ok) {
          renamed = true;
          restoreTitle(newName || device.name || device.id);
        } else {
          const errEl = dlg.querySelector("#dlg-rename-error");
          if (errEl) { errEl.textContent = this._error; errEl.style.display = ""; }
          this._error = null;
          committed = false;
          input.focus();
        }
      };
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") commit();
        if (ev.key === "Escape") cancel();
      });
      input.addEventListener("blur", () => commit());
    });

    // Assign area
    const areaSelect = dlg.querySelector("#dlg-area-select");
    const assignBtn = dlg.querySelector("#dlg-assign");
    areaSelect.addEventListener("change", (e) => {
      assignBtn.disabled = e.target.value === areaSelect.dataset.currentArea;
    });
    assignBtn.addEventListener("click", () => {
      this._pending[device.id] = areaSelect.value;
      dlg.close();
      this._saveDevice(device.id);
    });

    // Ignore / unignore toggle (only offered for devices without an area)
    const ignoreToggle = dlg.querySelector("#dlg-ignore-toggle");
    if (ignoreToggle) {
      ignoreToggle.addEventListener("click", () => {
        dlg.close();
        if (isIgnored) this._unignoreDevice(device.id);
        else this._ignoreDevice(device.id);
      });
    }

    // Delete (always offered, with an inline two-step confirm)
    const deleteSlot = dlg.querySelector("#dlg-delete-slot");
    const renderDeleteButton = () => {
      deleteSlot.innerHTML = `<button class="btn-delete" id="dlg-delete">${this._t("delete")}</button>`;
      deleteSlot.querySelector("#dlg-delete").addEventListener("click", () => {
        deleteSlot.innerHTML = `
          <span class="confirm-text">${this._t("confirmDelete")}</span>
          <button class="btn-confirm-yes" id="dlg-confirm-yes">${this._t("confirmYes")}</button>
          <button class="btn-confirm-no" id="dlg-confirm-no">${this._t("confirmNo")}</button>
        `;
        deleteSlot.querySelector("#dlg-confirm-yes").addEventListener("click", () => {
          dlg.close();
          this._deleteDevice(device.id);
        });
        deleteSlot.querySelector("#dlg-confirm-no").addEventListener("click", renderDeleteButton);
      });
    };
    renderDeleteButton();

    // entities already computed above (needed early for the device-level "last seen")
    dlg.querySelector("#dlg-loading").style.display = "none";
    const toggleDetails = dlg.querySelector("#dlg-toggle-details");
    if (entities.length === 0) {
      dlg.querySelector("#dlg-empty-entities").style.display = "";
      if (toggleDetails) toggleDetails.style.display = "none";
    } else {
      const list = dlg.querySelector("#dlg-entity-list");
      list.style.display = "";
      list.innerHTML = entities.map((e) => {
        const name = e.name || e.original_name;
        const stateObj = this._hass.states?.[e.entity_id];
        const entityLastSeen = stateObj?.last_reported || stateObj?.last_updated;
        const entityLastSeenNote = this._lastSeenNote(entityLastSeen);
        const detailHtml = stateObj
          ? `<dl class="dlg-grid dlg-entity-grid">
              <dt>${this._t("dlgState")}</dt><dd>${stateObj.state}</dd>
              <dt>${this._t("dlgLastSeen")}</dt><dd>${this._formatTimestamp(entityLastSeen)}${entityLastSeenNote ? `<div class="dlg-lastseen-note">${entityLastSeenNote}</div>` : ""}</dd>
              ${Object.entries(stateObj.attributes || {}).map(([k, v]) =>
                `<dt>${k}</dt><dd>${typeof v === "object" && v !== null ? JSON.stringify(v) : v}</dd>`
              ).join("")}
            </dl>`
          : `<p class="dlg-entity-no-state">${this._t("dlgNoState")}</p>`;
        return `<li>
          ${name ? `<span class="dlg-entity-name">${name}</span>` : ""}
          <span class="dlg-entity-id">${e.entity_id}</span>
          <div class="dlg-entity-detail">${detailHtml}</div>
        </li>`;
      }).join("");

      let detailsExpanded = false;
      if (toggleDetails) {
        toggleDetails.addEventListener("click", () => {
          detailsExpanded = !detailsExpanded;
          list.classList.toggle("details-expanded", detailsExpanded);
          toggleDetails.textContent = detailsExpanded ? this._t("dlgHideDetails") : this._t("dlgShowDetails");
        });
      }
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

    if (this._view === "unassigned") {
      const badge = this.shadowRoot.getElementById("badge");
      if (badge) badge.textContent = this._t("badge", visible);
    }

    const emptyFilter = this.shadowRoot.getElementById("empty-filter");
    if (emptyFilter) emptyFilter.style.display = visible === 0 ? "" : "none";

    const clearBtn = this.shadowRoot.getElementById("clear-filter");
    if (clearBtn) clearBtn.style.display = (text || mfr || domain) ? "" : "none";

    this._syncSelectAllCheckbox();
  }

  _syncSelectAllCheckbox() {
    const selectAll = this.shadowRoot.getElementById("select-all");
    if (!selectAll) return;
    const visibleCheckboxes = [...this.shadowRoot.querySelectorAll(".device-row .row-checkbox")]
      .filter((cb) => cb.closest(".device-row").style.display !== "none");
    const checkedCount = visibleCheckboxes.filter((cb) => cb.checked).length;
    selectAll.checked = visibleCheckboxes.length > 0 && checkedCount === visibleCheckboxes.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < visibleCheckboxes.length;
  }

  _updateBulkBar() {
    const bar = this.shadowRoot.getElementById("bulk-bar");
    if (bar) bar.style.display = this._selected.size === 0 ? "none" : "";
    const count = this.shadowRoot.getElementById("bulk-count");
    if (count) count.textContent = this._t("bulkSelectedCount", this._selected.size);
    this._syncSelectAllCheckbox();
  }

  _bindBulkListeners() {
    this.shadowRoot.querySelectorAll(".row-checkbox").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const id = e.target.dataset.device;
        if (e.target.checked) this._selected.add(id);
        else this._selected.delete(id);
        this._updateBulkBar();
      });
    });

    const selectAll = this.shadowRoot.getElementById("select-all");
    if (selectAll) {
      selectAll.addEventListener("change", (e) => {
        const checked = e.target.checked;
        this.shadowRoot.querySelectorAll(".device-row .row-checkbox").forEach((cb) => {
          if (cb.closest(".device-row").style.display === "none") return;
          cb.checked = checked;
          if (checked) this._selected.add(cb.dataset.device);
          else this._selected.delete(cb.dataset.device);
        });
        this._updateBulkBar();
      });
    }

    const bulkAreaSelect = this.shadowRoot.getElementById("bulk-area-select");
    const bulkAssign = this.shadowRoot.getElementById("bulk-assign");
    if (bulkAreaSelect && bulkAssign) {
      bulkAreaSelect.addEventListener("change", (e) => {
        bulkAssign.disabled = !e.target.value;
      });
      bulkAssign.addEventListener("click", () => this._bulkAssign(bulkAreaSelect.value));
    }

    const bulkClear = this.shadowRoot.getElementById("bulk-clear");
    if (bulkClear) {
      bulkClear.addEventListener("click", () => {
        this._selected.clear();
        this.shadowRoot.querySelectorAll(".row-checkbox").forEach((cb) => { cb.checked = false; });
        this._updateBulkBar();
      });
    }

    this._updateBulkBar();
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

  _renderEntityCell(device) {
    const devEntities = this._entities.filter((e) => e.device_id === device.id);
    return `<td class="cell-entities">
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
  }

  _entitiesText(device) {
    return this._entities
      .filter((e) => e.device_id === device.id)
      .map((e) => e.name || e.original_name || e.entity_id)
      .join(" ");
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
      const entitiesText = this._entitiesText(d);

      const actionCell = isConfirming
        ? `<td class="cell-area cell-confirm" colspan="2">
            <span class="confirm-text">${this._t("confirmDelete")}</span>
            <button class="btn-confirm-yes" data-device="${d.id}">${this._t("confirmYes")}</button>
            <button class="btn-confirm-no" data-device="${d.id}">${this._t("confirmNo")}</button>
          </td>`
        : `<td class="cell-area">
            <select class="area-select" data-device="${d.id}" data-current-area="">
              <option value="">${this._t("chooseArea")}</option>
              ${areaOptions}
            </select>
          </td>
          <td class="cell-actions">
            <div class="actions-wrap">
            <button class="btn-assign" data-device="${d.id}" ${!selected ? "disabled" : ""}>${this._t("assign")}</button>
            <button class="btn-ignore" data-device="${d.id}">${this._t("ignore")}</button>
            <button class="btn-delete" data-device="${d.id}">${this._t("delete")}</button>
            </div>
          </td>`;

      return `
        <tr class="device-row${isConfirming ? " device-row--confirming" : ""}"
            data-device-id="${d.id}"
            data-name="${label}"
            data-manufacturer="${d.manufacturer || ""}"
            data-domain="${domain}"
            data-sub="${sub}"
            data-entities="${entitiesText}">
          <td class="cell-checkbox">
            <input type="checkbox" class="row-checkbox" data-device="${d.id}" ${this._selected.has(d.id) ? "checked" : ""}>
          </td>
          <td class="cell-name">
            <div class="device-name">${label}</div>
            ${sub ? `<div class="device-sub">${sub}</div>` : ""}
          </td>
          <td class="cell-integration">
            ${domain ? `<span class="domain-chip">${domain}</span>` : `<span class="domain-chip muted">—</span>`}
          </td>
          ${this._renderEntityCell(d)}
          ${actionCell}
        </tr>`;
    }).join("");
  }

  _renderAssignedRows(assigned) {
    return assigned.map((d) => {
      const label = d.name_by_user || d.name || d.id;
      const sub = [d.manufacturer, d.model].filter(Boolean).join(" · ");
      const domain = d.identifiers?.[0]?.[0] ?? "";
      const entitiesText = this._entitiesText(d);
      const currentArea = d.area_id || "";
      const pendingValue = this._pending[d.id];
      const selectedValue = pendingValue !== undefined ? pendingValue : currentArea;
      const isDirty = pendingValue !== undefined && pendingValue !== currentArea;

      const areaOptions = this._areas
        .map((a) => `<option value="${a.area_id}" ${a.area_id === selectedValue ? "selected" : ""}>${a.name}</option>`)
        .join("");

      return `
        <tr class="device-row"
            data-device-id="${d.id}"
            data-name="${label}"
            data-manufacturer="${d.manufacturer || ""}"
            data-domain="${domain}"
            data-sub="${sub}"
            data-entities="${entitiesText}">
          <td class="cell-checkbox">
            <input type="checkbox" class="row-checkbox" data-device="${d.id}" ${this._selected.has(d.id) ? "checked" : ""}>
          </td>
          <td class="cell-name">
            <div class="device-name">${label}</div>
            ${sub ? `<div class="device-sub">${sub}</div>` : ""}
          </td>
          <td class="cell-integration">
            ${domain ? `<span class="domain-chip">${domain}</span>` : `<span class="domain-chip muted">—</span>`}
          </td>
          ${this._renderEntityCell(d)}
          <td class="cell-area">
            <select class="area-select" data-device="${d.id}" data-current-area="${currentArea}">
              <option value="${AreaManagerPanel.UNASSIGN_SENTINEL}" ${selectedValue === AreaManagerPanel.UNASSIGN_SENTINEL ? "selected" : ""}>${this._t("unassignOption")}</option>
              ${areaOptions}
            </select>
          </td>
          <td class="cell-actions">
            <div class="actions-wrap">
            <button class="btn-assign" data-device="${d.id}" ${!isDirty ? "disabled" : ""}>${this._t("assign")}</button>
            </div>
          </td>
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
      const entitiesText = this._entitiesText(d);

      return `
        <tr class="device-row" data-device-id="${d.id}" data-entities="${entitiesText}">
          <td class="cell-name">
            <div class="device-name">${label}</div>
            ${sub ? `<div class="device-sub">${sub}</div>` : ""}
          </td>
          <td class="cell-integration">
            ${domain ? `<span class="domain-chip">${domain}</span>` : `<span class="domain-chip muted">—</span>`}
          </td>
          ${this._renderEntityCell(d)}
          <td class="cell-area">
            <span class="area-label ${!d.area_id ? "muted" : ""}">${areaLabel}</span>
          </td>
          <td class="cell-actions">
            <button class="btn-unignore" data-device="${d.id}">${this._t("unignore")}</button>
          </td>
        </tr>`;
    }).join("");
  }

  _renderBulkBar() {
    const areaOptions = this._areas
      .map((a) => `<option value="${a.area_id}">${a.name}</option>`)
      .join("");
    return `
      <div class="bulk-bar" id="bulk-bar" style="${this._selected.size === 0 ? "display:none" : ""}">
        <span class="bulk-count" id="bulk-count">${this._t("bulkSelectedCount", this._selected.size)}</span>
        <select class="area-select" id="bulk-area-select">
          <option value="">${this._t("chooseArea")}</option>
          <option value="${AreaManagerPanel.UNASSIGN_SENTINEL}">${this._t("unassignOption")}</option>
          ${areaOptions}
        </select>
        <button class="btn-assign" id="bulk-assign" disabled>${this._t("assign")}</button>
        <button class="btn-bulk-clear" id="bulk-clear">${this._t("bulkClear")}</button>
      </div>`;
  }

  _render() {
    const unassigned = this._devices.filter((d) => !d.area_id && !this._ignoredIds.has(d.id));
    const ignored = this._devices.filter((d) => this._ignoredIds.has(d.id));
    const assigned = this._devices.filter((d) => !!d.area_id);
    const pendingCount = this._pendingEntries().length;
    const hasFilter = this._filterText || this._filterManufacturer || this._filterDomain;

    const manufacturers = [
      ...new Set(unassigned.map((d) => d.manufacturer).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    const domains = [
      ...new Set(unassigned.map((d) => d.identifiers?.[0]?.[0]).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    const assignedManufacturers = [
      ...new Set(assigned.map((d) => d.manufacturer).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    const assignedDomains = [
      ...new Set(assigned.map((d) => d.identifiers?.[0]?.[0]).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    const ignoredManufacturers = [
      ...new Set(ignored.map((d) => d.manufacturer).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    const ignoredDomains = [
      ...new Set(ignored.map((d) => d.identifiers?.[0]?.[0]).filter(Boolean)),
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
        .table-scroll { width: 100%; overflow-x: auto; }
        table {
          width: 100%;
          min-width: 820px;
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
        .cell-actions { padding: 10px 12px; width: 220px; }
        .actions-wrap { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 4px; }
        .cell-confirm { width: 420px; }
        .cell-checkbox { padding: 10px 8px; text-align: center; }
        .bulk-bar {
          position: sticky;
          bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--card-background-color, #fff);
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          padding: 10px 16px;
          margin: 12px 0 0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          z-index: 2;
        }
        .bulk-bar .area-select { width: auto; min-width: 180px; }
        .bulk-count { font-size: 0.9em; font-weight: 500; margin-right: 4px; }
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
        .btn-unignore, .btn-bulk-clear { background: var(--secondary-background-color, #e8e8e8); color: var(--primary-text-color); border: 1px solid var(--divider-color, #ccc); }
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
        .dlg-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .btn-rename {
          background: none;
          border: none;
          padding: 2px 4px;
          font-size: 0.85em;
          cursor: pointer;
          line-height: 1;
          color: var(--secondary-text-color, #888);
          flex-shrink: 0;
        }
        .rename-input {
          font-size: 1.1em;
          font-weight: 500;
          padding: 2px 6px;
          border: 1px solid var(--primary-color, #03a9f4);
          border-radius: 4px;
          width: 100%;
          box-sizing: border-box;
        }
        .dlg-rename-error { color: var(--error-color, #f44336); font-size: 0.85em; margin: 0 0 12px; }
        .dlg-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 20px; }
        .dlg-actions .area-select { width: auto; min-width: 160px; }
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
          margin: 0;
        }
        .dlg-section-row { display: flex; align-items: center; justify-content: space-between; margin: 0 0 8px; }
        .dlg-loading, .dlg-empty-entities { color: var(--secondary-text-color, #888); font-size: 0.9em; margin: 0 0 16px; }
        .dlg-entity-list { list-style: none; padding: 0; margin: 0 0 20px; }
        .dlg-entity-detail {
          display: none;
          margin-top: 6px;
          padding-left: 12px;
          border-left: 2px solid var(--divider-color, #e0e0e0);
        }
        .dlg-entity-list.details-expanded .dlg-entity-detail { display: block; }
        .dlg-entity-grid { gap: 3px 12px; margin: 0; font-size: 0.82em; }
        .dlg-entity-grid dt { font-size: 0.9em; overflow-wrap: anywhere; }
        .dlg-entity-grid dd { overflow-wrap: anywhere; }
        .dlg-entity-no-state { color: var(--secondary-text-color, #888); font-size: 0.82em; margin: 6px 0 0; }
        .dlg-lastseen-note { font-size: 0.78em; color: var(--secondary-text-color, #888); font-style: italic; margin-top: 2px; }
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
        <div class="table-scroll"><table>
          <colgroup>
            <col style="width:5%">
            <col style="width:31%">
            <col style="width:9%">
            <col style="width:19%">
            <col style="width:17%">
            <col style="width:19%">
          </colgroup>
          <thead><tr>
            <th class="cell-checkbox"><input type="checkbox" id="select-all" title="${this._t("selectAll")}"></th>
            <th>${this._t("colDevice")}</th>
            <th>${this._t("colIntegration")}</th>
            <th>${this._t("colEntities")}</th>
            <th>${this._t("colArea")}</th>
            <th>${this._t("colActions")}</th>
          </tr></thead>
          <tbody>${this._renderUnassignedRows(unassigned)}</tbody>
        </table></div>
        ${this._renderBulkBar()}`;

    const ignoredContent = ignored.length === 0
      ? `<div class="empty">${this._t("ignoredEmpty")}</div>`
      : `
        <div class="filter-bar">
          <input type="search" id="filter-text" class="filter-input"
            placeholder="${this._t("searchPlaceholder")}" value="${this._filterText}">
          <select id="filter-manufacturer" class="filter-select">
            <option value="">${this._t("allManufacturers")}</option>
            ${ignoredManufacturers.map((m) => `<option value="${m}" ${this._filterManufacturer === m ? "selected" : ""}>${m}</option>`).join("")}
          </select>
          <select id="filter-domain" class="filter-select">
            <option value="">${this._t("allIntegrations")}</option>
            ${ignoredDomains.map((d) => `<option value="${d}" ${this._filterDomain === d ? "selected" : ""}>${d}</option>`).join("")}
          </select>
          <button class="btn-clear-filter" id="clear-filter" style="${hasFilter ? "" : "display:none"}">${this._t("clearFilter")}</button>
        </div>
        <div class="empty-filter" id="empty-filter">${this._t("noFilterMatch")}</div>
        <div class="table-scroll"><table>
          <colgroup>
            <col style="width:32%">
            <col style="width:10%">
            <col style="width:20%">
            <col style="width:18%">
            <col style="width:20%">
          </colgroup>
          <thead><tr>
            <th>${this._t("colDevice")}</th>
            <th>${this._t("colIntegration")}</th>
            <th>${this._t("colEntities")}</th>
            <th>${this._t("colCurrentArea")}</th>
            <th>${this._t("colActions")}</th>
          </tr></thead>
          <tbody>${this._renderIgnoredRows(ignored)}</tbody>
        </table></div>`;

    const assignedContent = assigned.length === 0
      ? `<div class="empty">${this._t("assignedEmpty")}</div>`
      : `
        <div class="filter-bar">
          <input type="search" id="filter-text" class="filter-input"
            placeholder="${this._t("searchPlaceholder")}" value="${this._filterText}">
          <select id="filter-manufacturer" class="filter-select">
            <option value="">${this._t("allManufacturers")}</option>
            ${assignedManufacturers.map((m) => `<option value="${m}" ${this._filterManufacturer === m ? "selected" : ""}>${m}</option>`).join("")}
          </select>
          <select id="filter-domain" class="filter-select">
            <option value="">${this._t("allIntegrations")}</option>
            ${assignedDomains.map((d) => `<option value="${d}" ${this._filterDomain === d ? "selected" : ""}>${d}</option>`).join("")}
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
        <div class="table-scroll"><table>
          <colgroup>
            <col style="width:5%">
            <col style="width:31%">
            <col style="width:9%">
            <col style="width:19%">
            <col style="width:17%">
            <col style="width:19%">
          </colgroup>
          <thead><tr>
            <th class="cell-checkbox"><input type="checkbox" id="select-all" title="${this._t("selectAll")}"></th>
            <th>${this._t("colDevice")}</th>
            <th>${this._t("colIntegration")}</th>
            <th>${this._t("colEntities")}</th>
            <th>${this._t("colArea")}</th>
            <th>${this._t("colActions")}</th>
          </tr></thead>
          <tbody>${this._renderAssignedRows(assigned)}</tbody>
        </table></div>
        ${this._renderBulkBar()}`;

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
            <button class="tab ${this._view === "assigned" ? "active" : ""}" data-view="assigned">
              ${this._t("tabAssigned", assigned.length)}
            </button>
          </div>
          ${this._view === "unassigned" ? unassignedContent : this._view === "assigned" ? assignedContent : ignoredContent}
        `}
    `;

    // Tab switching
    this.shadowRoot.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this._view = e.target.dataset.view;
        this._confirmDelete = null;
        this._selected.clear();
        this._pending = {};
        this._filterText = "";
        this._filterManufacturer = "";
        this._filterDomain = "";
        this._render();
      });
    });

    // Shared between "unassigned" and "assigned": per-row area dropdown + assign button
    if (this._view === "unassigned" || this._view === "assigned") {
      this.shadowRoot.querySelectorAll(".area-select[data-device]").forEach((sel) => {
        if (this._pending[sel.dataset.device] !== undefined) sel.value = this._pending[sel.dataset.device];
        sel.addEventListener("change", (e) => {
          const id = e.target.dataset.device;
          this._pending[id] = e.target.value;
          const btn = this.shadowRoot.querySelector(`.btn-assign[data-device="${id}"]`);
          if (btn) btn.disabled = e.target.value === e.target.dataset.currentArea;
          const saveAll = this.shadowRoot.getElementById("save-all");
          if (saveAll) {
            const count = this._pendingEntries().length;
            saveAll.disabled = count === 0;
            saveAll.textContent = this._t("saveAll", count);
          }
        });
      });

      this.shadowRoot.querySelectorAll(".btn-assign[data-device]").forEach((btn) =>
        btn.addEventListener("click", (e) => this._saveDevice(e.target.dataset.device))
      );

      const saveAll = this.shadowRoot.getElementById("save-all");
      if (saveAll) saveAll.addEventListener("click", () => this._saveAll());

      const reload = this.shadowRoot.getElementById("reload");
      if (reload) {
        reload.addEventListener("click", () => {
          this._loaded = false;
          this._pending = {};
          this._confirmDelete = null;
          this._selected.clear();
          this._load();
        });
      }

      this._bindBulkListeners();
    }

    // Unassigned-only view listeners (ignore/delete)
    if (this._view === "unassigned") {
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
    }

    // Shared again: entities toggle + filter bar (present on "unassigned", "assigned", and "ignored";
    // the toggle-entities lookup is a no-op where that button doesn't exist, e.g. "ignored")
    if (this._view === "unassigned" || this._view === "assigned" || this._view === "ignored") {
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

    // Row click → device detail dialog (all views)
    const tbody = this.shadowRoot.querySelector("table tbody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        if (e.target.closest("button, select, input")) return;
        const row = e.target.closest(".device-row[data-device-id]");
        if (!row) return;
        const device = this._devices.find((d) => d.id === row.dataset.deviceId);
        if (device) this._showDeviceDetail(device);
      });
    }
  }
}

customElements.define("area-manager-panel", AreaManagerPanel);
