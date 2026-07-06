# Changelog

All notable changes to Area Manager are documented here.
Alle wesentlichen Änderungen an Area Manager werden hier dokumentiert.

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
