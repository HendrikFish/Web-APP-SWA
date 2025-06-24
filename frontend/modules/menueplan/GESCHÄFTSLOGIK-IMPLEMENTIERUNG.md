# Menüplan - Geschäftslogik Implementierung

Diese Datei dokumentiert, wie die in [`GESCHÄFTSLOGIK.md`](./GESCHÄFTSLOGIK.md) definierten Regeln im Code umgesetzt wurden.

## 1. Menüpläne als historische Snapshots

### **Regel:**
> Ein gespeicherter Menüplan ist ein in sich geschlossenes Dokument. Beim Speichern wird eine Kopie der zu diesem Zeitpunkt gültigen "Anrechte" direkt in die Plandatei geschrieben.

### **Implementierung:**

#### **A) Snapshot-Erstellung beim Speichern**
**Dateien:** `menueplan-state.js`, `menueplan-controls.js`

Sowohl beim automatischen als auch beim manuellen Speichern wird ein Einrichtungs-Snapshot erstellt:

```javascript
// GESCHÄFTSLOGIK: Snapshot der Einrichtungs-Anrechte hinzufügen
const planWithSnapshot = {
    ...plan,
    einrichtungsSnapshot: createEinrichtungsSnapshot()
};

await api.saveMenueplan(year, week, planWithSnapshot);
```

#### **B) Snapshot-Struktur**
Der Snapshot enthält:
- **`einrichtungen[]`**: Komplette Kopie aller Einrichtungs-Stammdaten
- **`generatedAt`**: Zeitstempel der Snapshot-Erstellung  
- **`categories[]`**: Die zu diesem Zeitpunkt gültigen Mahlzeiten-Kategorien
- **`snapshotMetadata`**: Zusätzliche Informationen für Nachvollziehbarkeit

#### **C) Verwendung historischer Snapshots**
**Datei:** `menueplan-grid.js`

Beim Laden eines Plans wird geprüft, ob ein Snapshot vorhanden ist:

```javascript
// GESCHÄFTSLOGIK: Historische Genauigkeit - verwende Snapshot falls vorhanden
let aktuelleEinrichtungen = einrichtungen;
if (currentPlan?.einrichtungsSnapshot?.einrichtungen) {
    console.log('Verwende historischen Einrichtungs-Snapshot für Menüplan');
    aktuelleEinrichtungen = currentPlan.einrichtungsSnapshot.einrichtungen;
}
```

**➜ Ergebnis:** Alte Menüpläne zeigen immer die korrekten, historischen Einrichtungs-Zuweisungen an, unabhängig von späteren Änderungen an den Stammdaten.

---

## 2. Sonderbehandlung 'Interner' Einrichtungen

### **Regel:**
> Einrichtungen mit `"isIntern": true` erhalten den vollen Speiseplan, einschließlich aller zusätzlichen Kategorien für das Abendessen.

### **Implementierung:**
**Datei:** `menueplan-grid.js` (Funktion `getAnforderungsmatrix`)

```javascript
// GESCHÄFTSLOGIK: Sonderbehandlung für interne Einrichtungen
// Interne Einrichtungen erhalten ALLE Mahlzeiten-Kategorien
if (e.isIntern === true) {
    stammdaten.kategorien.forEach(kat => {
        if (matrix[tag][kat.id]) {
            matrix[tag][kat.id].push({ 
                id: e.id, 
                kuerzel: e.kuerzel, 
                name: e.name,
                isIntern: true 
            });
        }
    });
    return; // Keine weitere Verarbeitung für interne Einrichtungen
}
```

**➜ Ergebnis:** Interne Einrichtungen erscheinen automatisch bei allen Mahlzeiten-Kategorien, ohne dass spezifische Speiseplan-Konfigurationen nötig sind.

---

## 3. Datenintegrität und Konsistenz

### **Validierung der Geschäftsregeln:**

#### **Snapshot-Validierung**
- ✅ Jeder gespeicherte Plan enthält einen Einrichtungs-Snapshot
- ✅ Historische Pläne verwenden niemals aktuelle Stammdaten
- ✅ Snapshot-Metadaten ermöglichen Nachvollziehbarkeit

#### **Interne Einrichtungen**
- ✅ `isIntern: true` Einrichtungen erhalten alle Kategorien
- ✅ Normale Speiseplan-Regeln werden für interne Einrichtungen ignoriert
- ✅ Markierung in der Matrix (`isIntern: true`) für UI-Differenzierung

