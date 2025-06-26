# Menü-Portal Modul

## Übersicht

Das **Menü-Portal** ist ein Read-Only-Modul, das Benutzern ermöglicht, Menüpläne verschiedener Einrichtungen einzusehen. Es unterstützt Multi-Einrichtungs-Zugriff und bietet sowohl eine mobile Accordion-Ansicht als auch eine Desktop-Grid-Darstellung. Zusätzlich bietet es umfassende Bewertungs- und Bestellfunktionalitäten.

## Intelligente Kategorien-Darstellung

### **Mobile-Ansicht (Smartphone)**
**Grundprinzip**: Kategorien anzeigen wenn im **Speiseplan auf `true`** gesetzt, unabhängig von Zuweisungen

**Verhalten**:
- **Alle Kategorien** die im Speiseplan aktiviert sind (`suppe: true`, `dessert: true`, etc.)
- **Platzhalter**: "Noch nicht erzeugt" wenn keine Rezepte vorhanden
- **Kindergarten/Schule**: Zeigt nur die tatsächlich zugewiesene Kategorie als "Hauptspeise" an

### **Desktop-Ansicht (Tabelle)**
**Grundprinzip**: Alle Standard-Kategorien für **Tabellen-Konsistenz** anzeigen

**Verhalten**:
- **Alle Standard-Kategorien** immer anzeigen (suppe, menu1, menu2, dessert)
- **Zugewiesen + leer**: "Noch nicht gewählt"
- **Nicht zugewiesen**: "-" (leere Karte)
- **Kindergarten/Schule**: "Hauptspeise" statt separate Menüs

### **Kindergarten/Schule Spezialbehandlung**
- **Nicht kombinieren** von menu1+menu2 Rezepten
- **Nur die zugewiesene** Kategorie anzeigen (menu1 ODER menu2)
- **Umbenennung** zu "Hauptspeise" (verständlicher für Zielgruppe)
- **Platzhalter**: Auch ohne Zuweisung wird "Hauptspeise - Noch nicht erzeugt" angezeigt
- **Grund**: Vereinfachung, da sie nicht wissen dass es 2 Menüs gibt

### **Beispiel-Szenarien**

| Situation | Desktop | Mobile |
|-----------|---------|--------|
| **ER (Schüler) - Montag** | | |
| - Speiseplan: suppe=true, dessert=true | Suppe: "Noch nicht gewählt" | Suppe: "Noch nicht erzeugt" |
| - KW.json: menu2 zugewiesen | Hauptspeise: "Mozzarella-Tomate" | Hauptspeise: "Mozzarella-Tomate" |
| | Dessert: "Noch nicht gewählt" | Dessert: "Noch nicht erzeugt" |
| **ER (Schüler) - Dienstag** | | |
| - Speiseplan: hauptspeise=true | Hauptspeise: "Noch nicht gewählt" | Hauptspeise: "Noch nicht erzeugt" |
| - KW.json: keine Zuweisung | (Platzhalter angezeigt) | (Platzhalter angezeigt) |
| **Normale Einrichtung** | | |
| - Speiseplan: alle=true | Alle 4 Kategorien sichtbar | Alle 4 Kategorien sichtbar |
| - KW.json: nur menu1 zugewiesen | Menu1: Rezepte, Rest: Platzhalter | Menu1: Rezepte, Rest: Platzhalter |

## Funktionen

### 🔍 **Kernfunktionen**
- **Read-Only Menüplan-Anzeige**: Anzeige von Menüplänen ohne Bearbeitungsmöglichkeit
- **Multi-Einrichtungs-Support**: Benutzer können mehreren Einrichtungen zugeordnet sein
- **Responsive Design**: Mobile Accordion + Desktop Grid Layout
- **Wochennavigation**: Navigation zwischen verschiedenen Kalenderwochen
- **Drucken & PDF-Export**: Menüpläne für physische Verteilung exportieren

