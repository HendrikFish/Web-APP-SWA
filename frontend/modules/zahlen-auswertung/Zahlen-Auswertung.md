# Zahlen-Auswertung Modul

## Übersicht

Das **Zahlen-Auswertung-Modul** ist ein spezialisiertes Tool für die Küche, um eine Übersicht über die zu verpflegenden Personen nach Einrichtungen und Tagen zu erhalten. Es extrahiert Daten aus den Bestellungen und stellt sie in einer übersichtlichen Form dar.

## 🎯 Ziele

- **Küchen-Übersicht**: Klare Darstellung der zu verpflegenden Personen
- **Gruppierung**: Aufschlüsselung nach Einrichtungen und Personengruppen
- **Responsive Design**: Desktop-Tabelle und Mobile-Akkordeon
- **Informations-Integration**: Vollständige Integration mit dem Informationen-System
- **Lesebestätigung**: System zur Bestätigung der Kenntnisnahme
- **Export-Funktion**: CSV-Export für weitere Verarbeitung

## 📊 Funktionalitäten

### Desktop-Ansicht
- **Raster-Tabelle**: MO-SO horizontal, Einrichtungen vertikal
- **Sticky-Spalte**: Einrichtungsname bleibt sichtbar beim Scrollen
- **Farbkodierung**: Niedrig (grün), mittel (gelb), hoch (rot)
- **Gruppen-Details**: Aufschlüsselung pro Personengruppe
- **Summen-Zeile**: Tages- und Wochensummen
- **Info-Buttons**: Ungelesene Informationen mit pulsierender Animation

### Mobile-Ansicht
- **Akkordeon-Layout**: Tageweise aufklappbar
- **3-Spalten-Design**: Einrichtung/Anzahl/Information
- **Touch-Optimiert**: Große Buttons und einfache Navigation
- **Kompakte Darstellung**: Platzsparende Anzeige

### Informations-System
- **Detail-Modal**: Umfassende Einrichtungsinformationen
- **Prioritäts-Anzeige**: Kritisch, Hoch, Normal, Niedrig mit farblicher Kennzeichnung
- **Statistiken**: Wochenübersicht und Durchschnittswerte
- **Lesebestätigung**: Markierung als gelesen mit Zeitstempel und automatischer UI-Aktualisierung
- **Gruppen-Übersicht**: Personengruppen mit Anzahl
- **Live-Updates**: Sofortige Aktualisierung der UI nach Aktionen

### Navigation
- **ISO 8601-konforme Kalenderwoche**: Korrekte KW-Berechnung nach internationalem Standard
- **Heute-Button**: Moderne Optik mit 15px Border-Radius und Hover-Effekten (Design konsistent mit Menü-Portal)
- **Wochennavigation**: Vor/Zurück mit korrekter Jahr-Grenze-Behandlung
- **Tastatur-Shortcuts**: Pfeiltasten für Navigation, F5 für Refresh

## 🗂️ Datenstruktur

### Bestelldaten-Quelle
```
shared/data/portal/bestellungen/
├── 2025/
│   ├── 25.json
│   ├── 26.json
│   └── 27.json
├── 2026/
└── stammdaten.json
```

### Informationen-Quelle
```
shared/data/portal/informationen/
├── 2025/
│   ├── 25.json
│   ├── 26.json
│   └── 27.json
└── 2026/
```

### Datenformat
```json
{
  "year": 2025,
  "week": 26,
  "einrichtungen": {
    "einrichtung-id": {
      "info": {
        "name": "Einrichtungsname",
        "typ": "extern",
        "gruppen": [{"name": "KR", "anzahl": 10}],
        "read": false,
        "letzte_aktualisierung": "2025-01-01T10:00:00Z"
      },
      "tage": {
        "montag": {
          "hauptspeise": {"KR": 9, "KG": 3}
        }
      }
    }
  }
}
```

## 🎨 Design-Konzept

