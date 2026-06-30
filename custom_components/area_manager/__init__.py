import logging
from pathlib import Path

from homeassistant.components.panel_custom import async_register_panel
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)
DOMAIN = "area_manager"
_PANEL_JS_URL = "/area-manager-panel.js"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    panel_js = Path(__file__).parent / "area-manager-panel.js"
    hass.http.register_static_path(_PANEL_JS_URL, str(panel_js), cache_headers=False)

    await async_register_panel(
        hass,
        webcomponent_name="area-manager-panel",
        frontend_url_path="area-manager",
        sidebar_title="Area Manager",
        sidebar_icon="mdi:map-marker-multiple",
        js_url=_PANEL_JS_URL,
        require_admin=True,
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return True
