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