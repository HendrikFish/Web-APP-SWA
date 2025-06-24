# Modul-Blueprint: Anleitung zur Erstellung neuer Frontend-Module

## Der optimierte Entwicklungsprozess (Strategisches Vorgehen)

Basierend auf den Lektionen aus der ersten Modulentwicklung wurde dieser Prozess entwickelt, um die Entwicklungszeit zu verkürzen und Fehlerkaskaden zu verhindern.

### Schritt 1: Der "Datenvertrag" (Analyse & Planung)
Bevor auch nur eine Zeile Code geschrieben wird, definieren wir exakt, welche Daten das Modul braucht und wie diese aussehen müssen. Wir schreiben quasi die Speisekarte, bevor die Küche anfängt zu kochen.
> *Beispiel: "Die Rezeptliste braucht ein Array von Rezept-Objekten. Jedes Objekt hat eine `id`, einen `titel` (String) und eine Liste von `zutaten` (Array von Objekten mit `name` und `menge`)."*

### Schritt 2: Backend-Entwicklung & Test (Die Küche vorbereiten)
Die KI entwickelt zuerst NUR das Backend und den "Kellner" (API-Endpunkt).
> *Entscheidend: Wir testen diesen Endpunkt sofort und prüfen, ob er die Daten exakt so liefert, wie im "Datenvertrag" festgelegt. Erst wenn die Küche perfektes Essen liefert, gehen wir weiter.*

### Schritt 3: Frontend-Entwicklung (Den Gastraum einrichten)
Jetzt entwickelt die KI das Frontend. Sie kann sich zu 100 % darauf verlassen, dass die Daten, die vom Kellner kommen, immer das korrekte Format haben. Das Risiko für datenbedingte Abstürze sinkt auf null.

### Schritt 4: Kontinuierliche Blueprint-Pflege (Den Bauplan aktuell halten)
Nach Abschluss jedes Moduls halten wir kurz inne und fragen: "Was haben wir gelernt?" Alle neuen, wichtigen Regeln werden sofort im `MODULE_BLUEPRINT.md` für die Nachwelt festgehalten.

---

Dieses Dokument ist eine verbindliche Schritt-für-Schritt-Anleitung für die Erstellung eines neuen Frontend-Moduls. Das strikte Befolgen dieses Blueprints ist entscheidend, um die Architektur, Stabilität und Wartbarkeit des gesamten Projekts zu gewährleisten.

## 1. Die Goldenen Regeln (Gelernt aus Fehlern)

1.  **Stabiles HTML-Fundament:** Die `index.html` definiert die **vollständige** Anwendungsstruktur mit **allen** Haupt-Containern (z.B. `<div id="user-list"></div>`, `<div id="user-details"></div>`). Das JavaScript darf diese Container **nur befüllen**, aber **niemals erstellen**. Das verhindert Timing-Fehler.
2.  **Klare Code-Trennung:** Auch innerhalb einer Datei müssen Verantwortlichkeiten klar getrennt sein. Halte dich an die logischen Blöcke: `API-Funktionen`, `UI-Funktionen` und `Orchestrator/Event-Listener`. Eine Funktion macht genau eine Sache.

## 2. Checkliste für die Modulerstellung

1.  **[ ] Ordnerstruktur anlegen:** Erstellen Sie die Standard-Ordnerstruktur für Ihr neues Modul.
2.  **[ ] Pfade definieren:** Legen Sie alle externen Daten- und API-Pfade in der `path/paths.js`-Datei fest.
3.  **[ ] HTML-Grundgerüst erstellen:** Erstellen Sie die `index.html` mit den notwendigen Verweisen auf CSS und JS.
4.  **[ ] CSS-Stile anlegen:** Erstellen Sie die `css/style.css`, importieren Sie die globalen Variablen und verwenden Sie das korrekte Namenspräfix für alle Klassen.
5.  **[ ] JavaScript-Logik aufteilen:** Erstellen Sie im `js/module/`-Ordner separate Dateien für die verschiedenen Verantwortlichkeiten (z.B. `mein-modul-ui.js`, `mein-modul-api.js`).
6.  **[ ] Haupt-Skript (`script.js`) erstellen:** Importieren und initialisieren Sie Ihre Sub-Module in der `js/script.js`.
7.  **[ ] Modul registrieren:** Fügen Sie Ihr Modul in der `shared/config/module-config.json` hinzu, um es im Dashboard sichtbar zu machen.
8.  **[ ] Backend erstellen (falls nötig):** Erstellen Sie das zugehörige Backend-Modul gemäß den Architekturregeln der Haupt-`README.md`.
9.  **[ ] Technische Dokumentation erstellen:** Erstellen Sie die `[Modul]-Anbindung.md`, die den Datenfluss und die Logik dokumentiert (siehe Abschnitt 7).
10. **[ ] Vite-Konfiguration anpassen:** Fügen Sie das neue Modul zur `frontend/vite.config.js` hinzu, um 404-Fehler zu vermeiden (siehe Abschnitt 8).