### ⭐ **Bewertungssystem**
- **Kategoriebasierte Bewertungen**: Bewertung von Suppe, Menü 1, Menü 2, etc.
- **Doppelbewertung**: Geschmack und Optik separat bewertbar (1-5 Sterne)
- **Verbesserungsvorschläge**: Pflichtfeld für konstruktive Kritik mit Alternativen
- **Zeitbegrenzung**: Bewertungen nur für die letzten 10 Tage möglich
- **Benutzer-Authentifizierung**: Verknüpfung mit Benutzer und Einrichtung
- **API-Integration**: Persistierung über Backend-API

### 📦 **Bestellfunktionalität** (Nur externe Einrichtungen)
- **Gruppenbasierte Bestellungen**: Bestellungen nach Bewohnergruppen organisiert
- **Automatische Berechnungen**: Suppen und Desserts automatisch basierend auf Hauptspeisen
- **LocalStorage-Persistierung**: Bestellungen bleiben bei Seitenwechsel erhalten
- **Export/Import**: CSV-Export und Datenimport für weitere Verarbeitung
- **Validierung**: Automatische Plausibilitätsprüfung der Bestellmengen
- **UI-Feedback**: Live-Updates und Toast-Benachrichtigungen

### 📱 **Mobile Features**
- **Accordion-Layout**: Tage als aufklappbare Karten
- **Touch-optimiert**: Große Touchziele, einfache Navigation
- **Rezept-Counter**: Anzahl Rezepte pro Tag auf einen Blick
- **Kategorie-Icons**: Visuelle Unterscheidung (🍲 Suppe, 🍽️ Menü 1, etc.)
- **Bewertungs-Buttons**: Schneller Zugriff auf Bewertungsfunktion
- **Bestellfelder**: Inline-Eingabe für Bestellmengen

### 🖥️ **Desktop Features**
- **Grid-Layout**: Übersichtliche Tabellenansicht
- **Sticky Headers**: Kategorien und Tage bleiben sichtbar beim Scrollen
- **Hover-Effekte**: Verbesserte Interaktivität
- **Kalender-Ansicht**: Wochenbasierte Darstellung mit Navigation

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
├── index.html                        # Haupt-HTML-Datei
├── css/
│   └── style.css                     # Mobile-First CSS
├── js/
│   ├── script.js                     # Hauptkoordination & Bootstrap
│   └── module/
│       ├── menue-portal-api.js       # API-Kommunikation
│       ├── menue-portal-ui.js        # UI-Rendering & Orchestrierung
│       ├── menue-portal-auth.js      # Authentifizierung
│       ├── bewertung-api.js          # Bewertungs-API-Calls
│       ├── bewertung-modal.js        # Bewertungs-Modal UI
│       ├── bestellung-handler.js     # Bestellfunktionalität
│       ├── mobile-accordion-handler.js # Mobile Accordion-Layout
│       └── desktop-calendar-handler.js # Desktop Grid-Layout
├── path/
│   └── paths.js                      # Pfad-Konfigurationen
├── Menue-Portal.md                   # Diese Dokumentation
└── Menue-Portal-Anbindung.md        # API-Datenvertrag
```

### Modulare Handler-Architektur
Die UI ist in spezialisierte Handler aufgeteilt:

#### **Mobile Accordion Handler**
- Accordion-Layout für Smartphones/Tablets
- Touch-optimierte Bedienung
- Kategoriebasierte Darstellung
- Bewertungs-Buttons pro Kategorie

#### **Desktop Calendar Handler**  
- Grid-basierte Kalenderansicht
- Hover-Effekte und Tooltips
- Sticky Headers für bessere Navigation
- Kompakte Darstellung für große Bildschirme

#### **Bestellung Handler**
- Bestellmengen-Verwaltung
- Automatische Berechnungen (Suppe/Dessert)
- LocalStorage-Persistierung
- Export/Import-Funktionalität

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

#### Bewertung erstellen
```javascript
import { createBewertung } from './module/bewertung-api.js';

const bewertungData = {
    geschmack: 4,
    optik: 5,
    verbesserungsvorschlag: "Statt Nudeln wären Spätzle eine bessere Alternative",
    // ... weitere Felder
};

const result = await createBewertung(bewertungData);
```

#### Bestellungen verwalten
```javascript
import { 
    handleBestellungChange, 
    exportBestellungen,
    validateBestellungen 
} from './module/bestellung-handler.js';

