# 📘 Abwesenheiten-Modul - Dokumentation

## 🎯 Überblick

Das Abwesenheiten-Modul ermöglicht die zentrale **Erfassung und Verwaltung von Abwesenheiten** einzelner Einrichtungen (z.B. Kitas) pro Kalenderwoche (KW). Es dient der korrekten **Verteilung, Auswertung und späteren Abrechnung**.

## 🗂️ Datenquellen

### 1. Einrichtungen
- **Quelle:** `shared/data/einrichtungen/einrichtungen.json`
- **Beschreibung:** Stammdaten aller verfügbaren Einrichtungen

### 2. Ferienstatus
- **Quelle:** `shared/data/abwesenheit/ferien-status.json`
- **Beschreibung:** Status je Einrichtung je Kalenderwoche
- **Struktur:**
```json
[
  {
    "kw": 31,
    "einrichtung": "ER", 
    "status": "geschlossen",
    "grund": "Sommerferien"
  }
]
```

### 3. Kinderverteilung
- **Quelle:** `shared/data/abwesenheit/ferien-routing.json`
- **Beschreibung:** Zuweisung, welche Einrichtung Kinder anderer Einrichtungen übernimmt
- **Struktur:**
```json
[
  {
    "kw": 31,
    "von": "ER",
    "nach": "Lim"
  }
]
```

## 🖥️ Funktionen

### 1. Kalenderwochen-Auswahl
- **Zweck:** Filterung aller Daten nach ausgewählter KW
- **Bereich:** KW 31-39 (erweiterbar)
- **Implementierung:** Dropdown-Menü mit automatischer Datenaktualisierung

### 2. Einrichtungen-Übersicht
- **Darstellung:** Responsive Karten-Layout
- **Status-Anzeige:**
  - 🟩 **Geöffnet:** Normale Betriebszeiten
  - 🟥 **Geschlossen:** Ferien/Fenstertage
  - 🟨 **Sonderbetrieb:** Eingeschränkte Öffnungszeiten
- **Interaktion:** Klick öffnet Status-Änderungs-Modal

### 3. Status-Verwaltung
- **Modal-basierte Bearbeitung**
- **Felder:**
  - Status (Pflichtfeld)
  - Grund (optional, z.B. "Sommerferien", "Brückentag")
- **Speicherung:** Automatisch mit visueller Rückmeldung

### 4. Drag & Drop Kinderverteilung
- **Bedienung:** Geschlossene Einrichtung auf geöffnete ziehen
- **Validierung:** Nur gültige Kombinationen möglich
- **Touch-Unterstützung:** Vollständig mobile-optimiert
- **Visuelle Rückmeldung:** Drop-Targets werden hervorgehoben

## 🧮 Geschäftslogik

### Regel 1: Status ist Pflicht
Jede Einrichtung muss pro KW einen Status haben (Standard: "geöffnet")

### Regel 2: Gültige Routing-Verbindungen
- **Von:** Einrichtung mit Status "geschlossen"
- **Nach:** Einrichtung mit Status "geöffnet" oder "sonderbetrieb"
- **Validierung:** Automatische Prüfung vor Speicherung

### Regel 3: Mehrfache Verbindungen erlaubt
Eine geöffnete Einrichtung kann Kinder von mehreren geschlossenen Einrichtungen übernehmen

### Regel 4: Abrechnungsrelevanz
Alle Kinderzahlen geschlossener Einrichtungen zählen bei der Ziel-Einrichtung mit

## 🎨 Technische Implementierung

### Architektur
- **Modular:** Getrennte Module für API, UI und Drag & Drop
- **Error-Boundary:** Sicheres Initialisierungssystem
- **Bootstrap-First:** Primär Bootstrap-Komponenten

### 📅 Jahreskalender Grid-Layout (Kritische Implementierung)

#### Problem-Lösung: Container-zu-Grid Transformation
**WICHTIG:** Das 4x3 Grid für die 12 Monatskalender wird durch **direkte Container-Transformation** erreicht:

```javascript
// Container selbst zum CSS-Grid umwandeln
container.style.display = 'grid';
container.style.gridTemplateColumns = 'repeat(4, 1fr)';
container.style.gridTemplateRows = 'repeat(3, 1fr)';
container.style.gap = '10px';
```