---

## 3. Standard-Ordnerstruktur

Jedes neue Modul **MUSS** exakt diese Struktur haben. Ersetzen Sie `mein-neues-modul` durch den Namen Ihres Moduls (Kleinbuchstaben, mit Bindestrichen).

```
frontend/
└── modules/
    └── mein-neues-modul/
        ├── css/
        │   └── style.css
        ├── js/
        │   ├── module/
        │   │   ├── mein-modul-ui.js
        │   │   └── mein-modul-api.js
        │   └── script.js
        ├── path/
        │   └── paths.js
        └── index.html
```

---

## 4. Code-Vorlagen (Boilerplate)

Verwenden Sie diese Vorlagen als Ausgangspunkt für Ihre Dateien.

### `index.html` (Mit stabilem Fundament)

Das HTML muss **alle** Container definieren, die die Anwendung benötigt.

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mein Neues Modul</title>
    
    <!-- Globale Styles und Modul-spezifische Styles -->
    <link rel="stylesheet" href="/modules/mein-neues-modul/css/style.css">
</head>
<body>
    <div id="main-header"></div>

    <div class="container mt-4">
        <header class="mb-4">
            <h1>Mein Neues Modul</h1>
        </header>

        <main>
            <div id="filter-section" class="mb-3">
                <!-- Filter werden von JS hier gerendert -->
            </div>
            <div id="item-list-container">
                <!-- Die Liste der Elemente wird von JS hier gerendert -->
                <p>Lade Liste...</p>
            </div>
            <div id="details-modal-container">
                <!-- Das Detail-Modal wird von JS hier gerendert -->
            </div>
        </main>
    </div>

    <script type="module" src="/modules/mein-neues-modul/js/script.js"></script>
</body>
</html>
```

### `path/paths.js`

Dies ist die "Schaltzentrale" Ihres Moduls. **Jegliche externe Kommunikation läuft ausschließlich über dieses Objekt.**

```javascript
/**
 * Definiert alle externen Datenquellen und API-Endpunkte für das Modul.
 * Die Kernlogik interagiert NUR mit diesem Objekt, niemals mit hartcodierten Pfaden.
 */
export const meinModulPaths = {
    // Pfade zu statischen JSON-Dateien
    data: {
        stammdaten: '/shared/data/mein-neues-modul/stammdaten.json'
    },
    // API-Endpunkte des Backends
    api: {
        getAlleElemente: '/api/mein-neues-modul',
        getElement: (id) => `/api/mein-neues-modul/${id}`,
        updateElement: (id) => `/api/mein-neues-modul/${id}`,
    }
};
```

### `css/style.css`

```css
/**
 * Importiert globale Variablen (Farben, Schriftgrößen etc.) aus dem @shared-Alias.
 * Dieser Alias wird in der vite.config.js konfiguriert.
 */
@import '@shared/styles/variables.css';

/**
 * Alle Klassen MÜSSEN mit dem Modulnamen als Präfix versehen sein,
 * um Styling-Konflikte mit anderen Modulen zu verhindern.
 * 
 * Konvention: .modul-name--element-name
 */
.mein-neues-modul--card {
    border: 1px solid var(--color-border);
    padding: 1rem;
    border-radius: var(--border-radius-medium);
}

