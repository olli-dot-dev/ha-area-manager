from homeassistant import config_entries
from homeassistant.core import callback

DOMAIN = "area_manager"


class AreaManagerConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="already_configured")
        if user_input is not None:
            return self.async_create_entry(title="Area Manager", data={})
        return self.async_show_form(step_id="user")