#### Warum diese Lösung?
1. **Ursprüngliches Problem:** Zusätzliche Wrapper (`.einrichtung-jahreskalender`, `.jahreskalender-monate`) verhinderten das Grid-Layout
2. **HTML-Struktur:** Der `#jahreskalender-container` liegt innerhalb `.card-body` und soll die gesamte Breite nutzen
3. **CSS-Grid vs. Flexbox:** CSS-Grid funktionierte nicht durch Wrapper-Interferenz

#### Implementierungsdetails:
```javascript
// FALSCH: Wrapper-Struktur (funktioniert NICHT)
<div id="jahreskalender-container">
  <div class="einrichtung-jahreskalender">
    <div class="jahreskalender-monate">
      <!-- 12 Monate hier -->
    </div>
  </div>
</div>

// RICHTIG: Direkte Grid-Items (funktioniert!)
<div id="jahreskalender-container" style="display: grid; grid-template-columns: repeat(4, 1fr);">
  <div class="monatskalender">Januar</div>
  <div class="monatskalender">Februar</div>
  <!-- ... 10 weitere Monate -->
</div>
```

#### Responsive Breakpoints:
- **Desktop (1681px+):** 4x3 Grid (Ultra-Wide optimiert)
- **Desktop (1201px-1680px):** 4x3 Grid (Standard)
- **Tablet (901px-1200px):** 3x4 Grid
- **Tablet Klein (601px-900px):** 2x6 Grid
- **Mobile (≤600px):** 1x12 Grid (vertikal scrollbar)

#### Troubleshooting Grid-Layout:
```javascript
// Debug-Befehle für Browser-Konsole:
const container = document.getElementById('jahreskalender-container');
console.log('Grid Display:', window.getComputedStyle(container).display);
console.log('Grid Columns:', window.getComputedStyle(container).gridTemplateColumns);
console.log('Monatskalender gefunden:', container.querySelectorAll('.monatskalender').length);

// Manuelles Force-Grid setzen falls nötig:
container.style.display = 'grid';
container.style.gridTemplateColumns = 'repeat(4, 1fr)';
container.style.gridTemplateRows = 'repeat(3, 1fr)';
```

#### Maximale Breitennutzung:
- **Container-Padding:** Auf Minimum reduziert (`0.5rem` statt `1.5rem`)
- **Grid-Gap:** Optimiert für maximale Kalender-Größe (`8px`)
- **Card-Margins:** Entfernt für volle Breite
- **Responsive Anpassung:** Ultra-Wide Screens erhalten noch weniger Padding

### Module-Struktur
```
frontend/modules/abwesenheit/
├── css/style.css                    # Modul-spezifische Styles
├── js/
│   ├── script.js                    # Haupt-Initialisierung
│   └── module/
│       ├── abwesenheit-api.js       # Datenverarbeitung
│       ├── abwesenheit-ui.js        # Benutzeroberfläche
│       └── abwesenheit-dragdrop.js  # Drag & Drop-Logik
├── path/paths.js                    # Pfad-Abstraktionsebene
└── index.html                       # UI-Struktur
```

### State Management
- **Lokaler State:** Jedes Modul verwaltet eigenen Zustand
- **Caching:** Einrichtungsdaten werden zwischengespeichert
- **Reaktivität:** UI aktualisiert sich automatisch bei Datenänderungen

## 📱 Mobile Optimierung

### Touch-Unterstützung
- **Drag & Drop:** Funktioniert mit Touch-Gesten
- **Responsive Layout:** Mobile-First-Ansatz
- **Große Touch-Targets:** Mindestens 44px Höhe

### UI-Anpassungen
- **Accordion-Verhalten:** Karten stapeln vertikal
- **Kompakte Anzeige:** Reduzierte Informationsdichte
- **Bottom-Sheet-Modals:** Native mobile UX

## 🔄 Datenfluss

### 1. Initialisierung
```
Modul-Start → API-Init → Daten laden → UI rendern → Event-Listener
```

### 2. Status-Änderung
```
Karten-Klick → Modal öffnen → Eingabe → Validierung → Speichern → UI-Update
```

### 3. Kinderverteilung
```
Drag-Start → Drop-Target prüfen → Validierung → Speichern → Routing-Update
```

## 🧪 Validierung & Fehlerbehandlung