.mein-neues-modul--button {
    background-color: var(--color-primary);
    color: white;
}
```

### `js/script.js` (Der Orchestrator)

Diese Datei importiert und initialisiert nur. Sie enthält keine eigene Geschäftslogik.

```javascript
// WICHTIG: Importiert das Bootstrap CSS und die Icons.
// Ohne diese Zeilen wird das Modul nicht korrekt dargestellt.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { initializeHeader } from '@shared/components/header/header.js';
import { initializeModule } from './module/mein-modul-main.js'; // Umbenannt für Klarheit
import { showToast } from '@shared/components/toast/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await initializeHeader();
        initializeModule(user); // Übergibt den Benutzer an das Modul
        showToast('Mein Neues Modul erfolgreich geladen!', 'success');
    } catch (error) {
        console.error('Fehler bei der Initialisierung des Moduls:', error);
        showToast('Fehler beim Laden des Moduls.', 'error');
    }
});
```

### `js/module/mein-modul-main.js` (Logik mit klarer Trennung)

Diese Datei kombiniert UI und API-Logik, aber in streng getrennten Blöcken.

```javascript
import { meinModulPaths } from '../../path/paths.js';

// =================================================================
// 1. DOM-Elemente (Nodes)
// Am Anfang zwischengespeichert für Performance.
// =================================================================
const filterContainer = document.querySelector('#filter-section');
const listContainer = document.querySelector('#item-list-container');
const modalContainer = document.querySelector('#details-modal-container');

// =================================================================
// 2. API-Funktionen (Kommunikation)
// =================================================================
async function fetchItems() {
    const response = await fetch(meinModulPaths.api.getAlleElemente);
    if (!response.ok) throw new Error('Netzwerkfehler');
    return await response.json();
}

// =================================================================
// 3. UI-Funktionen (Rendering)
// =================================================================
function renderItemList(items) {
    listContainer.innerHTML = '<ul>' + items.map(i => `<li>${i.name}</li>`).join('') + '</ul>';
}

function renderFilters() {
    filterContainer.innerHTML = '<input type="text" placeholder="Suchen..." />';
}

// =================================================================
// 4. Event-Listener und Initialisierung (Orchestration)
// =================================================================
function setupEventListeners() {
    filterContainer.addEventListener('input', (e) => {
        // Logik zum Filtern der gerenderten Liste...
    });
}

/**
 * Die öffentliche Funktion, die das Modul startet.
 */
export async function initializeModule(user) {
    // Sicherstellen, dass alle Container aus der index.html gefunden wurden.
    if (!filterContainer || !listContainer || !modalContainer) {
        console.error('Einer der Haupt-Container des Moduls wurde nicht im DOM gefunden!');
        return;
    }

    renderFilters();
    setupEventListeners();

    const items = await fetchItems();
    renderItemList(items);
}
```

---

## 5. Modul-Registrierung

Damit das Modul im Dashboard erscheint und für Benutzer freigeschaltet werden kann, muss es in `shared/config/module-config.json` registriert werden.

Fügen Sie einen neuen Eintrag für Ihr Modul hinzu:

```json
[
  {
    "id": "admin-dashboard",
    "name": "Admin Dashboard",
    "path": "/core/admin-dashboard/index.html"
  },
  // ... weitere existierende Module
  {
    "id": "mein-neues-modul",
    "name": "Mein Tolles Neues Modul",
    "path": "/modules/mein-neues-modul/index.html",
    "icon": "bi-speedometer2", 
    "description": "Eine kurze Beschreibung, was dieses Modul macht."
  }
]
```

Nachdem Sie diese Schritte befolgt haben, ist Ihr Modul korrekt in die Anwendungsarchitektur integriert.

---

## 6. Bewährte Muster & Konventionen (Best Practices)

Diese Muster haben sich in der Praxis bewährt und sollten nach Möglichkeit angewendet werden.

### UI/UX-Muster

#### Responsive Steuerelemente (z.B. Buttons)
Um auf mobilen Geräten Platz zu sparen, sollten bei Buttons oder Links der erklärende Text ausgeblendet und nur das Icon angezeigt werden. Dies wird mit Bootstrap-Hilfsklassen erreicht.

**Beispiel für einen Bearbeiten-Button:**
```html
<button class="btn btn-sm btn-outline-primary">
    <i class="bi bi-pencil-fill"></i>
    <span class="d-none d-md-inline ms-2">Bearbeiten</span>