---

## 4. Auswirkungen auf andere Module

### **Bestellungsmodul (zukünftig)**
Das Bestellungsmodul kann sich auf die Snapshot-Daten verlassen:
```javascript
// Beispiel: Bestellung basierend auf historischem Plan
const plan = await loadMenueplan(year, week);
const einrichtungen = plan.einrichtungsSnapshot.einrichtungen; // ✅ Korrekte historische Daten
```

### **Kalkulationsmodul (zukünftig)**
Kostenberechnungen basieren auf unveränderlichen Daten:
```javascript
// Beispiel: Kalkulation mit historischen Anrechten
plan.einrichtungsSnapshot.einrichtungen.forEach(einrichtung => {
    if (einrichtung.isIntern) {
        // Vollverpflegung berechnen
    } else {
        // Einzelne Mahlzeiten basierend auf Speiseplan
    }
});
```

---

## 5. Monitoring und Debugging

### **Console-Ausgaben**
- "Verwende historischen Einrichtungs-Snapshot für Menüplan" → Plan verwendet Snapshot-Daten
- Keine Ausgabe → Plan verwendet aktuelle Stammdaten (neuer Plan)

### **Datenstrukturen prüfen**
```javascript
// Im Browser-Entwicklertools
console.log(currentPlan.einrichtungsSnapshot); // Snapshot-Daten anzeigen
```

---

## 6. Kritische Sicherheitshinweise

### **⚠️ NIEMALS:**
- Einen gespeicherten Plan mit aktuellen Stammdaten "mischen"
- Den `einrichtungsSnapshot` eines gespeicherten Plans ändern
- Historische Einrichtungs-Zuweisungen nachträglich "korrigieren"

### **✅ IMMER:**
- Bei Änderungen an Einrichtungs-Stammdaten neue Pläne erstellen
- Snapshot-Daten als "unveränderliche Wahrheit" behandeln
- Bei Fehlern in historischen Daten: Dokumentation korrigieren, nicht Daten

---

---

## 7. Auto-Save System

### **Implementierung (menueplan-state.js)**
```javascript
const debouncedSave = debounce(async () => {
    // GESCHÄFTSLOGIK: Snapshot-Integration bei Auto-Save
    const planWithSnapshot = {
        ...state.currentPlan,
        einrichtungsSnapshot: createEinrichtungsSnapshot()
    };
    await api.saveMenueplan(state.currentYear, state.currentWeek, planWithSnapshot);
}, 1500); // 1,5 Sekunden Debouncing
```

**Features:**
- **Trigger:** Jede Plan-Änderung (Rezept hinzufügen/entfernen, Zuweisung ändern)
- **Debouncing:** 1,5 Sekunden Verzögerung verhindert excessive API-Calls
- **Visual Feedback:** Auto-Save-Indikator mit Icons und Statustext
- **Toast-Integration:** Erfolgs- und Fehlermeldungen
- **Snapshot-Integration:** Automatische Einrichtungs-Snapshots

### **Auto-Save Indikator (UI)**
```html
<div class="autosave-indicator" id="autosave-indicator">
    <i class="bi bi-check-circle text-success"></i>
    <span class="autosave-text">Gespeichert</span>
</div>
```

**Status-Anzeigen:**
- 🔄 "Speichert..." (mit Spinner)
- ✅ "Gespeichert" (grünes Häkchen)
- ❌ "Speicherfehler" (rotes X)

---

## 8. Plan-Verwaltungs-Funktionen

### **Plan leeren (clearCurrentPlan)**
```javascript
export function clearCurrentPlan() {
    const { days } = state.currentPlan;
    wochentage.forEach(tag => {
        if (days[tag]) {
            // Alle Mahlzeiten-Kategorien leeren
            Object.keys(days[tag].Mahlzeiten).forEach(kategorie => {
                days[tag].Mahlzeiten[kategorie] = [];
            });
            // Alle Einrichtungs-Zuweisungen leeren
            days[tag].Zuweisungen = {};
        }
    });
    state.onStateChange(); // Auto-Save auslösen
}
```

### **7-Wochen-Vorlage laden (loadTemplateFrom7WeeksAgo)**
```javascript
export async function loadTemplateFrom7WeeksAgo() {
    const { currentYear, currentWeek } = state;
    const { year: templateYear, week: templateWeek } = 
        calculateWeeksAgo(currentYear, currentWeek, 7);
    
    const templatePlan = await api.getMenueplan(templateYear, templateWeek);
    
    // Template-Struktur in aktuellen Plan übernehmen
    copyPlanStructure(templatePlan, state.currentPlan);
    state.onStateChange(); // Auto-Save auslösen
}
```