// Bestellung ändern
handleBestellungChange(inputElement);

// Export für weitere Verarbeitung
const csvData = exportBestellungen(wochenschluessel);
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

/* Bewertungs-Modal */
.bewertung-modal { /* Modal-Overlay */ }
.star-rating { /* Sterne-Bewertung */ }

/* Bestellfelder */
.bestellung-input { /* Eingabefelder für Bestellmengen */ }
.bestellung-summary { /* Zusammenfassung pro Tag */ }
```

## Benutzerführung

### Mobile Workflow
1. **Einrichtung wählen** (falls mehrere verfügbar)
2. **Woche navigieren** mit Vor/Zurück-Buttons
3. **Tag aufklappen** durch Antippen des Headers
4. **Rezepte betrachten** mit Allergen-Informationen
5. **Bewertung abgeben** über Kategorie-Buttons
6. **Bestellungen eingeben** (bei externen Einrichtungen)
7. **Drucken/Export** über Action-Buttons

### Desktop Workflow
1. **Einrichtung wählen** über Button-Gruppe
2. **Woche navigieren** mit Kontrollelementen
3. **Überblick erhalten** durch Grid-Ansicht
4. **Details betrachten** in Zellen-Hover
5. **Bewertungen abgeben** über Modal
6. **Bestellungen verwalten** über Inline-Felder
7. **Exportieren** für weitere Verwendung

### Bewertungs-Workflow
1. **Kategorie auswählen** (z.B. "Suppe" an einem bestimmten Tag)
2. **Modal öffnet sich** mit Rezept-Details
3. **Geschmack bewerten** (1-5 Sterne)
4. **Optik bewerten** (1-5 Sterne)
5. **Verbesserungsvorschlag eingeben** (Pflichtfeld)
6. **Bewertung absenden** und in Backend speichern

### Bestellungs-Workflow (Nur externe Einrichtungen)
1. **Bestellmenge eingeben** für Hauptspeisen
2. **Automatische Berechnung** von Suppen und Desserts
3. **Live-Validierung** der Eingaben
4. **Speichern im LocalStorage** für Persistierung
5. **Export als CSV** für weitere Verarbeitung
6. **Bestellungen löschen/zurücksetzen** bei Bedarf

## State Management

### Globaler State
```javascript
// UI-State Variablen
let currentEinrichtung = null;         // Aktuell gewählte Einrichtung
let currentUser = null;                // Aktueller Benutzer
let currentYear = 2025;                // Aktuelles Jahr
let currentWeek = 26;                  // Aktuelle KW
let currentMenuplan = null;            // Geladener Menüplan
let rezepteCache = {};                 // Cache für Rezept-Details
let portalStammdaten = null;          // Portal-Konfiguration
let isMobile = false;                  // Mobile-Detection

// Bewertungs-State
let currentBewertungData = null;       // Aktuelle Bewertung im Modal

