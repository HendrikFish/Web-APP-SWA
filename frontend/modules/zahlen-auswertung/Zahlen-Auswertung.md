# Zahlen-Auswertung Modul

## Übersicht

Das **Zahlen-Auswertung-Modul** ist ein spezialisiertes Tool für die Küche, um eine Übersicht über die zu verpflegenden Personen nach Einrichtungen und Tagen zu erhalten. Es extrahiert Daten aus den Bestellungen und stellt sie in einer übersichtlichen Form dar.

## 🎯 Ziele

- **Küchen-Übersicht**: Klare Darstellung der zu verpflegenden Personen
- **Gruppierung**: Aufschlüsselung nach Einrichtungen und Personengruppen
- **Responsive Design**: Desktop-Tabelle und Mobile-Akkordeon
- **Lesebestätigung**: System zur Bestätigung der Kenntnisnahme
- **Export-Funktion**: CSV-Export für weitere Verarbeitung

## 📊 Funktionalitäten

### Desktop-Ansicht
- **Raster-Tabelle**: MO-SO horizontal, Einrichtungen vertikal
- **Sticky-Spalte**: Einrichtungsname bleibt sichtbar beim Scrollen
- **Farbkodierung**: Niedrig (grün), mittel (gelb), hoch (rot)
- **Gruppen-Details**: Aufschlüsselung pro Personengruppe
- **Summen-Zeile**: Tages- und Wochensummen

### Mobile-Ansicht
- **Akkordeon-Layout**: Tageweise aufklappbar
- **3-Spalten-Design**: Einrichtung/Anzahl/Information
- **Touch-Optimiert**: Große Buttons und einfache Navigation
- **Kompakte Darstellung**: Platzsparende Anzeige

### Informations-System
- **Detail-Modal**: Umfassende Einrichtungsinformationen
- **Statistiken**: Wochenübersicht und Durchschnittswerte
- **Lesebestätigung**: Markierung als gelesen mit Zeitstempel
- **Gruppen-Übersicht**: Personengruppen mit Anzahl

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

### Klassifizierung
- **Null**: 0 Bestellungen (Grau)
- **Niedrig**: 1-5 Bestellungen (Grün)
- **Mittel**: 6-15 Bestellungen (Gelb)
- **Hoch**: 16+ Bestellungen (Rot)

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
└── path/paths.js           # Pfad-Konfiguration
```

### Module

#### bestelldaten-api.js
```javascript
// Hauptfunktionen
- getVerfügbareWochen()     // Lädt verfügbare Kalenderwochen
- getBestelldaten(year, week) // Lädt Bestelldaten
- markiereAlsGelesen()      // Lesebestätigung
- exportiereAlsCSV()        // CSV-Export
```

#### zahlen-ui.js
```javascript
// UI-Funktionen
- renderDesktopTabelle()    // Desktop-Raster
- renderMobileAkkordeon()   // Mobile-Akkordeon
- renderInfoModal()         // Detail-Modal
- toggleLoadingState()      // Loading-Zustände
```

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
- Große Touch-Targets
- Vereinfachte Ansicht

## 🎮 Interaktionen

### Keyboard Shortcuts
- **Ctrl+R**: Daten aktualisieren
- **Ctrl+E**: CSV-Export
- **Escape**: Modal schließen

### Touch-Gesten
- **Tap**: Akkordeon öffnen/schließen
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
- **Dateiname**: `bestelldaten_kw{week}_{year}.csv`

### Zukünftige Formate
- **PDF**: Druckoptimierte Übersicht
- **Excel**: Erweiterte Formatierung
- **JSON**: Maschinenlesbare Daten

## 🛡️ Sicherheit & Validierung

### Input-Validierung
- Jahr: 2020-2030
- Kalenderwoche: 1-53
- Einrichtungs-IDs: UUID-Format

### Fehlerbehandlung
- **Graceful Degradation**: Teilweises Laden bei Fehlern
- **User Feedback**: Toast-Benachrichtigungen
- **Logging**: Detaillierte Fehlerlogs
- **Retry-Mechanismus**: Automatische Wiederholung

## 🧪 Testing

### Unit Tests
```javascript
// Daten-Verarbeitung
- verarbeiteBestelldaten()
- klassifiziereAnzahl()
- formatiereZeitpunkt()

// Validierung
- validatePaths.isValidYear()
- validatePaths.isValidWeek()
```

### Integration Tests
- API-Calls zu Bestelldaten
- Modal-Interaktionen
- Responsive Layout-Tests
- Export-Funktionalität

## 🚀 Performance

### Optimierungen
- **Lazy Loading**: Daten nur bei Bedarf laden
- **Caching**: Browser-Cache für statische Ressourcen
- **Debouncing**: Event-Handler-Optimierung
- **Virtual Scrolling**: Für große Datensätze (zukünftig)

### Metriken
- **Initial Load**: <2 Sekunden
- **Data Refresh**: <1 Sekunde
- **Modal Open**: <300ms
- **Export**: <5 Sekunden

## 🔗 Integration

### Dashboard-Anbindung
```javascript
// Navigation zum Modul
window.location.href = '/frontend/modules/zahlen-auswertung/';
```

### Shared Components
- **Header**: Globale Navigation
- **Toast**: Benachrichtigungen
- **Modal**: Bestätigungsdialoge

## 📈 Zukünftige Erweiterungen

### Geplante Features
1. **Prognose-System**: KI-basierte Vorhersagen
2. **Allergene-Übersicht**: Integration mit Rezept-Daten
3. **Kostenkalkulation**: Automatische Preisberechnung
4. **Lieferanten-Integration**: Direkter Export zu Lieferanten
5. **Mobile App**: Native App-Version

### Technische Verbesserungen
- **WebSocket**: Real-time Updates
- **PWA**: Offline-Funktionalität
- **Graph Visualisierung**: Chart.js Integration
- **Print Optimization**: Druckfreundliche Layouts

## 🐛 Bekannte Limitierungen

1. **Statische Daten**: Keine Echtzeit-Synchronisation
2. **Browser-Support**: IE11 nicht unterstützt
3. **Offline-Modus**: Nicht verfügbar
4. **Bulk-Operationen**: Einzelne Lesebestätigungen

## 📞 Support

### Troubleshooting
- **Keine Daten**: Prüfe Bestelldaten-Ordner
- **Langsam**: Browser-Cache leeren
- **Modal-Fehler**: Bootstrap-Version prüfen
- **Export-Probleme**: Browser-Downloads aktivieren

### Debug-Tools
```javascript
// Konsole-Befehle
debugZahlenAuswertung()     // Debug-Informationen
window.aktuelleBestelldaten // Daten-Inspektion
``` 