**Sicherheit & UX:**
- **Confirmation-Modals** vor Löschung/Template-Laden
- **Toast-Feedback** bei Erfolg/Fehler
- **Auto-Save-Integration** für sofortige Persistierung

---

## 9. Erweiterte Drag & Drop Funktionalität

### **Rezept-Drag (menueplan-dragdrop.js)**
- **Quelle:** Suchvorschläge oder bestehende Grid-Zellen
- **Ziel:** Gültige Drop-Zonen im Grid
- **Validierung:** Keine Duplikate in derselben Kategorie am selben Tag

### **Zellen-Drag (Cell-to-Cell)**
```javascript
function handleCellDrag(sourceData, targetData) {
    // Vollständiger Zell-Tausch: alle Rezepte + Zuweisungen
    const sourceContent = getFullCellContent(sourceData);
    const targetContent = getFullCellContent(targetData);
    
    // Inhalte komplett tauschen
    setCellContent(targetData, sourceContent);
    setCellContent(sourceData, targetContent);
}
```

### **Touch-Device Support**
- **Polyfill:** `drag-drop-touch` für mobile Geräte
- **Responsive:** Grid scrollt horizontal auf mobilen Geräten
- **Sticky Headers:** Kategorie-Spalte bleibt sichtbar

---

## 10. Rezept-Suche und UX-Optimierungen

### **Kompakte Pills-Darstellung**
```javascript
// Horizontale Badge-Darstellung statt vertikaler Liste
suggestions.forEach(rezept => {
    const pill = createElement('span', {
        className: 'badge bg-primary me-2 mb-2 cursor-pointer'
    });
    suggestionsContainer.appendChild(pill);
});
```

### **Click-Away Handler**
```javascript
document.addEventListener('click', (event) => {
    if (!searchContainer.contains(event.target)) {
        closeSuggestions(); // Automatisches Schließen
    }
});
```

**Performance-Optimierungen:**
- **Maximal 2 Vorschläge** für bessere UX
- **Smooth Transitions** mit CSS-Animationen
- **Debounced Search** verhindert excessive API-Calls

---

## 11. Mobile-First Design & Touch-Optimierung

### **Responsive Layout-Switching**
**Datei:** `menueplan-grid.js`

```javascript
function renderGrid() {
    if (window.innerWidth <= 768) {
        renderMobileAccordion(); // Accordion für Mobile
    } else {
        renderDesktopGrid(); // CSS-Grid für Desktop
    }
}

// Window Resize Handler für dynamisches Layout-Switching
window.addEventListener('resize', debounce(() => {
    renderGrid();
}, 300));
```

### **Mobile Accordion-Layout**
**Implementierung:** Wochentage als expandierbare Karten statt statisches Grid

```javascript
function renderMobileAccordion() {
    const mobileContainer = document.createElement('div');
    mobileContainer.className = 'mobile-accordion';
    
    wochentage.forEach(tag => {
        const daySection = createDayAccordionSection(tag);
        mobileContainer.appendChild(daySection);
    });
    
    // Auto-Expand: Heutiger Tag öffnet sich automatisch
    const heute = getCurrentDayName();
    expandDaySection(heute);
}
```

### **Sticky Controls für optimale Touch-UX**
**CSS-Implementierung:**

```css
.menueplan-controls {
    position: sticky;
    top: 0; /* Direkt unter Navbar durch body padding-top: 70px */
    left: 0;
    right: 0;
    z-index: 1020;
    background-color: #f8f9fa;
}
```

**Vorteile:**
- ✅ **Navigation immer erreichbar** (Vor/Zurück/Heute-Buttons)
- ✅ **Rezept-Suche permanent verfügbar** (horizontale Pills)
- ✅ **Touch-Drag ohne Scrollen** (alle Zielkategorien sichtbar)

### **Native Touch-Events (ohne Polyfill)**
**Datei:** `menueplan-dragdrop.js`