// Bestellungs-State
let bestellungen = {};                 // Format: { "2025-26": { "montag": { "menu1": { "Gruppe A": 5 } } } }
```

### State-Synchronisation
- **Window-Objekte**: Globale Verfügbarkeit für Debug/Test
- **Event-System**: Custom Events für Layout-Änderungen
- **Cache-Management**: Intelligente Rezept-Detail-Caching
- **LocalStorage**: Persistierung von Bestellungen zwischen Sessions

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

### Bewertungs-Validierung
- **Zeitbegrenzung**: Nur letzte 10 Tage bewertbar
- **Pflichtfelder**: Verbesserungsvorschlag mindestens 10 Zeichen
- **Doppelbewertungen**: Verhinderung durch Backend-Prüfung

### Bestellungs-Validierung
- **Plausibilitätsprüfung**: Warnung bei ungewöhnlich hohen Mengen
- **Automatische Korrekturen**: Suppen/Desserts basierend auf Hauptspeisen
- **Datenintegrität**: LocalStorage-Backup bei Browser-Abstürzen

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
- **Modulare Handler**: Code-Splitting für bessere Performance
- **Event-Debouncing**: Resize-Handler mit Verzögerung
- **CSS-Animationen**: Hardware-beschleunigte Transformationen
- **LocalStorage**: Reduzierte API-Calls durch lokale Persistierung

## Wartung & Erweiterungen

### Implementierte Erweiterungen (Neu)
1. **✅ Bewertungssystem**: Kategoriebasierte Bewertungen mit Modal
2. **✅ Bestellfunktionalität**: Umfassende Bestellverwaltung
3. **✅ Modulare Handler**: Getrennte Module für bessere Wartbarkeit
4. **✅ Export/Import**: CSV-Export für Bestellungen

### Zukünftige Erweiterungspunkte
1. **Filterung**: Nach Allergenen, Kategorien
2. **Favoriten**: Benutzer-spezifische Markierungen
3. **Notizen**: Kommentare zu Rezepten/Tagen
4. **Offline-Modus**: Service Worker Integration
5. **Push-Benachrichtigungen**: Bei Menüplan-Änderungen
6. **Bewertungs-Analytics**: Auswertungen und Trends
7. **Bestellungs-Templates**: Wiederkehrende Bestellmuster

### Code-Qualität
- **ES6+ Modules**: Moderne JavaScript-Architektur
- **JSDoc-Kommentare**: Vollständige API-Dokumentation
- **Error Boundaries**: Isolierte Fehlerbehandlung
- **Unit-Test-Ready**: Testbare Funktionsarchitektur
- **Modulare Trennung**: Handler für spezifische Aufgaben

## API-Endpunkte

### Verwendete Endpunkte
```
GET /api/user/current
→ Aktueller Benutzer mit Einrichtungszuordnungen

GET /api/menueplan/{year}/{week}
→ Menüplan für spezifische Woche

GET /api/portal/stammdaten  
→ Portal-Konfiguration und Kategorien

POST /api/bewertungen
→ Neue Bewertung erstellen

GET /api/bewertungen/{einrichtungId}/{year}/{week}
→ Bewertungen für Woche abrufen