### Automatische Validierung
- **Routing-Regeln:** Nur gültige Status-Kombinationen
- **Duplikat-Prüfung:** Verhindert mehrfache Verbindungen
- **Datenintegrität:** Konsistenz-Checks vor Speicherung

### Error-Boundary
- **Modul-Isolation:** Fehler beeinträchtigen nicht andere Module
- **Graceful Degradation:** Fallback-Verhalten bei Fehlern
- **User-Feedback:** Verständliche Fehlermeldungen

## 📊 Beispiel-Szenario

### KW 31 - Sommerferien
```
Einrichtungen:
- ER: Geschlossen (Sommerferien) → Route zu Lim
- Lim: Geöffnet (übernimmt ER-Kinder)
- LH: Geöffnet 
- ST: Geschlossen (Betriebsferien) → Route zu LH

Ergebnis:
- Lim versorgt: Eigene Kinder + ER-Kinder
- LH versorgt: Eigene Kinder + ST-Kinder
```

## 🔧 Wartung & Erweiterung

### Konfigurierbare Elemente
- **KW-Bereich:** Einfach in HTML-Select erweiterbar
- **Status-Optionen:** Neue Status in API-Modul hinzufügen
- **Validierungsregeln:** In `validateRouting()` anpassbar

### Zukunfts-Features
- **Wiederkehrende Zeiträume:** Automatische Ferien-Templates
- **Kalender-Integration:** Import von Feiertagen
- **CSV-Export:** Für externe Verwaltungssysteme
- **API-Backend:** Umstellung von JSON-Dateien auf echte API

## 🛡️ Sicherheit

### Datenvalidierung
- **Client-seitig:** Sofortiges User-Feedback
- **Konsistenz:** Automatische Integritätsprüfungen
- **State-Schutz:** Unveränderlichkeit der Kern-Datenstrukturen

### Error-Recovery
- **Automatische Wiederherstellung:** Nach temporären Fehlern
- **State-Reset:** Bei kritischen Problemen
- **User-Guidance:** Hilfestellung bei Bedienungsfehlern 

## 🎓 Lessons Learned & Best Practices

### ⚠️ Kritische Erkenntnisse

#### 1. CSS-Grid mit Bootstrap Cards
**Problem:** CSS-Grid funktioniert nicht zuverlässig mit verschachtelten Bootstrap-Strukturen.
**Lösung:** Container direkt via JavaScript zum Grid umwandeln, Wrapper vermeiden.

#### 2. Maximale Seitenbreite
**Problem:** Standard Bootstrap-Margins reduzieren die nutzbare Kalender-Breite erheblich.
**Lösung:** Aggressive Padding-Reduzierung und Container-Margin-Entfernung für Ultra-Wide Screens.

#### 3. Responsive Grid-Breakpoints
**Problem:** 4x3 Grid funktioniert nicht auf allen Bildschirmgrößen.
**Lösung:** Progressive Grid-Anpassung: 4x3 → 3x4 → 2x6 → 1x12

#### 4. JavaScript vs. CSS für Grid-Layout
**Erkenntniss:** Bei komplexen Bootstrap-Umgebungen ist **direktes JavaScript-Styling** oft zuverlässiger als reines CSS.
**Anwendung:** Kritische Layout-Eigenschaften direkt via `container.style` setzen.

### 🔧 Entwicklungsempfehlungen

1. **Debug-First:** Immer Console-Logs für Layout-kritische Funktionen aktivieren
2. **Force-Styling:** Bei Grid-Problemen JavaScript-Force-Styling als Fallback
3. **Responsive Testing:** Alle Breakpoints einzeln testen, nicht nur Desktop
4. **Wrapper-Vermeidung:** Minimale HTML-Struktur für CSS-Grid verwenden
5. **Dokumentation:** Kritische Layout-Lösungen immer in MD dokumentieren

### 📋 Checkliste für zukünftige Grid-Implementierungen

- [ ] Container-Element identifiziert und direkt ansprechbar?
- [ ] Minimale HTML-Wrapper-Struktur verwendet?
- [ ] JavaScript-Force-Styling als Fallback implementiert?
- [ ] Responsive Breakpoints für alle Geräte definiert?
- [ ] Debug-Ausgaben für Troubleshooting aktiviert?
- [ ] Lösung in Dokumentation festgehalten?