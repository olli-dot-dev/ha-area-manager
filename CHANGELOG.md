# Changelog

All notable changes to Area Manager are documented here.
Alle wesentlichen Änderungen an Area Manager werden hier dokumentiert.

## [2.5.0] - 2026-08-02

**English**
- Added an area suggestion badge on the "Without area" tab (requested by **@iverlaek** on the launch video): if a device's or entity's name contains an existing area's name (e.g. "Living Room Hub" → "Living Room"), a clickable "→ Living Room?" badge appears next to its dropdown. Clicking it pre-fills the dropdown — it never assigns on its own, so a wrong guess is just one click away from being ignored
- Added a **"+ New area…"** option to every area dropdown (row selects, the bulk-assignment bar, and both detail popups) to create a new area on the spot, optionally assigning it to a floor, instead of leaving Area Manager to create one in HA's own settings first. Requested by **Onkel Joerg** ([#2](https://github.com/olli-dot-dev/ha-area-manager/issues/2)). Fixed a bug found during testing where the freshly created area didn't appear in the dropdown until the page was refreshed — every visible dropdown is now updated immediately instead of relying on a full re-render

**Deutsch**
- Vorschlags-Badge im "Ohne Bereich"-Tab hinzugefügt (Vorschlag von **@iverlaek** im Launch-Video): Enthält der Name eines Geräts oder einer Entität den Namen eines bestehenden Bereichs (z. B. "Wohnzimmer Hub" → "Wohnzimmer"), erscheint neben dem Dropdown ein klickbares "→ Wohnzimmer?"-Badge. Ein Klick befüllt nur das Dropdown vor — es weist nie von selbst zu, ein falscher Vorschlag ist also nur einen Klick von "ignorieren" entfernt
- Option **"+ Neuer Bereich…"** zu jedem Bereichs-Dropdown hinzugefügt (Zeilen, Bulk-Zuweisungsleiste, beide Detail-Popups), um direkt einen neuen Bereich anzulegen, optional mit Etagen-Zuordnung, statt dafür erst in HAs eigene Einstellungen wechseln zu müssen. Vorschlag von **Onkel Joerg** ([#2](https://github.com/olli-dot-dev/ha-area-manager/issues/2)). Einen beim Testen gefundenen Fehler behoben, bei dem der frisch erstellte Bereich erst nach einem Seiten-Refresh im Dropdown auftauchte — jedes sichtbare Dropdown wird jetzt sofort aktualisiert, statt sich auf einen vollständigen Neuaufbau zu verlassen

## [2.4.0] - 2026-07-16

**English**
- Added support for entities without a device — automations, scripts, scenes, and helpers (`input_boolean`, `counter`, `timer`, …) can now be assigned an area directly, the same way Home Assistant's own entity settings dialog allows for any entity with no device behind it. A new **Devices / Entities** toggle at the top switches the whole panel (all three tabs, filtering, bulk-selection) between the two — previously Area Manager only covered devices, leaving this whole category invisible. Entities support area assignment and ignore/restore; rename and delete remain device-only, since a device-less entity's configuration lives elsewhere and doesn't map to a meaningful "delete" here
- Added column sorting — click "Name", "Integration", or "Area" to sort ascending, click again to reverse. Not offered for "Area" on the "Without area" tab, since every row there has no area by definition

**Deutsch**
- Unterstützung für Entitäten ohne Gerät hinzugefügt — Automationen, Skripte, Szenen und Helper (`input_boolean`, `counter`, `timer`, …) lassen sich jetzt direkt einem Bereich zuweisen, genau wie es Home Assistants eigener Entitäts-Einstellungsdialog für jede Entität ohne Gerät dahinter erlaubt. Ein neuer **Geräte / Entitäten**-Umschalter oben wechselt das gesamte Panel (alle drei Tabs, Filter, Mehrfachauswahl) zwischen beiden — bisher deckte Area Manager nur Geräte ab, diese ganze Kategorie war unsichtbar. Entitäten unterstützen Bereichszuweisung und Ignorieren/Wiederherstellen; Umbenennen und Löschen bleiben geräte-exklusiv, da die Konfiguration einer geräte-losen Entität anderswo liegt und ein "Löschen" hier nichts sinnvolles bedeuten würde
- Spalten-Sortierung hinzugefügt — Klick auf "Name", "Integration" oder "Bereich" sortiert aufsteigend, erneuter Klick kehrt um. Im "Ohne Bereich"-Tab nicht für "Bereich" verfügbar, da dort per Definition jede Zeile keinen Bereich hat

## [2.3.1] - 2026-07-08

**English**
- Fixed the panel JS sometimes still showing a stale, cached version after updating even with a full restart. The previous fix (a version query string) helped but wasn't sufficient by itself — the file is now served with an explicit `Cache-Control: no-cache` header, forcing the browser to always revalidate with the server instead of falling back on unpredictable heuristic caching

**Deutsch**
- Fehler behoben: Die Panel-JS-Datei zeigte nach einem Update manchmal weiterhin eine veraltete, gecachte Version, selbst nach einem vollständigen Neustart. Der bisherige Fix (Versions-Query-String) half, reichte aber allein nicht aus — die Datei wird jetzt mit explizitem `Cache-Control: no-cache`-Header ausgeliefert, wodurch der Browser immer beim Server nachfragen muss, statt sich auf unvorhersehbares heuristisches Caching zu verlassen

## [2.3.0] - 2026-07-08

**English**
- Fixed being unable to navigate back to the Home Assistant dashboard from Area Manager on narrow/mobile screens (including the Companion App) — the panel now has its own menu button, matching every other Home Assistant panel, since custom panels must render this themselves
- The header now uses Home Assistant's own title font size/weight, sits closer to the top, and stays fixed at the top of the screen while scrolling — matching native panels more closely
- Removed the redundant "n without area" badge next to the title — the same count already shows in the "Without area" tab label right below
- Fixed the bulk-assignment bar overflowing off-screen on narrow devices instead of wrapping onto multiple lines
- The bulk-assignment bar's selection count is now a compact number badge instead of "n selected" text (the full text is still available as a tooltip)
- Added a bulk **Ignore** action to the bulk-assignment bar (in the "Without area" tab), so multiple devices can be ignored at once, not just assigned

**Deutsch**
- Fehler behoben: Auf schmalen/mobilen Bildschirmen (inkl. Companion App) gab es aus dem Area Manager heraus keinen Weg zurück zum Home-Assistant-Dashboard — das Panel hat jetzt einen eigenen Menü-Button, wie jedes andere Home-Assistant-Panel auch, da Custom Panels diesen selbst bereitstellen müssen
- Die Kopfzeile nutzt jetzt Home Assistants eigene Titel-Schriftgröße/-stärke, sitzt näher am oberen Rand und bleibt beim Scrollen oben fixiert — näher an nativen Panels
- Das überflüssige "n ohne Bereich"-Badge neben dem Titel entfernt — dieselbe Zahl steht ja schon im "Ohne Bereich"-Tab direkt darunter
- Fehler behoben: Die Bulk-Zuweisungsleiste lief auf schmalen Geräten über den Bildschirmrand hinaus, statt umzubrechen
- Der Auswahlzähler in der Bulk-Zuweisungsleiste ist jetzt ein kompaktes Zahlen-Badge statt "n ausgewählt"-Text (voller Text weiterhin als Tooltip verfügbar)
- Bulk-Aktion **Ignorieren** zur Bulk-Zuweisungsleiste hinzugefügt (im "Ohne Bereich"-Tab), damit sich mehrere Geräte auf einmal ignorieren lassen, nicht nur zuweisen

## [2.2.0] - 2026-07-07

**English**
- Fixed the Companion App's WebView sometimes keeping a stale, cached copy of the panel after an update, hiding new features until the app was force-quit. The panel JS URL now includes the integration version as a cache-busting query parameter, so every release is fetched fresh
- The device detail popup now shows "Added on" and a device-level "Last seen" (the most recent activity across all of the device's entities) so a long-dead device is obvious at a glance
- Added a "Show details" toggle per device that reveals, for every entity, its current state, last-seen timestamp, and all attributes in a compact, aligned table
- "Last seen" values that are suspiciously close to the last Home Assistant restart are now flagged with a note and the restart time, since a restart alone can refresh that timestamp without the device having actually reported anything

**Deutsch**
- Fehler behoben: Der WebView der Companion App hat nach einem Update teils eine veraltete, gecachte Version des Panels behalten, wodurch neue Funktionen erst nach Beenden der App sichtbar wurden. Die Panel-JS-URL enthält jetzt die Versionsnummer als Cache-Buster, sodass jede Version garantiert frisch geladen wird
- Das Geräte-Detail-Popup zeigt jetzt "Hinzugefügt am" sowie ein geräteweites "Zuletzt gesehen" (die jüngste Aktivität über alle Entitäten des Geräts hinweg), damit ein längst totes Gerät sofort auffällt
- Neuer "Details anzeigen"-Umschalter pro Gerät, der für jede Entität Status, Zuletzt-gesehen-Zeitpunkt und alle Attribute als kompakte, ausgerichtete Tabelle einblendet
- "Zuletzt gesehen"-Werte, die verdächtig nah am letzten Home-Assistant-Neustart liegen, werden jetzt mit einem Hinweis inkl. Neustart-Zeitpunkt gekennzeichnet, da ein Neustart allein diesen Zeitstempel auffrischen kann, ohne dass sich das Gerät wirklich gemeldet hat

## [2.1.0] - 2026-07-06

**English**
- Added the same filter bar (search, manufacturer, integration) to the "Ignored" tab that already existed on "Without area" and "Assigned"
- The device detail popup can now rename a device (pencil icon next to the title), assign/reassign its area (including unassigning back to "Without area"), ignore/show it again, and delete it — all without closing the popup first
- Fixed reloading the integration (or removing and re-adding it without restarting Home Assistant) failing with `Overwriting panel area-manager`, since the sidebar panel was never unregistered on unload (#3)

**Deutsch**
- Die gleiche Filterleiste (Text, Hersteller, Integration) wie bei "Ohne Bereich"/"Zugewiesen" gibt es jetzt auch im "Ignoriert"-Tab
- Im Geräte-Detail-Popup kann man ein Gerät jetzt umbenennen (Stift-Icon neben dem Titel), den Bereich zuweisen/ändern (inkl. Zurücksetzen auf "Ohne Bereich"), es ignorieren/wieder anzeigen und löschen — alles ohne das Popup vorher schließen zu müssen
- Fehler behoben: Neuladen der Integration (bzw. Entfernen und ohne HA-Neustart erneut Hinzufügen) schlug mit `Overwriting panel area-manager` fehl, da das Sidebar-Panel beim Entladen nie wieder abgemeldet wurde (#3)

## [2.0.0] - 2026-07-05

**English**
- Added checkbox-based multi-select with a bulk area-assignment bar, on top of the existing per-row dropdown (both remain available side by side)
- Added a new "Assigned" tab listing devices that already have an area, so the assignment can be reviewed and corrected — including a "— No area —" option to unassign a device back to "Without area"
- Selection is preserved while filtering; only visible/filtered rows are affected by "select all"
- Fixed the actions column overflowing and clipping the Delete button (follow-up to the 1.0.1 table fix)
- Fixed the device name column taking up almost the entire table width, and action buttons visually breaking when entities were expanded
- Added a one-click "Add to HACS" install button to the README
- Added integration icon/logo assets so Home Assistant can display proper branding

**Deutsch**
- Mehrfachauswahl per Checkbox mit Bulk-Zuweisungsleiste ergänzt, zusätzlich zum bestehenden Dropdown je Zeile (beide bleiben nebeneinander nutzbar)
- Neuer Tab "Zugewiesen" mit bereits zugeordneten Geräten, deren Bereich eingesehen und korrigiert werden kann — inkl. Option "— Kein Bereich —", um ein Gerät zurück nach "Ohne Bereich" zu verschieben
- Auswahl bleibt beim Filtern erhalten; "Alle auswählen" wirkt nur auf sichtbare/gefilterte Zeilen
- Fehler behoben: Aktions-Spalte lief über und schnitt den Löschen-Button ab (Folgefehler des 1.0.1-Tabellenfixes)
- Fehler behoben: Geräte-Spalte nahm fast die gesamte Tabellenbreite ein, Aktions-Buttons waren bei ausgeklappten Entitäten optisch verschoben
- Ein-Klick-Installationslink (My Home Assistant) zur README hinzugefügt
- Icon-/Logo-Assets ergänzt, damit Home Assistant die Integration korrekt brandet

## [1.0.1] - 2026-07-02

**English**
- Fixed the devices table growing unbounded in width when the entity list was expanded
- Fixed action buttons (Ignore/Unignore) losing contrast against the row background on hover
- Fixed the device detail popup staying open (with the backdrop gone) after pressing Escape

**Deutsch**
- Fehler behoben: Tabelle wurde beim Ausklappen der Entitätenliste unkontrolliert breit
- Fehler behoben: Aktions-Buttons (Ignorieren/Wieder anzeigen) hatten beim Hover keinen Kontrast mehr zur Zeile
- Fehler behoben: Geräte-Detail-Popup blieb nach Drücken von Escape offen (nur der Hintergrund verschwand)

## [1.0.0] - 2026-06-30

**English**
- Initial release: sidebar panel listing devices without an assigned area, with quick per-device area assignment
- Filter bar (text search by device/manufacturer/model, plus manufacturer and integration filters)
- Device detail popup showing manufacturer, model, integration, area, and entities
- Ignore list for devices intentionally left without an area, with a dedicated tab and restore option
- Delete orphaned devices directly from the list, with inline confirmation
- Entities column with an expandable list per device
- German/English UI, following the Home Assistant language setting

**Deutsch**
- Erstveröffentlichung: Sidebar-Panel mit allen Geräten ohne Bereichszuweisung, inkl. schneller Einzelzuweisung
- Filterleiste (Textsuche nach Gerät/Hersteller/Modell, Filter nach Hersteller und Integration)
- Geräte-Detail-Popup mit Hersteller, Modell, Integration, Bereich und Entitäten
- Ignorieren-Liste für Geräte, die bewusst ohne Bereich bleiben sollen, mit eigenem Tab und Wiederherstellen-Option
- Verwaiste Geräte direkt aus der Liste löschbar, mit Inline-Bestätigung
- Entitäten-Spalte mit pro Gerät ausklappbarer Liste
- Deutsche/englische Oberfläche, folgt der Home-Assistant-Spracheinstellung
