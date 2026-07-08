# Changelog

All notable changes to Area Manager are documented here.
Alle wesentlichen Änderungen an Area Manager werden hier dokumentiert.

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
