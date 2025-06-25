# Menü-Portal Modul

## Übersicht

Das **Menü-Portal** ist ein Read-Only-Modul, das Benutzern ermöglicht, Menüpläne verschiedener Einrichtungen einzusehen. Es unterstützt Multi-Einrichtungs-Zugriff und bietet sowohl eine mobile Accordion-Ansicht als auch eine Desktop-Grid-Darstellung.

## Funktionen

### 🔍 **Kernfunktionen**
- **Read-Only Menüplan-Anzeige**: Anzeige von Menüplänen ohne Bearbeitungsmöglichkeit
- **Multi-Einrichtungs-Support**: Benutzer können mehreren Einrichtungen zugeordnet sein
- **Responsive Design**: Mobile Accordion + Desktop Grid Layout
- **Wochennavigation**: Navigation zwischen verschiedenen Kalenderwochen
- **Drucken & PDF-Export**: Menüpläne für physische Verteilung exportieren

### 📱 **Mobile Features**
- **Accordion-Layout**: Tage als aufklappbare Karten
- **Touch-optimiert**: Große Touchziele, einfache Navigation
- **Rezept-Counter**: Anzahl Rezepte pro Tag auf einen Blick
- **Kategorie-Icons**: Visuelle Unterscheidung (🍲 Suppe, 🍽️ Menü 1, etc.)

### 🖥️ **Desktop Features**
- **Grid-Layout**: Übersichtliche Tabellenansicht
- **Sticky Headers**: Kategorien und Tage bleiben sichtbar beim Scrollen
- **Hover-Effekte**: Verbesserte Interaktivität

## Benutzer-Zuordnung

### Multi-Einrichtungs-System
Benutzer können mehreren Einrichtungen zugeordnet werden:

```javascript
// User-Model Erweiterung
{
  id: "user-123",
  name: "Max Mustermann",
  email: "max@beispiel.de",
  einrichtungen: [
    "einrichtung-abc-123",
    "einrichtung-def-456"
  ]
}
```

### Zugriffskontrolle
- **Automatische Filterung**: Nur zugewiesene Einrichtungen werden angezeigt
- **Einrichtungs-Selector**: Auswahl zwischen verfügbaren Einrichtungen
- **Sichere API-Abfragen**: Backend prüft Berechtigung bei jeder Anfrage

## Technische Architektur

### Module-Struktur
```
frontend/modules/menue-portal/
├── index.html                 # Haupt-HTML-Datei
├── css/
│   └── style.css             # Mobile-First CSS
├── js/
│   ├── script.js             # Hauptkoordination
│   └── module/
│       ├── menue-portal-api.js    # API-Kommunikation
│       ├── menue-portal-ui.js     # UI-Rendering
│       └── menue-portal-auth.js   # Authentifizierung
├── path/
│   └── paths.js              # Pfad-Konfigurationen
└── Menue-Portal.md          # Diese Dokumentation
```

### API-Integration

#### Menüplan laden
```javascript
import { loadMenuplan } from './module/menue-portal-api.js';

const result = await loadMenuplan(einrichtungId, year, week);
if (result.success) {
    const menuplan = result.menuplan;
    // Menüplan verarbeiten...
}
```

#### Benutzer-Authentifizierung
```javascript
import { initMenuePortalAuth } from './module/menue-portal-auth.js';

const authResult = await initMenuePortalAuth();
if (authResult.success) {
    const { user, einrichtungen } = authResult;
    // UI initialisieren...
}
```

## Responsive Design

### Mobile-First Ansatz
- **Breakpoint**: `768px`
- **Mobile Standard**: Accordion-Layout standardmäßig aktiv
- **Desktop Erweiterung**: Grid-Layout ab Tablet-Größe

### CSS-Klassen
```css
/* Mobile Accordion */
.mobile-accordion { /* Mobile-spezifische Styles */ }
.day-accordion-section { /* Tag-Container */ }
.day-header { /* Anklickbarer Tag-Header */ }
.day-content { /* Aufklappbarer Inhalt */ }

/* Desktop Grid */
.desktop-grid { /* CSS Grid Layout */ }
.grid-header-cell { /* Sticky Headers */ }
.grid-content-cell { /* Menüplan-Zellen */ }
```

## Benutzerführung

### Mobile Workflow
1. **Einrichtung wählen** (falls mehrere verfügbar)
2. **Woche navigieren** mit Vor/Zurück-Buttons
3. **Tag aufklappen** durch Antippen des Headers
4. **Rezepte betrachten** mit Allergen-Informationen
5. **Drucken/Export** über Action-Buttons

### Desktop Workflow
1. **Einrichtung wählen** über Button-Gruppe
2. **Woche navigieren** mit Kontrollelementen
3. **Überblick erhalten** durch Grid-Ansicht
4. **Details betrachten** in Zellen-Hover
5. **Exportieren** für weitere Verwendung

## State Management

### Globaler State
```javascript
// UI-State Variablen
let currentEinrichtung = null;     // Aktuell gewählte Einrichtung
let currentYear = 2025;            // Aktuelles Jahr
let currentWeek = 26;              // Aktuelle KW
let currentMenuplan = null;        // Geladener Menüplan
let rezepteCache = {};             // Cache für Rezept-Details
let isMobile = false;              // Mobile-Detection
```

