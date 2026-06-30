import logging
from pathlib import Path

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.panel_custom import async_register_panel
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.storage import Store

_LOGGER = logging.getLogger(__name__)
DOMAIN = "area_manager"
_PANEL_JS_URL = "/area-manager-panel.js"
_STORAGE_KEY = f"{DOMAIN}_ignored"
_STORAGE_VERSION = 1


@websocket_api.websocket_command({vol.Required("type"): "area_manager/get_ignored"})
@websocket_api.async_response
async def _ws_get_ignored(hass: HomeAssistant, connection, msg) -> None:
    store: Store = hass.data[DOMAIN]["store"]
    data = await store.async_load() or {}
    connection.send_result(msg["id"], data.get("ignored", []))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "area_manager/set_ignored",
        vol.Required("device_ids"): [str],
    }
)
@websocket_api.async_response
async def _ws_set_ignored(hass: HomeAssistant, connection, msg) -> None:
    store: Store = hass.data[DOMAIN]["store"]
    data = await store.async_load() or {}
    data["ignored"] = msg["device_ids"]
    await store.async_save(data)
    connection.send_result(msg["id"], "ok")


@websocket_api.websocket_command(
    {
        vol.Required("type"): "area_manager/remove_device",
        vol.Required("device_id"): str,
    }
)
@websocket_api.async_response
async def _ws_remove_device(hass: HomeAssistant, connection, msg) -> None:
    registry = dr.async_get(hass)
    if registry.async_get(msg["device_id"]) is None:
        connection.send_error(msg["id"], "not_found", "Device not found")
        return
    registry.async_remove_device(msg["device_id"])
    connection.send_result(msg["id"], "ok")


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["store"] = Store(hass, _STORAGE_VERSION, _STORAGE_KEY)

    panel_js = Path(__file__).parent / "area-manager-panel.js"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(_PANEL_JS_URL, str(panel_js), cache_headers=False)]
    )

    await async_register_panel(
        hass,
        webcomponent_name="area-manager-panel",
        frontend_url_path="area-manager",
        sidebar_title="Area Manager",
        sidebar_icon="mdi:map-marker-multiple",
        js_url=_PANEL_JS_URL,
        require_admin=True,
    )

    websocket_api.async_register_command(hass, _ws_get_ignored)
    websocket_api.async_register_command(hass, _ws_set_ignored)
    websocket_api.async_register_command(hass, _ws_remove_device)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return True