</button>
```
-   `<span class="d-none d-md-inline ...">`: Der Text ist standardmäßig (`d-none`) unsichtbar und wird erst ab der `md`-Breakpoint-Größe (`d-md-inline`) als `inline`-Element sichtbar.

#### Optionale Formularbereiche
Komplexe Formulare bleiben übersichtlich, indem optionale oder selten genutzte Eingabebereiche (z.B. Nährwerte, spezielle Konfigurationen) standardmäßig versteckt werden. Ein "Toggle"-Button blendet den Bereich bei Bedarf ein.

**HTML-Struktur:**
```html
<div>
    <button type="button" id="toggle-naehrwerte-btn" class="btn btn-secondary mb-2">
        Nährwerte bearbeiten
    </button>
    <div id="naehrwerte-section" class="d-none border p-3 rounded">
        <!-- ... Formularfelder für Nährwerte ... -->
    </div>
</div>
```

**JavaScript-Logik:**
```javascript
const toggleButton = document.getElementById('toggle-naehrwerte-btn');
const section = document.getElementById('naehrwerte-section');

toggleButton.addEventListener('click', () => {
    section.classList.toggle('d-none');
});
```

### Architektur-Muster

#### Logik in Stammdaten auslagern
Anstatt Berechnungsregeln oder Konversionen fest im JavaScript-Code zu verankern, sollten diese in die Stammdaten (`.json`-Dateien) ausgelagert werden. Dies macht das System flexibler und einfacher zu warten.

**Beispiel (Einheitenumrechnung):**
Anstatt die Umrechnung von `kg` nach `g` im Code zu schreiben (`wert * 1000`), wird dies über Faktoren in den Stammdaten gesteuert.

**`einheiten-stammdaten.json`:**
```json
{
  "einheiten": [
    { "name": "Gramm", "abk": "g", "faktor": 1 },
    { "name": "Kilogramm", "abk": "kg", "faktor": 1000 }
  ]
}
```
Der Code liest diese Faktoren und berechnet dynamisch den korrekten Umrechnungsfaktor, anstatt auf hartcodierte Werte angewiesen zu sein.

#### Das "Snapshot-Prinzip" für abhängige Daten
Wenn ein Modul Daten aus einem anderen Modul verwendet (z.B. der "Menüplan" verwendet "Rezepte"), dürfen die Daten nicht nur per ID verknüpft werden. Dies würde bei späteren Änderungen an den Quelldaten (z.B. Preisänderung einer Zutat) zu einer Verfälschung der historischen Daten führen.

**Vorschrift:** Beim Erstellen eines abhängigen Datensatzes (z.B. ein Menüplan-Eintrag) muss ein "Snapshot" der relevanten, berechneten Werte erstellt und direkt im neuen Datensatz gespeichert werden.

**Beispiel für einen Menüplan-Eintrag:**

Anstatt nur `rezeptId` und `portionen` zu speichern, werden die zum Zeitpunkt der Erstellung gültigen Werte mitkopiert.

```json
// menueplan-eintrag.json
{
  "id": "menueplan-eintrag-uuid",
  "rezeptId": "rezept-uuid-12345",
  "rezeptName": "Spaghetti Carbonara", // Kopie für einfache Anzeige
  "portionen": 50,
  "berechneteWerteSnapshot": { // Wichtig: Gesnapshotete Werte
    "kostenProPortion": 2.45,
    "allergene": ["G", "C"],
    "naehrwerteProPortion": { "kalorien_kcal": 650 }
  }
}
```

**Vorteile:**
-   **Historische Genauigkeit:** Kalkulationen bleiben für alte Einträge korrekt.
-   **Performance:** Alle für die Anzeige benötigten Daten sind sofort verfügbar, es sind keine komplexen Joins über mehrere Dateien nötig.
-   **Robustheit:** Der Datensatz bleibt auch dann gültig, wenn das ursprüngliche Rezept geändert oder gelöscht wird.

### Globale Layout-Regeln

#### Fixierte Navigationsleiste
Da die Hauptnavigation (`<header id="main-header">`) global mit der Klasse `fixed-top` fixiert ist, verdeckt sie den oberen Teil des Seiteninhalts. Jede `index.html` **muss** ein globales Styling auf den `body` anwenden, um dies zu kompensieren.

**Empfohlene CSS-Regel (in der `style.css` jedes Moduls):**
```css
body {
    padding-top: 80px; /* Oder die genaue Höhe der fixierten Navigationsleiste */
}
```

---

## 7. Technische Dokumentation (`[Modul]-Anbindung.md`)

Für jedes Modul **muss** eine technische Dokumentationsdatei namens `[Modul]-Anbindung.md` im Hauptverzeichnis des Moduls erstellt werden.

**Zweck:** Diese Datei ist der "lebende Datenvertrag" des Moduls. Sie dient als zentrale Wissensquelle für aktuelle und zukünftige Entwickler (sowohl Menschen als auch KIs), um die Datenarchitektur und die Kernlogik schnell zu verstehen, ohne den gesamten Code analysieren zu müssen.

**Struktur und Inhalt:**

Die Datei muss mindestens die folgenden drei Abschnitte enthalten:

1.  **Datenquellen:** Woher kommen die Daten?
    -   Auflistung aller relevanten API-Endpunkte aus der `paths.js`.
    -   Auflistung aller statischen JSON-Dateien (z.B. Stammdaten), die gelesen werden.

2.  **Zentrale Datenstruktur(en):** Wie sehen die wichtigsten Datenobjekte aus?
    -   Ein oder mehrere Code-Blöcke (`json`), die die genaue Struktur der Kernobjekte des Moduls zeigen (z.B. wie ein `Zutat`-Objekt oder ein `Rezept`-Objekt aufgebaut ist).
    -   Besonders wichtige oder komplexe Felder sollten kurz erläutert werden.

3.  **Wichtige Logiken:** Welche "magischen" oder nicht-offensichtlichen Dinge passieren?
    -   Erklärung von automatischen Berechnungen (z.B. Umrechnungsfaktor).
    -   Beschreibung von komplexen Validierungsregeln.
    -   Erläuterung, wie mit optionalen oder dynamisch eingeblendeten Formularteilen umgegangen wird.

**Referenzbeispiel:** Die Datei `frontend/modules/zutaten/Zutaten-Anbindung.md` dient als Goldstandard und Vorlage für alle zukünftigen Dokumentationsdateien.

---

## 8. Konfiguration der Entwicklungsumgebung (Vite)

Wenn ein neues Frontend-Modul erstellt wird, müssen zwei Anpassungen in der Konfigurationsdatei des Frontend-Servers (`frontend/vite.config.js`) vorgenommen werden.

**Problem:** Ohne diese Anpassungen wird der Entwicklungs-Server die `index.html` des neuen Moduls nicht finden und mit einem **404-Fehler** reagieren. Außerdem würde der `build`-Prozess das neue Modul ignorieren.

### Anpassung 1: Den Build-Prozess erweitern (`build.rollupOptions`)

Jedes Modul ist ein eigener "Einstiegspunkt" für die Anwendung. Dieser muss Vite explizit bekannt gemacht werden.

**Aktion:** Fügen Sie die `index.html` Ihres neuen Moduls zum `input`-Objekt unter `build.rollupOptions` hinzu.

```javascript
// frontend/vite.config.js

// ...
  build: {
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'core/login/index.html'),
        // ... andere Module
        meinNeuesModul: resolve(__dirname, 'modules/mein-neues-modul/index.html'),
      }
    }
  }
// ...
```

### Anpassung 2: Zugriff auf `/shared` im Entwicklungsmodus erlauben (`server.fs.allow`)

Die Modul-Dateien greifen auf Ressourcen im `shared`-Ordner zu (z.B. `/shared/styles/layout.css`). Dieser Ordner liegt außerhalb des `frontend`-Verzeichnisses, in dem Vite standardmäßig operiert.

**Aktion:** Stellen Sie sicher, dass die `server.fs.allow`-Einstellung vorhanden ist und den Zugriff auf das übergeordnete Verzeichnis (`'..'`) erlaubt. Diese Einstellung muss nur einmalig gesetzt werden.

```javascript
// frontend/vite.config.js

// ...
  server: {
    // ... andere Server-Optionen
    fs: {
      // Erlaubt dem Vite-Server den Zugriff auf Dateien außerhalb des Workspace-Roots.
      // Notwendig, damit wir auf /shared zugreifen können.
      allow: ['..']
    }
  },
// ...
```