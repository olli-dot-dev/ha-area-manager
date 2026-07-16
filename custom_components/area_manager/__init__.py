import logging
from functools import partial
from pathlib import Path

import voluptuous as vol
from aiohttp import web
from homeassistant.components import frontend, websocket_api
from homeassistant.components.panel_custom import async_register_panel
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.storage import Store
from homeassistant.loader import async_get_integration
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)
DOMAIN = "area_manager"
_PANEL_URL_PATH = "area-manager"
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


@websocket_api.websocket_command({vol.Required("type"): "area_manager/get_ignored_entities"})
@websocket_api.async_response
async def _ws_get_ignored_entities(hass: HomeAssistant, connection, msg) -> None:
    store: Store = hass.data[DOMAIN]["store"]
    data = await store.async_load() or {}
    connection.send_result(msg["id"], data.get("ignored_entities", []))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "area_manager/set_ignored_entities",
        vol.Required("entity_ids"): [str],
    }
)
@websocket_api.async_response
async def _ws_set_ignored_entities(hass: HomeAssistant, connection, msg) -> None:
    # Same Store/file as device ignores, separate key - no migration needed,
    # existing installs simply get an empty list until something is ignored.
    store: Store = hass.data[DOMAIN]["store"]
    data = await store.async_load() or {}
    data["ignored_entities"] = msg["entity_ids"]
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


@websocket_api.websocket_command({vol.Required("type"): "area_manager/get_setup_time"})
@websocket_api.async_response
async def _ws_get_setup_time(hass: HomeAssistant, connection, msg) -> None:
    connection.send_result(msg["id"], hass.data[DOMAIN].get("setup_time"))


async def _serve_panel_js(path: str, request: web.Request) -> web.FileResponse:
    # cache_headers=False on async_register_static_paths (our previous approach)
    # doesn't mean "don't cache" - for a single file it just means no explicit
    # Cache-Control header at all, leaving browsers to fall back on unpredictable
    # heuristic caching. "no-cache" forces revalidation on every request; aiohttp's
    # FileResponse still sets Last-Modified/ETag so an unchanged file gets an
    # efficient 304 rather than a full re-download.
    return web.FileResponse(path, headers={"Cache-Control": "no-cache"})


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["store"] = Store(hass, _STORAGE_VERSION, _STORAGE_KEY)
    # Proxy for "last HA restart": this integration is set up fresh on every
    # restart (a config-entry reload alone does not re-run this), so recording
    # our own setup time is a portable stand-in for HA's boot time without
    # depending on Supervisor-only APIs that wouldn't work for non-HAOS users.
    hass.data[DOMAIN]["setup_time"] = dt_util.utcnow().isoformat()

    panel_js = Path(__file__).parent / "area-manager-panel.js"
    # A plain route (not async_register_static_paths) so we control the
    # Cache-Control header ourselves - see _serve_panel_js. aiohttp raises if
    # the same route is added twice, which a config-entry reload would trigger
    # without a full restart, so guard with our own flag (hass.data survives
    # unload/reload within the same running process).
    if not hass.data[DOMAIN].get("js_route_registered"):
        hass.http.app.router.add_route(
            "GET", _PANEL_JS_URL, partial(_serve_panel_js, str(panel_js))
        )
        hass.data[DOMAIN]["js_route_registered"] = True

    # A reload (or remove + re-add without restarting HA) re-runs this without HA
    # having forgotten the previously registered panel, so registering again would
    # raise "Overwriting panel area-manager". Drop it first to keep setup idempotent.
    if _PANEL_URL_PATH in hass.data.get(frontend.DATA_PANELS, {}):
        frontend.async_remove_panel(hass, _PANEL_URL_PATH)

    # Extra defense-in-depth on top of the Cache-Control header above: append
    # the integration version as a query string, so a release is also a new
    # URL entirely, not just a header-driven revalidation.
    integration = await async_get_integration(hass, DOMAIN)
    js_url = f"{_PANEL_JS_URL}?v={integration.version}"

    await async_register_panel(
        hass,
        webcomponent_name="area-manager-panel",
        frontend_url_path=_PANEL_URL_PATH,
        sidebar_title="Area Manager",
        sidebar_icon="mdi:map-marker-multiple",
        js_url=js_url,
        require_admin=True,
    )

    websocket_api.async_register_command(hass, _ws_get_ignored)
    websocket_api.async_register_command(hass, _ws_set_ignored)
    websocket_api.async_register_command(hass, _ws_get_ignored_entities)
    websocket_api.async_register_command(hass, _ws_set_ignored_entities)
    websocket_api.async_register_command(hass, _ws_remove_device)
    websocket_api.async_register_command(hass, _ws_get_setup_time)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend.async_remove_panel(hass, _PANEL_URL_PATH)
    return True