```javascript
// Touch-Event-Handler für optimierte Mobile-UX
function initTouchSupport() {
    ['touchstart', 'touchmove', 'touchend'].forEach(eventType => {
        document.addEventListener(eventType, handleTouchEvent, { passive: false });
    });
}

function handleTouchEvent(event) {
    const touch = event.touches[0] || event.changedTouches[0];
    
    switch(event.type) {
        case 'touchstart':
            handleTouchStart(touch, event.target);
            break;
        case 'touchmove':
            event.preventDefault(); // Verhindert Scrolling während Drag
            handleTouchMove(touch);
            break;
        case 'touchend':
            handleTouchEnd(touch);
            break;
    }
}
```

### **Visual Touch-Feedback**
**CSS-Klassen für Touch-Zustände:**

```css
/* Alle Drop-Zonen werden beim Touch-Start markiert */
.touch-drop-zone-highlight {
    border: 2px dashed #007bff !important;
    background-color: rgba(0, 123, 255, 0.1) !important;
}

/* Aktive Drop-Zone unter dem Finger */
.touch-drop-zone-active {
    border: 2px solid #28a745 !important;
    background-color: rgba(40, 167, 69, 0.2) !important;
}

/* Ungültige Drop-Zone (Duplikat) */
.touch-drop-zone-invalid {
    border: 2px solid #dc3545 !important;
    background-color: rgba(220, 53, 69, 0.2) !important;
}
```

### **Touch-Workflow**
1. **Touch-Start:** Rezept antippen → Alle Drop-Zonen werden blau markiert
2. **Touch-Move:** Finger bewegen → Live-Validierung mit grün/rot Feedback
3. **Touch-End:** Loslassen → Rezept wird verschoben + Toast-Benachrichtigung

### **Kategorie-Icons für bessere Orientierung**
**Mobile-spezifische Emoji-Icons:**

```javascript
const kategorieIcons = {
    'suppe': '🍲',
    'menu1': '🍽️', 
    'menu2': '🥘',
    'dessert': '🍰',
    'abend-suppe': '🍴',
    'milchspeise': '🍴',
    // ... weitere Kategorien
};
```

### **Optimierte Mobile-UX-Features**
- **Auto-Expand:** Heutiger Tag öffnet sich automatisch beim Laden
- **Rezept-Counter:** Dynamische Anzeige der Rezept-Anzahl pro Tag
- **Kompakte Drop-Zonen:** Touch-optimierte Größen und Abstände
- **Horizontal Scroll:** Rezept-Suche als horizontale Pills-Liste
- **Touch-Action:** `touch-action: none` für präzise Drag-Kontrolle

### **4. **Zone-Drag in Mobile (Mehrere Rezepte verschieben)**

**Problem:** In der mobilen Ansicht konnten nur einzelne Rezepte verschoben werden. Nutzer benötigten eine Möglichkeit, komplette Drop-Zonen mit mehreren Rezepten zu verschieben.

**Lösung:** Zone-Drag-Handles für Mobile-Layout

#### **HTML-Template Erweiterung:**
```javascript
// frontend/modules/menueplan/js/module/menueplan-grid.js
categoryRow.innerHTML = `
    <div class="mobile-category-title">
        <span>
            <span class="mobile-category-icon">${icon}</span>
            ${kategorie.name}
        </span>
        <div class="mobile-zone-drag-handle" data-tag="${tag}" data-kategorie="${kategorie.id}" 
             title="Alle Rezepte dieser Kategorie verschieben">
            <i class="bi bi-grip-horizontal"></i>
        </div>
    </div>
    <div class="mobile-drop-zone" data-tag="${tag}" data-kategorie="${kategorie.id}">
        <div class="mobile-drop-zone-placeholder">Rezept hier hinzufügen</div>
    </div>
`;
```

#### **CSS-Styling:**
```css
/* frontend/modules/menueplan/css/style.css */
.mobile-zone-drag-handle {
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 0.9rem;
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
    transition: all 0.2s ease;
    min-width: 30px;
    height: 26px;
}

.mobile-zone-drag-handle:hover {
    background: #5a6268;
    transform: scale(1.05);
}

.mobile-zone-drag-handle.zone-dragging {
    background: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}
```

