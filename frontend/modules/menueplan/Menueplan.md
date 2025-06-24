# Menüplan Modul

Dieses Modul ist das zentrale Werkzeug zur Planung der wöchentlichen Mahlzeiten für alle zugeordneten Einrichtungen. Es ermöglicht eine flexible und visuelle Erstellung von Menüplänen unter Berücksichtigung der spezifischen Anforderungen jeder Einrichtung.

**WICHTIG:** Die übergeordnete Geschäftslogik für dieses Modul ist in der Datei [`../../GESCHÄFTSLOGIK.md`](../../GESCHÄFTSLOGIK.md) definiert. Die folgenden Punkte sind eine modul-spezifische Zusammenfassung.

## Wichtige Geschäftsregeln

1.  **Historische Genauigkeit (Snapshot-Prinzip):**
    *   Ein gespeicherter Menüplan (`kW.json`) ist ein **in sich geschlossenes Dokument**.
    *   Beim Speichern wird eine **Kopie** der zu diesem Zeitpunkt gültigen "Anrechte" (welche Einrichtung bekommt welche Mahlzeit) direkt in die Plandatei geschrieben.
    *   **Grund:** Dies garantiert, dass zukünftige Module (Bestellung, Kalkulation) und auch der Ausdruck alter Pläne immer auf korrekten, unveränderlichen historischen Daten basieren.

2.  **Sonderbehandlung für 'interne' Einrichtungen:**
    *   Einrichtungen mit dem Flag `"isIntern": true` (z.B. die eigenen Bewohner) erhalten **alle** Mahlzeitenkategorien aus dem Plan.
    *   Dies schließt Standardmahlzeiten (Suppe, Menü 1, etc.) sowie alle zusätzlichen Kategorien für das Abendessen mit ein.
    *   Die Logik muss dies beim Erstellen, Anzeigen und Auswerten von Plänen berücksichtigen.

## Kernfunktionen

1.  **Wochenbasierte Navigation & Plan-Verwaltung:**
    *   Der Plan wird immer für eine ganze Kalenderwoche (Montag bis Sonntag) dargestellt.
    *   **Navigation:** "Vor"- und "Zurück"-Buttons sowie "Heute"-Button für Wochenwechsel.
    *   **Plan leeren:** "Leeren"-Button löscht alle Rezepte und Zuweisungen der aktuellen Woche (mit Bestätigung).
    *   **Vorlage laden:** "Vorlage"-Button lädt den Plan von vor 7 Wochen als Basis (mit Bestätigung).

2.  **Modernes CSS-Grid-Layout:**
    *   **8-spaltiges Grid:** 1 Spalte für Kategorien + 7 Spalten für Wochentage.
    *   **Sticky Header:** Kategorie-Spalte und Wochentag-Header bleiben beim Scrollen sichtbar.
    *   **Responsive Design:** Mobile-optimiert mit horizontalem Scrolling.
    *   **Drop-Zonen:** Visuelles Feedback mit grün (gültig) und rot (ungültig) Markierungen.

3.  **Intelligente Rezept-Suche:**
    *   **Kompakte Pills:** Horizontale Darstellung der Suchvorschläge als Bootstrap-Badges.
    *   **Click-away:** Automatisches Schließen bei Klicks außerhalb der Suche.
    *   **Live-Suche:** Sofortige Filterung mit maximal 2 Vorschlägen für optimale UX.
    *   **Drag & Drop:** Direkt aus Suchvorschlägen ins Grid ziehen.

4.  **Vielfältige Drag-and-Drop-Funktionen:**
    *   **Rezept-Drag:** Einzelne Rezepte zwischen Zellen verschieben.
    *   **Zellen-Drag:** Ganze Zellen (alle Rezepte einer Kategorie an einem Tag) tauschen.
    *   **Such-Drag:** Neue Rezepte aus Suche direkt ins Grid ziehen.
    *   **Touch-Support:** Native Touch-Events für optimierte Mobile-UX (siehe Mobile Design).

5.  **Mobile-First Design (Smartphone-optimiert):**
    *   **Accordion-Layout:** Wochentage als expandierbare Karten statt Grid.
    *   **Sticky Controls:** Navigation und Suche bleiben immer sichtbar (`position: sticky`).
    *   **Touch-Drag & Drop:** Native Touch-Events mit visuellem Feedback.
    *   **Auto-Expand:** Heutiger Tag öffnet sich automatisch beim Laden.
    *   **Kategorie-Icons:** Emoji-Icons für bessere Orientierung (🍲 Suppe, 🍽️ Menü 1).

