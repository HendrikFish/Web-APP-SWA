# Menüplan-Modul - Technische Übersicht

> **Status:** ✅ Produktionsreif | **Version:** 2.0 | **Letzte Aktualisierung:** Januar 2025

## 🏗️ Architektur-Übersicht

### **Blueprint-konforme Struktur:**
```
frontend/modules/menueplan/
├── index.html                    # Haupt-HTML-Template
├── css/style.css                 # Modul-spezifische Styles
├── js/
│   ├── script.js                 # 🎯 Haupteinstiegspunkt
│   └── module/
│       ├── menueplan-ui.js       # 🎭 Orchestrator
│       ├── menueplan-state.js    # 🧠 State-Management
│       ├── menueplan-controls.js # 🎮 Navigation & Aktionen
│       ├── menueplan-grid.js     # 🏗️ Layout & Rendering
│       ├── menueplan-dragdrop.js # 🎯 Drag & Drop
│       └── menueplan-api.js      # 🌐 Backend-Kommunikation
├── path/paths.js                 # 📁 Path-Abstraktionsschicht
└── *.md                          # 📖 Dokumentation
```

### **Verantwortlichkeiten:**
- **script.js**: Bootstrap-Integration, Initialisierung, Fehlerbehandlung
- **menueplan-ui.js**: Koordination, Stammdaten-Laden, Callback-Management
- **menueplan-state.js**: Zentraler State, Auto-Save, Geschäftslogik-Integration
- **menueplan-controls.js**: Wochennavigation, Plan-Aktionen (Leeren/Vorlage)
- **menueplan-grid.js**: CSS-Grid-Rendering, Einrichtungs-Buttons
- **menueplan-dragdrop.js**: Rezept-/Zellen-Drag, Touch-Support
- **menueplan-api.js**: HTTP-Kommunikation mit Backend

## 🔄 Datenfluss & State-Management

### **Initialisierung:**
```
DOMContentLoaded → Header laden → UI initialisieren → Stammdaten → Grid rendern
```

### **Zentraler State:**
```javascript
const state = {
    currentPlan: { year, week, days: {}, einrichtungsSnapshot },
    stammdaten: { kategorien, einrichtungen, rezepte },
    currentYear/Week: number,
    onStateChange: autoSaveCallback
};
```

### **Auto-Save-Flow:**
```
User-Aktion → State-Update → onStateChange() → Debounced-Save (1,5s) → API-Call
```

## 🎯 Kernfunktionen

### **✅ Implementiert & Getestet:**
- [x] **Wochenbasierte Navigation** (Vor/Zurück/Heute)
- [x] **CSS-Grid-Layout** (8 Spalten, responsive, sticky headers)
- [x] **Mobile Accordion-Layout** (Expandierbare Wochentage)
- [x] **Drag & Drop** (Rezepte, Zellen, native Touch-Events)
- [x] **Intelligente Suche** (Kompakte Pills, Click-away, Live-Filter)
- [x] **Einrichtungs-Zuweisungen** (Exklusive Menü-Buttons)
- [x] **Auto-Save** (Debounced, visueller Indikator, Toast-Feedback)
- [x] **Plan-Verwaltung** (Leeren, 7-Wochen-Vorlage)
- [x] **Geschäftslogik** (Historische Snapshots, interne Einrichtungen)
- [x] **Sticky Controls** (Navigation bleibt bei Touch-Drag sichtbar)

### **🔧 Technische Features:**
- [x] **Bootstrap-Integration** (CSS + Icons)
- [x] **Native Touch-Events** (ohne Polyfill für bessere Performance)
- [x] **Responsive Layout-Switching** (Desktop Grid ↔ Mobile Accordion)
- [x] **Sticky Controls** (`position: sticky` für optimale Touch-UX)
- [x] **Visual Touch-Feedback** (Blau/Grün/Rot Drop-Zone-Markierungen)
- [x] **Toast-Notifications** (4 Typen: success/error/warning/info)
- [x] **Confirmation-Modals** (für kritische Aktionen)
- [x] **Error-Handling** (Graceful Fallbacks)
- [x] **Mobile-First Design** (Accordion-Layout für Smartphones)