### Farbsystem
- **Primär**: `#0066cc` (Blau)
- **Erfolg**: `#198754` (Grün) - Niedrige Zahlen
- **Warnung**: `#ffc107` (Gelb) - Mittlere Zahlen  
- **Gefahr**: `#dc3545` (Rot) - Hohe Zahlen
- **Sekundär**: `#6c757d` (Grau)

### Button-Design
- **Heute-Button**: 15px Border-Radius, 1.2rem Padding, moderne Hover-Effekte
- **Info-Buttons**: Pulsierende Animation bei ungelesenen Informationen
- **Touch-Targets**: Mindestgröße 44px für mobile Geräte

### Klassifizierung

Das **prozentuale Farbsystem** basiert auf der Auslastung der maximalen Gruppenstärke jeder Einrichtung:

- **Null**: 0 Bestellungen (Grau)
- **Niedrig**: 1-50% der maximalen Gruppenstärke (Rot) - Geringe Auslastung ist problematisch
- **Mittel**: 51-80% der maximalen Gruppenstärke (Gelb) - Gute Auslastung
- **Hoch**: 81-100%+ der maximalen Gruppenstärke (Grün) - Optimale Auslastung

Die maximalen Gruppenstärken werden aus `shared/data/einrichtungen/einrichtungen.json` geladen.

**Beispiel:**
- Einrichtung "Limberg" hat Gruppe "KR" mit max. 10 Personen
- Bei 3 Bestellungen: 30% → Niedrig (Rot) - Weniger Personen als erwartet
- Bei 7 Bestellungen: 70% → Mittel (Gelb) - Gute Auslastung
- Bei 9 Bestellungen: 90% → Hoch (Grün) - Optimale Auslastung der Kapazitäten

## 🔧 Technische Implementierung

### Architektur
```
frontend/modules/zahlen-auswertung/
├── index.html              # Haupt-HTML
├── css/style.css           # Responsive Styles
├── js/
│   ├── script.js           # Hauptlogik
│   └── module/
│       ├── bestelldaten-api.js  # API-Funktionen
│       └── zahlen-ui.js         # UI-Rendering
├── path/paths.js           # Pfad-Konfiguration
└── Zahlen-Auswertung.md    # Diese Dokumentation
```

### Module

#### bestelldaten-api.js
```javascript
// ISO 8601-konforme Kalenderwoche-Berechnung
- getAktuelleKalenderwoche()     // Korrekte KW nach ISO 8601
- getISOWeek(date)              // ISO-Wochenberechnung
- getWeeksInYear(year)          // Wochen pro Jahr (52/53)

// Hauptfunktionen
- getVerfügbareWochen()         // Lädt verfügbare Kalenderwochen
- getBestelldaten(year, week)   // Lädt Bestelldaten
- markiereAlsGelesen()          // Lesebestätigung für Bestelldaten
- markiereInformationAlsGelesen() // Lesebestätigung für Informationen
- exportiereAlsCSV()            // CSV-Export

// Navigation
- getPreviousWeek()             // Vorherige Woche mit Jahr-Grenze
- getNextWeek()                 // Nächste Woche mit Jahr-Grenze
- formatWeekDisplay()           // KW-Anzeige formatieren
```

#### zahlen-ui.js
```javascript
// UI-Funktionen
- renderDesktopTabelle()        // Desktop-Raster
- renderMobileAkkordeon()       // Mobile-Akkordeon
- renderInfoModal()             // Detail-Modal mit Informationen
- toggleLoadingState()          // Loading-Zustände
- updateInformationButtons()    // Info-Button-Status aktualisieren
```

### Informations-Integration
- **Backend-API**: `/api/informationen/mark-as-read` für Lesebestätigung
- **Echtzeit-Updates**: Automatische UI-Aktualisierung nach Aktionen
- **Prioritäts-Anzeige**: Visuelle Kennzeichnung nach Wichtigkeit
- **Ungelesen-Indikator**: Rote Badges und Animation bei ungelesenen Informationen

## 📱 Responsive Breakpoints

### Desktop (≥992px)
- Vollständige Tabelle mit allen Spalten
- Sticky-Navigation
- Hover-Effekte
- Tooltips