6.  **Einrichtungs-Zuweisungen:**
    *   **Exklusive Zuweisungen:** Jede Einrichtung kann pro Tag nur Menü 1 ODER Menü 2 erhalten.
    *   **Button-Toggle:** Klick aktiviert/deaktiviert Zuweisungen (blau = aktiv).
    *   **Automatische Konfliktlösung:** Wechsel von Menü 1 → Menü 2 entfernt alte Zuweisung.
    *   **Interne Einrichtungen:** Bekommen automatisch ALLE Kategorien.

7.  **Auto-Save mit visueller Rückmeldung:**
    *   **Debounced Saving:** 1,5 Sekunden Verzögerung nach letzter Änderung.
    *   **Visueller Indikator:** Icons und Texte für Status (Speichert.../Gespeichert/Fehler).
    *   **Toast-Benachrichtigungen:** Erfolgs- und Fehlermeldungen.
    *   **Snapshot-Integration:** Automatische Einrichtungs-Snapshots bei jedem Speichern.

8.  **Geschäftslogik-konforme Datenintegrität:**
    *   **Historische Snapshots:** Jeder Plan enthält eingefrorene Einrichtungs-Stammdaten.
    *   **Unveränderliche Historie:** Alte Pläne zeigen immer die korrekten historischen Daten.
    *   **Interne Einrichtungen:** Sonderbehandlung für `isIntern: true` Einrichtungen.

## Architektur & Code-Struktur

Das Modul folgt dem standardisierten **Blueprint-Pattern** mit klarer Trennung von Verantwortlichkeiten für maximale Wartbarkeit und Skalierbarkeit.

### **🎭 1. `menueplan-ui.js` (Der Orchestrator)**
```javascript
// Koordiniert alle Sub-Module und Datenflüsse
await initMenueplanUI(user) {
    loadStammdaten() → initSubModules() → loadInitialPlan() → bindAutoSave()
}
```
**Verantwortlichkeiten:** Initialization, Callback-Management, Error-Boundaries

### **🧠 2. `menueplan-state.js` (State-Management)**
```javascript
// Zentraler State mit Auto-Save-Integration
const state = { currentPlan, stammdaten, onStateChange: autoSaveCallback };
```
**Verantwortlichkeiten:** Daten-Integrity, Auto-Save (1,5s debounced), Geschäftslogik-Integration

### **🎮 3. `menueplan-controls.js` (Navigation & Aktionen)**
```javascript
// Wochennavigation und Plan-Verwaltung
initControls(loadAndRenderPlan) → bindNavigationEvents() → planActions()
```
**Verantwortlichkeiten:** Wochennavigation, Plan leeren/Vorlage laden, Confirmation-Modals

### **🏗️ 4. `menueplan-grid.js` (Layout & Rendering)**
```javascript
// CSS-Grid-basiertes Layout mit Einrichtungs-Buttons
renderGrid() → drawCategories() → drawDays() → renderEinrichtungsButtons()
```
**Verantwortlichkeiten:** 8-spaltiges CSS-Grid, Responsive Design, Button-States

### **🎯 5. `menueplan-dragdrop.js` (Interaktionen)**
```javascript
// Multi-Type Drag & Drop mit Touch-Support
handleRezeptDrag() + handleCellDrag() + validateDropZones()
```
**Verantwortlichkeiten:** Rezept-Drag, Zellen-Tausch, Drag-Validierung, Mobile-Support

### **🌐 6. `menueplan-api.js` (Backend-Integration)**
```javascript
// HTTP-API mit Snapshot-Integration
getMenueplan(year, week) + saveMenueplan(year, week, planWithSnapshot)
```
**Verantwortlichkeiten:** REST-API-Calls, Error-Handling, Snapshot-Serialisierung

### **📁 7. `path/paths.js` (Blueprint-Abstraktionsschicht)**
```javascript
// Zentrale Path-Definitions
export const paths = { stammdaten, api: { base, getWeek, saveWeek } };
```
**Verantwortlichkeiten:** Path-Abstraktion, API-URL-Management

---

**🔗 Datenfluss:** `User-Action` → `State-Update` → `onStateChange()` → `Auto-Save + UI-Rerender` 