#### **Touch-Event Handler Erweiterung:**
```javascript
// frontend/modules/menueplan/js/module/menueplan-dragdrop.js
function handleTouchStart(e) {
    // Prüfe ob es ein Zone-Drag-Handle ist
    const zoneDragHandle = e.target.closest('.mobile-zone-drag-handle');
    
    if (zoneDragHandle) {
        const { tag, kategorie } = zoneDragHandle.dataset;
        const { currentPlan } = getState();
        
        const recipes = currentPlan.days?.[tag]?.Mahlzeiten?.[kategorie] || [];
        if (recipes.length === 0) return; // Keine Rezepte zum Verschieben
        
        touchDragData = {
            type: 'zone',
            recipes: recipes,
            sourceTag: tag,
            sourceKategorie: kategorie
        };
        
        // Visuelles Feedback
        zoneDragHandle.classList.add('zone-dragging');
        const categoryRow = zoneDragHandle.closest('.mobile-category-row');
        if (categoryRow) {
            categoryRow.style.opacity = '0.7';
            categoryRow.style.transform = 'scale(0.98)';
        }
        return;
    }
    // ... bestehende Rezept-Drag-Logik
}
```

#### **Touch-Move Validierung:**
```javascript
function handleTouchMove(e) {
    // Validierung je nach Drag-Typ
    if (touchDragData.type === 'zone') {
        // Zone-Drag: Prüfe ob Ziel-Zone nicht die Quelle ist
        if (tag === touchDragData.sourceTag && kategorie === touchDragData.sourceKategorie) {
            dropZone.classList.add('touch-drop-zone-invalid');
        } else {
            dropZone.classList.add('touch-drop-zone-active');
            touchDropZoneElement = dropZone;
        }
    } else if (touchDragData.type === 'rezept') {
        // Rezept-Drag: Prüfe auf Duplikate (bestehende Logik)
    }
}
```

#### **Touch-End Ausführung:**
```javascript
function handleTouchEnd(e) {
    if (touchDropZoneElement && touchDragData.type === 'zone') {
        // Zone-Drag: Alle Rezepte verschieben
        const { sourceTag, sourceKategorie } = touchDragData;
        updatePlanWithDraggedZone(tag, kategorie, sourceTag, sourceKategorie);
        
        // Toast-Feedback mit Anzahl
        const anzahlRezepte = touchDragData.recipes.length;
        showToast(`${anzahlRezepte} Rezept${anzahlRezepte > 1 ? 'e' : ''} verschoben`, 'success');
    }
    // ... Cleanup
}
```

#### **Geschäftslogik (State-Management):**
```javascript
// frontend/modules/menueplan/js/module/menueplan-state.js
export function updatePlanWithDraggedZone(targetTag, targetKategorie, sourceTag, sourceKategorie) {
    if (!state.currentPlan?.days || (targetTag === sourceTag && targetKategorie === sourceKategorie)) {
        return; // Guard Clause & gleiches Ziel wie Quelle
    }
    
    const { days } = state.currentPlan;
    const sourceList = days[sourceTag]?.Mahlzeiten?.[sourceKategorie];
    const targetList = days[targetTag]?.Mahlzeiten?.[targetKategorie];
    
    if (!sourceList || !targetList) return;
    
    // LOGIK: Inhalte austauschen (Swap)
    const temp = [...targetList];
    days[targetTag].Mahlzeiten[targetKategorie] = [...sourceList];
    days[sourceTag].Mahlzeiten[sourceKategorie] = temp;
    
    state.onStateChange(); // Triggers Auto-Save & UI-Update
}
```

### **Zone-Drag Features:**

1. **Visueller Handle:** Grip-Icon rechts vom Kategorie-Titel
2. **Touch-Feedback:** Grauer Handle wird blau beim Dragging
3. **Category-Row Highlighting:** Ganze Kategorie-Zeile wird transparent
4. **Swap-Logik:** Vollständiger Inhaltswechsel zwischen Zonen
5. **Toast-Feedback:** "X Rezepte verschoben" mit korrekter Pluralisierung
6. **Validierung:** Verhindert Drop auf die gleiche Quelle
7. **Empty-Check:** Handle ist nur aktiv wenn Rezepte vorhanden

### **Workflow für Zone-Drag:**
1. **Touch-Start:** Zone-Handle antippen (nur bei >0 Rezepten)
2. **Visual-Feedback:** Handle blau + Category-Row transparent
3. **Touch-Move:** Alle Drop-Zonen markiert, Live-Validierung
4. **Touch-End:** Kompletter Inhaltswechsel + Toast-Bestätigung

**Resultat:** Nutzer können in der mobilen Ansicht sowohl einzelne Rezepte als auch komplette Kategorien (mit mehreren Rezepten) effizient verschieben.

Diese umfassende Mobile-First-Implementierung gewährleistet eine moderne, benutzerfreundliche und geschäftslogik-konforme Menüplanung mit robustem Auto-Save-System und optimaler User Experience auf allen Geräten. 