## 📊 Geschäftslogik-Integration

### **Snapshot-Prinzip:**
```javascript
// Beim Speichern: Aktuelle Stammdaten einfrieren
const planWithSnapshot = {
    ...currentPlan,
    einrichtungsSnapshot: createEinrichtungsSnapshot()
};

// Beim Laden: Historische Daten verwenden
const einrichtungen = plan.einrichtungsSnapshot?.einrichtungen || aktuelleEinrichtungen;
```

### **Interne Einrichtungen:**
```javascript
// isIntern: true → Erhalten ALLE Kategorien automatisch
if (einrichtung.isIntern === true) {
    stammdaten.kategorien.forEach(kategorie => {
        matrix[tag][kategorie.id].push(einrichtung);
    });
}
```

## 🛠️ Entwickler-Tools

### **Debug-Kommandos (Browser-Konsole):**
```javascript
// State inspizieren
console.log(getState());

// Plan-Struktur anzeigen
console.log(getCurrentPlan());

// Snapshot-Daten prüfen
console.log(getCurrentPlan().einrichtungsSnapshot);
```

### **Auto-Save-Status:**
```javascript
// Status manuell setzen
setAutoSaveStatus('saving' | 'success' | 'error');
```

## 🔧 Build & Dependencies

### **Externe Abhängigkeiten:**
- **Bootstrap 5**: CSS Framework + Icons
- **drag-drop-touch**: Mobile Drag & Drop Polyfill

### **Interne Komponenten:**
- **Header**: Benutzer-Navigation und Session-Management
- **Toast-Notifications**: Systemweite Benachrichtigungen
- **Confirmation-Modal**: Sicherheitsabfragen

### **Vite-Integration:**
```javascript
// Automatische CSS-Imports
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@shared/styles/layout.css';
import '../css/style.css';
```

## 📈 Performance-Optimierungen

### **Frontend:**
- **Debounced Auto-Save** (1,5s) verhindert excessive API-Calls
- **Lazy Grid-Rendering** nur für sichtbare Bereiche
- **Effiziente Drag-Validierung** mit frühen Returns
- **CSS-Grid** statt JavaScript-Layout für bessere Performance

### **Backend-Integration:**
- **JSON-Snapshots** für unveränderliche Historie
- **Path-Abstraktionsschicht** für flexible Datenquellen
- **Error-Boundaries** mit Fallback-UI

## 🧪 Testing-Strategie

### **Manual Testing Checklist:**
- [ ] Wochennavigation funktional
- [ ] Drag & Drop auf Desktop (CSS-Grid-Layout)
- [ ] Touch-Drag & Drop auf Mobile (Accordion-Layout)
- [ ] Controls bleiben beim Scrollen/Touch-Drag sichtbar
- [ ] Auto-Expand des heutigen Tags auf Mobile
- [ ] Kategorie-Icons in Mobile-Ansicht
- [ ] Auto-Save bei allen Änderungen
- [ ] Einrichtungs-Buttons toggle korrekt
- [ ] Plan leeren/Vorlage laden funktional
- [ ] Toast-Benachrichtigungen bei Aktionen
- [ ] Layout-Switching bei Bildschirmgrößen-Änderung (Desktop ↔ Mobile)

### **Regression Testing:**
- [ ] Bestehende Pläne laden korrekt
- [ ] Historische Snapshots werden verwendet
- [ ] Interne Einrichtungen erhalten alle Kategorien
- [ ] Keine Doppel-Zuweisungen bei Menüs

## 🚀 Deployment-Checklist

- [x] Blueprint-Konformität
- [x] Deutsche Kommentare im Code
- [x] Fehlerbehandlung implementiert
- [x] Auto-Save mit visuellem Feedback
- [x] Mobile-Optimierung
- [x] Geschäftslogik-Integration
- [x] Dokumentation aktualisiert

---

**🎉 Das Menüplan-Modul ist vollständig produktionsreif und entspricht allen Projekt-Standards!** 