DELETE /api/bewertungen/{id}
→ Bewertung löschen (nur eigene)
```

### Bewertungs-API Datenstruktur
```json
{
  "geschmack": 4,
  "optik": 5, 
  "verbesserungsvorschlag": "Statt Nudeln wären Spätzle besser...",
  "tag": "montag",
  "kategorie": "menu1",
  "rezepte": ["Schnitzel mit Pommes"],
  "menueplan_datum": "2025-01-13",
  "kalenderwoche": 3,
  "jahr": 2025,
  "einrichtung_id": "einrichtung-abc-123",
  "einrichtung_name": "Haus Sonnenschein"
}
```

### Bestellungs-Datenstruktur (LocalStorage)
```json
{
  "2025-26": {
      "montag": {
      "menu1": {
        "Gruppe A": 15,
        "Gruppe B": 12
      },
      "suppe": {
        "Gruppe A": 15,
        "Gruppe B": 12
      }
    }
  }
}
```

## Debug & Development

### Debug-Modus
Im Development (localhost) ist ein Debug-Modus verfügbar:

```javascript
// Verfügbare Debug-Funktionen
window.menuePortalDebug = {
    reloadModules: () => location.reload(),
    showToast: (message, type) => showToast(message, type),
    getState: () => ({
        user: window.currentUser,
        einrichtungen: window.currentEinrichtungen, 
        menuPlan: window.currentMenuPlan,
        bestellungen: getBestellungen()
    })
};
```

### Logging
- **Console-Logs**: Strukturierte Ausgaben mit Emojis
- **Error-Tracking**: Unhandled Promise Rejections
- **Performance-Monitoring**: API-Response-Zeiten
- **State-Changes**: Wichtige Zustandsänderungen

## Sicherheitskonzepte

### Authentifizierung
- **JWT-Token**: Alle API-Anfragen authentifiziert
- **Einrichtungs-Autorisierung**: Nur zugewiesene Einrichtungen
- **Session-Management**: Automatische Token-Verlängerung

### Datenschutz
- **Bewertungs-Anonymisierung**: Keine Rückschlüsse auf Personen
- **LocalStorage-Verschlüsselung**: Sensitive Daten geschützt
- **GDPR-Compliance**: Datenlöschung und Export möglich

### Input-Validation
- **XSS-Schutz**: Eingaben werden validiert und escaped
- **SQL-Injection-Schutz**: Parametrisierte Backend-Queries
- **Rate-Limiting**: Schutz vor Spam und Missbrauch

## Installation & Setup

### Voraussetzungen
- **Node.js**: Version 18+ für Backend-Dependencies
- **Browser**: Modern Browser mit ES6+ Support
- **Backend**: SmartWorkArt Backend-API laufend
- **Authentifizierung**: JWT-Token-System eingerichtet

### Abhängigkeiten
```json
{
  "bootstrap": "^5.3.0",
  "bootstrap-icons": "^1.11.0"
}
```

### Setup-Schritte
1. **Module-Verzeichnis prüfen**:
   ```bash
   frontend/modules/menue-portal/
   ├── index.html ✓
   ├── css/style.css ✓
   ├── js/script.js ✓
   └── js/module/ ✓
   ```

2. **Shared Components verfügbar machen**:
   ```bash
   shared/components/
   ├── header/header.js ✓
   ├── toast-notification/ ✓
   └── styles/layout.css ✓
   ```

3. **Backend-Endpunkte konfigurieren** (siehe API-Endpunkte)

4. **Pfad-Konfiguration prüfen**:
   ```javascript
   // path/paths.js
   export const API_BASE_URL = '/api';
   export const SHARED_COMPONENTS_PATH = '/shared/components';
   ```

### Erste Verwendung
1. **Benutzer-Account** mit Einrichtungszuordnung anlegen
2. **Login** über `/frontend/core/login/`
3. **Navigation** zum Menü-Portal: `/frontend/modules/menue-portal/`
4. **Einrichtung auswählen** (falls mehrere vorhanden)
5. **Menüplan betrachten** und optional bewerten/bestellen

## Konfiguration

### Portal-Stammdaten
Die Kategorien und Icons werden über `shared/data/portal/portal-stammdaten.json` konfiguriert:

```json
{
  "kategorien": {
    "suppe": {
      "name": "Suppe",
      "icon": "🍲",
      "sortierung": 1,
      "farbe": "#ffeaa7"
    },
    "menu1": {
      "name": "Menü 1", 
      "icon": "🍽️",
      "sortierung": 2,
      "farbe": "#74b9ff"
    },
    "menu2": {
      "name": "Menü 2",
      "icon": "🍽️", 
      "sortierung": 3,
      "farbe": "#55a3ff"
    },
    "dessert": {
      "name": "Dessert",
      "icon": "🍰",
      "sortierung": 4,
      "farbe": "#fd79a8"
    }
  },
  "bewertung": {
    "maximaleTageSeit": 10,
    "mindestlaengeVorschlag": 10,
    "pflichtfelder": ["verbesserungsvorschlag"]
  },
  "bestellung": {
    "automatischeBerechnung": {
      "suppe": true,
      "dessert": true
    },
    "maximaleMenge": 999,
    "warnungAb": 50
  }
}
```

### Einrichtungs-Konfiguration
Einrichtungen werden mit ihrem Speiseplan konfiguriert:

```json
{
  "id": "einrichtung-abc-123",
  "name": "Haus Sonnenschein",
  "kuerzel": "HS",
  "isIntern": false,
  "speiseplan": {
    "montag": {
      "suppe": true,
      "hauptspeise": true,
      "dessert": true
    },
    "dienstag": {
      "suppe": true,
      "hauptspeise": true,
      "dessert": false
    }
  },
  "bewohnergruppen": [
    "Gruppe A",
    "Gruppe B", 
    "Gruppe C"
  ]
}
```

### CSS-Anpassungen
Für individuelle Styling-Anpassungen:

```css
/* Unternehmens-Farben überschreiben */
:root {
  --primary-color: #your-brand-color;
  --secondary-color: #your-accent-color;
  --success-color: #your-success-color;
}