### Tablet (768px-991px)
- Kompakte Tabelle
- Reduzierte Spaltenbreite
- Touch-optimierte Buttons

### Mobile (<768px)
- Akkordeon-Layout
- Vertikale Navigation
- Große Touch-Targets (≥44px)
- Vereinfachte Ansicht

## 🎮 Interaktionen

### Keyboard Shortcuts
- **Pfeiltasten Links/Rechts**: Wochennavigation
- **Home**: Zur aktuellen Woche springen
- **F5**: Daten aktualisieren
- **Escape**: Modal schließen

### Touch-Gesten
- **Tap**: Akkordeon öffnen/schließen, Informationen anzeigen
- **Long Press**: Info-Modal öffnen (Mobile)
- **Swipe**: Horizontales Scrollen (Desktop-Tabelle)

## 🔄 Auto-Refresh

### Funktionalität
- **Intervall**: Alle 5 Minuten
- **Intelligente Pausierung**: Stoppt bei inaktivem Tab
- **Restart-Verzögerung**: 30 Sekunden nach Tab-Aktivierung
- **Fehlerbehandlung**: Graceful Degradation bei Fehlern

### Steuerung
```javascript
window.startAutoRefresh()  // Manuell starten
window.stopAutoRefresh()   // Manuell stoppen
```

## 📊 Export-Funktionen

### CSV-Export
- **Format**: Semikolon-getrennt
- **Kodierung**: UTF-8 mit BOM
- **Inhalt**: Einrichtung, Typ, Tageswerte, Gesamt
- **Dateiname**: `zahlen-auswertung-kw{week}_{year}.csv`

### Zukünftige Formate
- **PDF**: Druckoptimierte Übersicht
- **Excel**: Erweiterte Formatierung
- **JSON**: Maschinenlesbare Daten

## 🛡️ Sicherheit & Validierung

### Input-Validierung
- Jahr: 2020-2030
- Kalenderwoche: 1-53 (ISO 8601-konform)
- Einrichtungs-IDs: UUID-Format
- Informations-IDs: UUID-Format

### Fehlerbehandlung
- **Graceful Degradation**: Teilweises Laden bei Fehlern
- **User Feedback**: Toast-Benachrichtigungen
- **Logging**: Detaillierte Fehlerlogs
- **Retry-Mechanismus**: Automatische Wiederholung bei API-Fehlern

## 🧪 Testing

### Unit Tests
```javascript
// Daten-Verarbeitung
- verarbeiteBestelldaten()
- klassifiziereAnzahl()
- getISOWeek()                  // KW-Berechnung testen
- getWeeksInYear()              // Jahr-Wochen-Berechnung

// Navigation
- getPreviousWeek()
- getNextWeek()
```

### Integration Tests
```javascript
// API-Funktionen
- markiereInformationAlsGelesen()
- getInformationenFürWoche()
- getBestelldaten()
```

## 📈 Performance-Optimierungen

### Caching
- **Daten-Cache**: Vermeidung redundanter API-Calls
- **UI-State**: Erhaltung des Zustands bei Navigation
- **Lazy Loading**: Informationen nur bei Bedarf laden

### Rendering
- **Virtual Scrolling**: Für große Datensätze (geplant)
- **Debouncing**: Navigation und Search
- **Batch Updates**: Gruppierte DOM-Änderungen

## 🔮 Zukünftige Erweiterungen

### Features
- **Filter-System**: Nach Einrichtungstyp, Personengruppe
- **Suchfunktion**: Volltext-Suche in Informationen
- **Dashboard-Widget**: Kompakte Übersichts-Kachel
- **Benachrichtigungen**: Push-Notifications für kritische Informationen

### Integration
- **Calendar-View**: Monatsübersicht mit Bestellzahlen
- **Analytics**: Trends und Vorhersagen
- **Export-API**: Automatisierte Datenabfrage für externe Systeme

---

**Letzte Aktualisierung**: 29.06.2025  
**Version**: 2.1.0 (ISO 8601 + Informations-Integration) 