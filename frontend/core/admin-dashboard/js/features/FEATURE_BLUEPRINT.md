# Blueprint: Neues Feature im Admin-Dashboard

> **🛡️ WICHTIG: Sichere Entwicklung ZUERST!**
> Bevor Sie ein neues Feature entwickeln, lesen Sie unbedingt:
> 📖 **`shared/docs/MODULARE-ENTWICKLUNG.md`** - Vollständige Anleitung für sichere, modulare Entwicklung
> 
> **Alle neuen Features MÜSSEN das Sicherheitssystem verwenden:**
> - ✅ Error-Boundary für Feature-Isolation
> - ✅ Einheitlichen API-Client für Backend-Kommunikation
> - ✅ Template aus `shared/templates/module-template.js`

Dieses Dokument beschreibt den "Contract-First" Prozess zur Erstellung eines neuen, robusten Features innerhalb des Admin-Dashboards. Dieser Prozess ist darauf ausgelegt, häufige Fehler wie Race Conditions und Schnittstellen-Konflikte von vornherein zu vermeiden.

Jedes neue Feature muss diesen 4 Schritten folgen.

---

### Schritt 1: Der Vertrag (Die API- & UI-Definition)

*Bevor wir Implementierungs-Code schreiben, definieren wir die öffentlichen Schnittstellen (den "Vertrag").*

**1. API-Vertrag (`[feature-name]-api.js`):**
Erstelle die Datei und definiere alle zu exportierenden Funktionen als leere Stubs mit JSDoc.

*Beispiel für `inventory-api.js`:*
```javascript
/**
 * Holt alle Inventar-Gegenstände vom Server.
 * @returns {Promise<Array<object>>} Eine Liste von Gegenständen.
 */
export async function getInventoryItems() { /* Implementierung in Schritt 3 */ }

/**
 * Aktualisiert einen Gegenstand.
 * @param {string} itemId - Die ID des Gegenstands.
 * @param {object} data - Die neuen Daten.
 * @returns {Promise<object>} Der aktualisierte Gegenstand.
 */
export async function updateInventoryItem(itemId, data) { /* Implementierung in Schritt 3 */ }
```

**2. UI-Vertrag (`[feature-name]-ui.js`):**
Erstelle die Datei und definiere die exportierbaren UI-Rendering- und Interaktions-Funktionen.

*Beispiel für `inventory-ui.js`:*
```javascript
/**
 * Rendert die Inventar-Tabelle und das Bearbeiten-Modal.
 * @param {HTMLElement} container - Der Haupt-Container für das Feature.
 * @param {Array<object>} items - Die anzuzeigenden Inventar-Gegenstände.
 * @param {object} callbacks - Objekt mit Callback-Funktionen { onEdit, onDelete }.
 */
export function renderInventoryUI(container, items, callbacks) { /* Implementierung in Schritt 3 */ }

/**
 * Zeigt das Modal zum Bearbeiten eines Gegenstands an.
 * @param {object} item - Der zu bearbeitende Gegenstand.
 * @param {Function} onSave - Callback, der beim Speichern aufgerufen wird.
 */
export function showItemEditModal(item, onSave) { /* Implementierung in Schritt 3 */ }
```

---

### Schritt 2: Das Fundament (Die HTML-Struktur)

*Die grundlegende HTML-Struktur muss von Anfang an stabil und vollständig sein.*

**1. Haupt-Container in `script.js` erstellen:**
Erweitere die `handleNavigation`-Funktion in `script.js`, um den Wurzel-Container für das neue Feature zu erstellen.

```javascript
// in handleNavigation...
case 'inventory':
    featureContentEl.id = 'inventory-content'; // Eindeutige ID
    containerEl.appendChild(featureContentEl);
    await initializeInventoryFeature(featureContentEl); // Container wird übergeben
    break;
```

**2. Vollständiges HTML in der UI-Datei definieren:**
In der `render...`-Funktion (z.B. `renderInventoryUI`) wird das **gesamte** benötigte HTML (Tabelle, Modal, alle Divs) als ein großer Template-String in den Container eingefügt.

**Wichtig:** **Keine "Find or Create"-Logik mehr!** Wenn ein `<div id="dynamic-fields">` später gebraucht wird, muss es hier im Template definiert werden.

---

### Schritt 3: Die Implementierung (Getrennte Logik)

*Jetzt werden die in Schritt 1 definierten Verträge mit Leben gefüllt.*

**1. API-Implementierung:**
Fülle die Funktionen in `[feature-name]-api.js`. Diese Datei darf keine DOM-Abhängigkeiten haben.

**2. UI-Implementierung:**
Fülle die Funktionen in `[feature-name]-ui.js`. Du kannst dich darauf verlassen, dass alle HTML-Elemente aus dem in Schritt 2 erstellten Template existieren. Diese Datei füllt nur noch Daten ein und hängt Event-Listener an.

**3. Orchestrator-Implementierung (`script.js`):**
Erstelle die `initialize[FeatureName]Feature`-Funktion in `script.js`. Sie ist der Dirigent:
   - Ruft die API-Funktionen auf, um Daten zu holen.
   - Ruft die UI-Funktionen auf, um die Daten darzustellen.
   - Definiert die Callback-Funktionen, die die UI-Events (Klick auf "Löschen") mit den API-Aufrufen verbinden.

---

### Schritt 4: Die Überprüfung (Checkliste)

Bevor das Feature als "fertig" gilt, beantworte diese Fragen:

- [ ] **Vertrag:** Sind alle öffentlichen Funktionen in `api.js` und `ui.js` klar mit JSDoc dokumentiert?
- [ ] **Fundament:** Wird der Haupt-Container in `script.js` erstellt? Enthält das UI-Template in `ui.js` **alle** benötigten Kind-Elemente?
- [ ] **Timing:** Wird auf alle `async`-Funktionen (besonders API-Aufrufe) korrekt mit `await` gewartet, bevor ihre Ergebnisse verwendet werden?
- [ ] **Verantwortung:** Ist die Logik klar getrennt?
    - `api.js`: Nur Backend-Kommunikation.
    - `ui.js`: Nur DOM-Manipulation (keine API-Aufrufe).
    - `script.js`: Nur Orchestrierung (ruft API und UI auf, definiert Callbacks).
- [ ] **Abhängigkeiten:** Importiert die `api.js` irgendetwas aus der `ui.js` (oder umgekehrt)? Wenn ja, ist das ein Architekturfehler, der behoben werden muss. 