/* Kategorie-spezifische Farben */
.category-suppe { background-color: var(--suppe-color, #ffeaa7); }
.category-menu1 { background-color: var(--menu1-color, #74b9ff); }
.category-menu2 { background-color: var(--menu2-color, #55a3ff); }
.category-dessert { background-color: var(--dessert-color, #fd79a8); }
```

## Anwendungsbeispiele

### Beispiel 1: Grundlegende Menüplan-Anzeige
```javascript
// Initialisierung für einfache Menüplan-Anzeige
import { initMenuePortal } from './js/script.js';

// Automatische Initialisierung bei DOM-Load
document.addEventListener('DOMContentLoaded', initMenuePortal);
```

### Beispiel 2: Bewertung programmtisch öffnen
```javascript
// Bewertungs-Modal für spezifische Kategorie öffnen
import { openBewertungModal } from './js/module/bewertung-modal.js';

const tag = 'montag';
const kategorie = 'menu1';
const rezepte = ['Schnitzel mit Pommes', 'Kartoffeln'];
const datum = new Date('2025-01-13');

openBewertungModal(tag, kategorie, rezepte, datum);
```

### Beispiel 3: Bestellungen verwalten
```javascript
// Bestellungen aus anderem Modul heraus laden
import { 
    loadBestellungenFromStorage,
    exportBestellungen,
    validateBestellungen 
} from './js/module/bestellung-handler.js';

// Bestellungen laden
loadBestellungenFromStorage();

// Validierung durchführen
const woche = '2025-26';
const validationResult = validateBestellungen(woche);
if (!validationResult.isValid) {
    console.warn('Bestellungen haben Probleme:', validationResult.issues);
}

// Export durchführen
const csvData = exportBestellungen(woche);
```

### Beispiel 4: Custom Event-Handler
```javascript
// Auf Layout-Änderungen reagieren
window.addEventListener('menue-portal:layout-change', () => {
    console.log('Layout hat sich geändert - UI anpassen');
    // Custom Logic hier...
});

// Auf Einrichtungs-Wechsel reagieren
window.addEventListener('menue-portal:einrichtung-changed', (event) => {
    const { newEinrichtung, oldEinrichtung } = event.detail;
    console.log(`Wechsel von ${oldEinrichtung?.name} zu ${newEinrichtung.name}`);
});
```

## Testing

### Manuelle Tests
1. **Responsive Design**:
   - Desktop → Mobile → Tablet Wechsel
   - Accordion vs. Grid Layout
   - Touch-Gesten auf Mobile

2. **Funktionalitätstests**:
   - Wochennavigation (vor/zurück/heute)
   - Einrichtungs-Wechsel
   - Bewertungs-Modal (alle Felder)
   - Bestellfunktionalität (Eingabe, Berechnung, Export)

3. **Fehlerbehandlung**:
   - Netzwerk offline
   - Invalid API-Responses
   - Ungültige Eingaben

### Automatisierte Tests (Geplant)
```javascript
// Jest/Vitest Test-Beispiele
describe('Menue Portal', () => {
    test('sollte Menüplan korrekt laden', async () => {
        const result = await loadMenuplan('einrichtung-123', 2025, 26);
        expect(result.success).toBe(true);
        expect(result.menuplan.days).toBeDefined();
    });
    
    test('sollte Bewertung validieren', () => {
        const bewertung = {
            geschmack: 5,
            optik: 4,
            verbesserungsvorschlag: "Zu kurz"
        };
        const result = validateBewertungData(bewertung);
        expect(result.isValid).toBe(false);
    });
});
```

## Troubleshooting

### Häufige Probleme

#### Problem: "Loading-Spinner dreht sich endlos"
**Ursachen:**
- Backend-API nicht erreichbar
- JWT-Token abgelaufen
- Netzwerkfehler

**Lösungen:**
```javascript
// Debug-Console öffnen und prüfen:
console.log('User Token:', localStorage.getItem('authToken'));
console.log('Current State:', window.menuePortalDebug?.getState());

// Token manuell erneuern:
localStorage.removeItem('authToken');
location.href = '/frontend/core/login/';
```

#### Problem: "Bewertungs-Modal öffnet sich nicht"
**Ursachen:**
- Zeitbegrenzung (>10 Tage)
- Bereits bewertet
- Berechtigung fehlt

**Lösungen:**
```javascript
// Bewertbarkeit prüfen:
import { istDatumBewertbar } from './js/module/bewertung-api.js';
const datum = new Date('2025-01-13');
console.log('Bewertbar:', istDatumBewertbar(datum));
```

#### Problem: "Bestellungen werden nicht gespeichert"
**Ursachen:**
- LocalStorage voll
- Browser-Einstellungen
- JavaScript-Fehler

**Lösungen:**
```javascript
// LocalStorage prüfen:
console.log('Storage verfügbar:', typeof(Storage) !== "undefined");
console.log('Gespeicherte Bestellungen:', localStorage.getItem('menue-portal-bestellungen'));

// Storage leeren:
localStorage.removeItem('menue-portal-bestellungen');
```

#### Problem: "Mobile-Layout funktioniert nicht richtig"
**Ursachen:**
- CSS nicht geladen
- Bootstrap nicht verfügbar
- Viewport-Meta-Tag fehlt

**Lösungen:**
```html
<!-- index.html prüfen: -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- CSS-Imports prüfen: -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
```

### Debug-Tools

#### Browser DevTools
```javascript
// Console-Commands für Debugging
window.menuePortalDebug.getState();           // Aktueller Zustand
window.menuePortalDebug.showToast('Test');    // Toast testen
window.menuePortalDebug.reloadModules();      // Module neu laden
```

#### Network-Monitoring
```javascript
// API-Calls überwachen
window.addEventListener('beforeunload', () => {
    console.log('Offene Requests:', window.activeRequests || 0);
});
```

#### Performance-Monitoring
```javascript
// Ladezeiten messen
console.time('Menueplan-Load');
await loadMenuplan(einrichtungId, year, week);
console.timeEnd('Menueplan-Load');
```

## Performance-Metriken

### Zielwerte
- **Initial Load**: < 2 Sekunden
- **Menüplan-Wechsel**: < 500ms
- **Modal-Öffnung**: < 200ms
- **Responsive Switch**: < 100ms

### Monitoring
```javascript
// Performance-API nutzen
const performanceEntries = performance.getEntriesByType('navigation');
console.log('Load Time:', performanceEntries[0].loadEventEnd - performanceEntries[0].loadEventStart);

// Memory Usage (Chrome)
if (performance.memory) {
    console.log('Memory Usage:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB'
    });
}
```

## Deployment

### Produktions-Bereitstellung

#### Build-Process
```bash
# CSS minimieren
npm run build:css

# JavaScript bundling (falls verwendt)
npm run build:js

# Assets optimieren
npm run optimize:images
```

#### nginx-Konfiguration
```nginx
# Caching für statische Assets
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Gzip-Komprimierung
gzip on;
gzip_types text/css application/javascript application/json;
```

#### CDN-Integration
```html
<!-- Production: CDN verwenden -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- Development: Lokale Dateien -->
<link href="/assets/css/bootstrap.min.css" rel="stylesheet">
```

### Browser-Kompatibilität

#### Unterstützte Browser
- **Chrome**: 90+ ✅
- **Firefox**: 88+ ✅  
- **Safari**: 14+ ✅
- **Edge**: 90+ ✅
- **iOS Safari**: 14+ ✅
- **Chrome Mobile**: 90+ ✅

#### Polyfills (falls benötigt)
```javascript
// Für ältere Browser
if (!window.fetch) {
    import('unfetch').then(({ default: fetch }) => {
        window.fetch = fetch;
    });
}
```

## Roadmap

### Version 1.1.0 (Q2 2025)
- 🔄 **Offline-Mode**: Service Worker für Offline-Nutzung
- 🔄 **Push-Notifications**: Bei Menüplan-Änderungen
- 🔄 **Erweiterte Filter**: Nach Allergenen, Nährstoffen
- 🔄 **Favoriten-System**: Benutzer-spezifische Markierungen

### Version 1.2.0 (Q3 2025)
- 🔄 **Analytics-Dashboard**: Bewertungs-Auswertungen
- 🔄 **Template-System**: Wiederkehrende Bestellmuster
- 🔄 **Multi-Language**: Deutsch/Englisch Support
- 🔄 **Dark-Mode**: Alternative Farbschemas

### Version 2.0.0 (Q4 2025)
- 🔄 **Progressive Web App**: Vollständige PWA-Integration
- 🔄 **Real-time Updates**: WebSocket-basierte Live-Updates
- 🔄 **AI-Integration**: Automatische Verbesserungsvorschläge
- 🔄 **Mobile Apps**: Native iOS/Android Apps

---

## Changelog

### Version 1.0.0 (Aktuell) - 2025-01-01
- ✅ Grundlegende Menüplan-Anzeige
- ✅ Multi-Einrichtungs-Support
- ✅ Responsive Mobile/Desktop-Layout
- ✅ Wochennavigation
- ✅ Benutzer-Authentifizierung
- ✅ **NEU**: Bewertungssystem mit Modal
- ✅ **NEU**: Bestellfunktionalität für externe Einrichtungen
- ✅ **NEU**: Modulare Handler-Architektur
- ✅ **NEU**: LocalStorage-Persistierung
- ✅ **NEU**: CSV-Export für Bestellungen
- ✅ **NEU**: Erweiterte Fehlerbehandlung
- ✅ **NEU**: Debug-Modus für Development

### Version 0.9.0 - 2024-12-15
- ✅ Erste Implementierung der Grundfunktionen
- ✅ API-Integration
- ✅ Responsive Design
- ✅ Drucken/PDF-Export

---

## Support & Kontakt

### Entwickler-Team
- **Frontend**: SmartWorkArt Development Team
- **Backend**: SmartWorkArt API Team
- **Design**: UX/UI Team

### Dokumentation
- **Hauptdokumentation**: `Menue-Portal.md` (diese Datei)
- **API-Vertrag**: `Menue-Portal-Anbindung.md`
- **Modulare Entwicklung**: `shared/docs/MODULARE-ENTWICKLUNG.md`

### Issue-Tracking
- **Bug Reports**: GitHub Issues
- **Feature Requests**: GitHub Discussions
- **Security Issues**: security@smartworkart.de

---

*Dokumentation erstellt: 2025-01-01*  
*Letzte Aktualisierung: 2025-01-01* 
*Version: 1.0.0* 

### 🎯 **Intelligente Kategorien-Darstellung**
- **Einrichtungsspezifische Kategorien**: Kindergarten/Schule sehen "Hauptspeise" statt Menü 1/2
- **Zuweisungsbasierte Anzeige**: Nur zugewiesene Kategorien werden angezeigt
- **Desktop-Konsistenz**: Alle Standard-Kategorien für einheitliche Tabellen-Optik
- **Mobile-Optimierung**: Nur gefüllte Kategorien im Accordion
- **Platzhalter-System**: "Noch nicht gewählt" vs. leere Karten je nach Zuweisung
- **Stammdaten-Reihenfolge**: Kategorien in der Reihenfolge der Menüplan-Stammdaten

### 📋 **Kategorien-Logik**

#### **Standard-Reihenfolge** (aus `shared/data/menueplaene/stammdaten.json`)
1. **Suppe** 🍲
2. **Menü 1** 🍽️ / **Hauptspeise** 🍽️ (Kindergarten/Schule)  
3. **Menü 2** 🥘 (nur andere Einrichtungen)
4. **Dessert** 🍰

#### **Anzeige-Verhalten**

| Situation | Desktop | Mobile |
|-----------|---------|--------|
| **Zugewiesen & gefüllt** | Rezepte anzeigen | Rezepte anzeigen |
| **Zugewiesen & leer** | "Noch nicht gewählt" | "Noch nicht gewählt" |
| **Nicht zugewiesen** | Leere Karte "-" | Nicht anzeigen |

#### **Einrichtungstypen**

**Kindergarten/Schule:**
- Sehen **Hauptspeise** (kombiniert Menü 1 + Menü 2)
- Grund: Koch entscheidet welches Menü, nicht die Einrichtung
- Kategorien: Suppe → Hauptspeise → Dessert

**Andere externe Einrichtungen:**
- Sehen **Menü 1** und **Menü 2** separat
- Können zwischen den Menüs wählen
- Kategorien: Suppe → Menü 1 → Menü 2 → Dessert

**Interne Einrichtungen:**
- Sehen alle verfügbaren Kategorien
- Vollzugriff auf das gesamte Menüsystem