### State-Synchronisation
- **Window-Objekte**: Globale Verfügbarkeit für Debug/Test
- **Event-System**: Custom Events für Layout-Änderungen
- **Cache-Management**: Intelligente Rezept-Detail-Caching

## Fehlerbehandlung

### API-Fehler
```javascript
// Graceful Degradation
if (!result.success) {
    if (response.status === 404) {
        // Leeren Menüplan anzeigen
        return createEmptyMenuplan(year, week);
    }
    // Benutzerfreundliche Fehlermeldung
    showToast(result.message, 'error');
}
```

### Netzwerk-Probleme
- **Offline-Erkennung**: Informative Meldungen
- **Retry-Mechanismus**: Automatische Wiederholung bei temporären Fehlern
- **Fallback-UI**: Leere Menüpläne statt Crash

## Performance-Optimierungen

### Lazy Loading
- **Rezept-Details**: Nur bei Bedarf laden
- **Parallel-Requests**: Gleichzeitige API-Abfragen
- **Caching**: Vermeidung redundanter Anfragen

### UI-Optimierungen
- **Virtual Scrolling**: Für große Menüpläne (zukünftig)
- **Debouncing**: Resize-Handler mit Verzögerung
- **CSS-Animationen**: Hardware-beschleunigte Transformationen

## Wartung & Erweiterungen

### Erweiterungspunkte
1. **Filterung**: Nach Allergenen, Kategorien
2. **Favoriten**: Benutzer-spezifische Markierungen
3. **Notizen**: Kommentare zu Rezepten/Tagen
4. **Offline-Modus**: Service Worker Integration
5. **Push-Benachrichtigungen**: Bei Menüplan-Änderungen

### Code-Qualität
- **ES6+ Modules**: Moderne JavaScript-Architektur
- **JSDoc-Kommentare**: Vollständige API-Dokumentation
- **Error Boundaries**: Isolierte Fehlerbehandlung
- **Unit-Test-Ready**: Testbare Funktionsarchitektur

## API-Endpunkte

### Verwendete Endpunkte
```
GET /api/user/current
→ Aktueller Benutzer mit Einrichtungszuordnungen

GET /api/einrichtung/{id}
→ Details einer spezifischen Einrichtung

GET /api/menueplan?einrichtung={id}&year={year}&week={week}
→ Menüplan für bestimmte Einrichtung und KW

GET /api/rezepte
→ Alle verfügbaren Rezepte (gefiltert nach Zugriff)
```

### Antwortformate
```javascript
// Menüplan-Response
{
  "success": true,
  "menuplan": {
    "id": "2025-26",
    "year": 2025,
    "week": 26,
    "days": {
      "montag": {
        "suppe": [{"id": "rezept-123", "name": "Tomatensuppe"}],
        "menue1": [{"id": "rezept-456", "name": "Schnitzel"}],
        // ...
      }
      // ...
    }
  }
}
```

## Sicherheit

### Zugriffskontrolle
- **JWT-Token**: Automatische Authentifizierung
- **Einrichtungs-Prüfung**: Backend validiert Zugriffsberechtigung
- **Input-Sanitization**: Sichere Parameter-Verarbeitung

### Datenschutz
- **Read-Only**: Keine Datenmanipulation möglich
- **Lokaler Cache**: Temporäre Speicherung ohne Persistierung
- **Session-Management**: Automatische Token-Bereinigung

## Integration

### Dashboard-Link
Das Menü-Portal ist über das Haupt-Dashboard erreichbar:
```html
<a href="/frontend/modules/menue-portal/" class="module-link">
    📋 Menü-Portal
</a>
```

### Header-Integration
Automatische Header-Einbindung mit Navigation:
```javascript
import { loadHeader } from '@shared/components/header/header.js';
await loadHeader();
```

## Deployment

### Produktions-Bereitstellung
1. **CSS-Minimierung**: Komprimierte Styles
2. **JavaScript-Bundling**: Optimierte Module
3. **Asset-Optimierung**: Komprimierte Icons/Bilder
4. **CDN-Integration**: Schnellere Asset-Auslieferung

### Browser-Kompatibilität
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Fallbacks**: Graceful Degradation für ältere Browser

---

## Changelog

### Version 1.0.0 (Aktuell)
- ✅ Grundlegende Menüplan-Anzeige
- ✅ Multi-Einrichtungs-Support
- ✅ Responsive Mobile/Desktop-Layout
- ✅ Wochennavigation
- ✅ Drucken/PDF-Export
- ✅ Benutzer-Authentifizierung
- ✅ API-Integration

### Geplante Features (v1.1.0)
- 🔄 Erweiterte Filteroptionen
- 🔄 Offline-Mode mit Service Worker
- 🔄 Erweiterte Export-Formate
- 🔄 Push-Benachrichtigungen

---

*Dokumentation erstellt: 2025-01-01*  
*Letzte Aktualisierung: 2025-01-01* 