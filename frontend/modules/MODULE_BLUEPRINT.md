# Modul-Blueprint: Anleitung zur Erstellung neuer Frontend-Module

Dieses Dokument ist eine verbindliche Schritt-für-Schritt-Anleitung für die Erstellung eines neuen Frontend-Moduls. Das strikte Befolgen dieses Blueprints ist entscheidend, um die Architektur, Stabilität und Wartbarkeit des gesamten Projekts zu gewährleisten.

## 1. Checkliste für die Modulerstellung

1.  **[ ] Ordnerstruktur anlegen:** Erstellen Sie die Standard-Ordnerstruktur für Ihr neues Modul.
2.  **[ ] Pfade definieren:** Legen Sie alle externen Daten- und API-Pfade in der `path/paths.js`-Datei fest.
3.  **[ ] HTML-Grundgerüst erstellen:** Erstellen Sie die `index.html` mit den notwendigen Verweisen auf CSS und JS.
4.  **[ ] CSS-Stile anlegen:** Erstellen Sie die `css/style.css`, importieren Sie Bootstrap und verwenden Sie primär Bootstrap-Klassen.
5.  **[ ] JavaScript-Logik aufteilen:** Erstellen Sie im `js/module/`-Ordner separate Dateien für die verschiedenen Verantwortlichkeiten (z.B. `mein-modul-ui.js`, `mein-modul-api.js`).
6.  **[ ] Haupt-Skript (`script.js`) erstellen:** Importieren und initialisieren Sie Ihre Sub-Module in der `js/script.js`.
7.  **[ ] Modul registrieren:** Fügen Sie Ihr Modul in der `shared/config/module-config.json` hinzu, um es im Dashboard sichtbar zu machen.
8.  **[ ] Backend erstellen (falls nötig):** Erstellen Sie das zugehörige Backend-Modul gemäß den Architekturregeln der Haupt-`README.md`.

---

## 2. Detaillierte Struktur und Konventionen

### 2.1. Standard-Ordnerstruktur
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

### 2.2. Pfad-Abstraktionsebene (`path/paths.js`)
Dies ist die "Schaltzentrale" Ihres Moduls. **Jegliche externe Kommunikation läuft ausschließlich über dieses Objekt.**
- Sie definiert, wo Daten gelesen/geschrieben werden, und abstrahiert, ob die Quelle ein API-Endpunkt (z.B. `/api/zutaten`) oder eine JSON-Datei (`shared/data/zutaten.json`) ist.
- Die Kernmodullogik interagiert **AUSSCHLIESSLICH** mit dieser Abstraktionsebene, niemals mit fest codierten Pfaden oder API-Endpunkten.

### 2.3. CSS-Modularität & Bootstrap (`css/style.css`)
- **Bootstrap First:** Das primäre Ziel ist, **kein eigenes CSS** zu schreiben. UI-Komponenten werden durch die Klassen von Bootstrap erstellt.
- **Import von Bootstrap:** Die `style.css`-Datei kann leer bleiben. Bootstrap sollte direkt im Haupt-Skript `js/script.js` importiert werden, um die Ladeabhängigkeiten klar zu halten: `import 'bootstrap/dist/css/bootstrap.min.css';`.
- **Eigene Klassen als Ausnahme:** Nur wenn ein Styling mit Bootstrap-Utilities nicht möglich ist, werden eigene Klassen erstellt. Diese **MÜSSEN** mit dem Modulnamen als Präfix versehen sein, um Konflikte zu vermeiden (z.B. `.mein-modul--spezial-button`).

### 2.4. JavaScript-Modularität (`js/`)
- `script.js`: Die Haupt-Integrationsdatei. Sie importiert und initialisiert nur andere Sub-Module und enthält selbst **minimale Logik**. Sie ist auch der Ort, um CSS-Frameworks wie Bootstrap zu importieren.
- `/js/module/`: Enthält Feature-basierte, verantwortungsgetriebene Sub-Module (z.B. `mein-modul-formular.js` für die UI, `mein-modul-api.js` für die Datenverarbeitung).

### 2.5. Modul-Autarkie (Eigenständigkeit)
Jedes Frontend-Modul ist dafür verantwortlich, seine eigenen Kern-Abhängigkeiten (insbesondere `bootstrap/dist/css/bootstrap.min.css`) in seinem Haupt-JavaScript-Einstiegspunkt (`script.js`) zu importieren. Dies stellt sicher, dass jedes Modul unabhängig und gekapselt funktioniert.

### 2.6. Wichtige Import-Regeln
- **Kein `fetch` für lokale Projektdateien:** Lokale Dateien (Konfigs, Templates) aus dem `/shared`-Ordner dürfen **niemals** per `fetch()` geladen werden. Verwenden Sie stattdessen immer `import` mit dem `@shared`-Alias.
    - **Für JS/JSON:** `import myConfig from '@shared/config/my-config.json';`
    - **Für HTML/CSS/SVG als Text:** `import myTemplate from '@shared/components/my-template.html?raw';`
- **HTML-Pfade:** Alle Pfade in der `index.html` (z.B. zu `script.js`) müssen absolut vom `frontend`-Ordner aus sein (z.B. `<script src="/modules/mein-neues-modul/js/script.js">`).

### 2.7. Grundregel: Integrität von Shared-Komponenten
Geteilte Komponenten und Module im `shared`-Verzeichnis sind das Fundament der Anwendung und werden von vielen Teilen des Systems gleichzeitig genutzt.

-   **Absolutes Änderungsverbot für Modul-Fixes:** Es ist strikt untersagt, eine `shared`-Komponente (z.B. `shared/components/header/header.js`) anzupassen, nur weil ein einzelnes Modul sie nicht korrekt verwendet.
-   **Fehlerbehebung am Ursprung:** Der Fehler liegt in solchen Fällen immer im aufrufenden Modul. Die Korrektur muss dort erfolgen (z.B. durch Anpassen der `index.html` des Moduls, damit sie der von der `shared`-Komponente erwarteten Schnittstelle entspricht).
-   **Begründung:** Eine Änderung an einer `shared`-Komponente kann unvorhersehbare Seiteneffekte in allen anderen Modulen haben. Die Stabilität des Gesamtsystems hat Vorrang.

### 2.8. Kritische Kompatibilitätsregeln (Backend & Frontend)
**Problem:** Das Backend läuft auf Node.js und verwendet das **CommonJS**-Modulsystem (`require`/`module.exports`). Das Frontend läuft auf Vite und verwendet **ES-Module** (`import`/`export`). Geteilte JavaScript-Dateien (`/shared/**/*.js`) müssen von beiden Systemen verstanden werden.

**Lösung & Regel:**
1.  **Shared-JS-Dateien IMMER in CommonJS:** Jede `.js`-Datei im `/shared`-Verzeichnis, die vom Backend benötigt wird (z.B. Validierungs-Schemas), **MUSS** im CommonJS-Format geschrieben sein.
    -   **Verwenden Sie `require()`** für Importe (z.B. `const { z } = require('zod');`).
    -   **Verwenden Sie `module.exports`** für Exporte (z.B. `module.exports = { meinSchema };`).
2.  **Vite kümmert sich um das Frontend:** Das Frontend-Setup (`vite.config.js`) ist so konfiguriert, dass es CommonJS-Module automatisch korrekt verarbeiten und für den Browser umwandeln kann. Es sind keine weiteren Schritte im Frontend-Code nötig.
3.  **Fehlerbild bei Zuwiderhandlung:** Wenn eine vom Backend genutzte Shared-Datei `import` verwendet, stürzt der Node.js-Server mit dem Fehler `SyntaxError: Cannot use import statement outside a module` ab.

### 2.9. Modul-Initialisierungs-Lebenszyklus
**Problem:** Der Versuch, auf HTML-Elemente zuzugreifen, bevor sie existieren, führt zum Fehler `TypeError: Cannot read properties of null (reading 'addEventListener')`. Dies passiert oft, wenn die Lade-Reihenfolge von Header und Modul-UI nicht eingehalten wird.

**Lösung & Regel:**
Die `js/script.js` eines jeden Moduls **MUSS** diesem Lebenszyklus folgen, um Race Conditions zu vermeiden:

```javascript
// js/script.js

// 1. Alle Abhängigkeiten importieren
import { initializeHeader } from '@shared/components/header/header.js';
import { initMeinModulUI } from './module/mein-modul-ui.js';

// 2. Auf das 'DOMContentLoaded'-Event warten
document.addEventListener('DOMContentLoaded', () => {
    
    // 3. Den Header initialisieren. Dies ist ein asynchroner Prozess.
    // Er prüft die Authentifizierung und leitet bei Fehler zum Login um.
    initializeHeader()
        .then(user => {
            // 4. ERST NACHDEM der Header erfolgreich geladen wurde,
            //    wird die UI des eigenen Moduls initialisiert.
            //    Das 'user'-Objekt kann hier optional weiterverwendet werden.
            console.log('Header geladen, Modul-UI wird initialisiert...');
            initMeinModulUI(); 
        })
        .catch(error => {
            // 5. Fehlerbehandlung. In der Regel ist hier nichts zu tun,
            //    da initializeHeader() bei einem kritischen Fehler (z.B. kein Token)
            //    bereits zum Login weiterleitet und der Code hier nicht erreicht wird.
            console.error("Fehler beim Laden des Headers. UI-Initialisierung wird abgebrochen.", error);
        });
});
```
- **Zwingende Reihenfolge:** `DOMContentLoaded` -> `initializeHeader()` -> `.then()` -> `initMeinModulUI()`.
- **Niemals andersherum:** Die Modul-UI darf niemals vor oder parallel zu `initializeHeader()` aufgerufen werden.

### 2.10. Verwendung von Shared Components (Beispiel: Confirmation Modal)
Wenn eine Funktionalität von mehreren Modulen benötigt wird (z.B. ein Bestätigungsdialog), wird sie als "Shared Component" im `shared/components/`-Verzeichnis zentralisiert. Die Verwendung ist unkompliziert, erfordert aber die Einhaltung des richtigen Musters.

**Anwendungsfall:** Ein Benutzer soll das Löschen von Daten bestätigen.

**Implementierung:**
1.  **Importieren:** Importieren Sie die Komponente und die zugehörigen Nachrichten in der Datei, in der Sie sie verwenden möchten (z.B. in Ihrer `mein-modul-ui.js`).
2.  **Aufrufen:** Rufen Sie die Funktion mit `await` auf und holen Sie sich die Texte aus der importierten Nachrichten-Konfiguration.

```javascript
// /frontend/modules/mein-modul/js/module/mein-modul-ui.js

// 1. Importiere die Funktion der Shared Component und die Text-Konfiguration
import { showConfirmationModal } from '@shared/components/confirmation-modal/confirmation-modal.js';
import messages from '@shared/config/modal-messages.json';

export function initMeinModulUI() {
    const deleteButton = document.getElementById('delete-button');

    deleteButton.addEventListener('click', async () => {
        // 2. Hole die spezifischen Texte aus der Konfigurationsdatei
        const { title, message } = messages.menueplan.deletePlan;

        // 3. Rufe die Funktion mit `await` auf und warte auf die Benutzer-Aktion.
        //    Der Code pausiert hier, bis der Dialog geschlossen wird.
        const isConfirmed = await showConfirmationModal(title, message);

        // 4. Werte das Ergebnis aus (true für "OK", false für "Abbrechen")
        if (isConfirmed) {
            console.log("Benutzer hat bestätigt. Lösche die Daten...");
            // Hier die Logik zum Löschen der Daten aufrufen
        } else {
            console.log("Benutzer hat abgebrochen.");
        }
    });
}
```

-   **Warum `await`?** Die Funktion gibt einen `Promise` zurück. `await` pausiert die Ausführung der `async`-Funktion, bis der Benutzer eine Entscheidung getroffen hat. Das Ergebnis ( `true` oder `false`) wird dann an die `isConfirmed`-Variable zugewiesen.
-   **Warum `modal-messages.json`?** Texte werden nie direkt im Code ("hartcodiert") geschrieben. Durch die zentrale Speicherung in einer JSON-Datei bleiben sie leicht wartbar und übersetzbar, ohne den Code anfassen zu müssen.

### 2.11. Grundsatz für Responsive Layouts: Mobile-First-HTML
Für komplexe Layouts, die auf dem Desktop anders aussehen als auf mobilen Geräten (z.B. Tabellen), gilt das Prinzip "Mobile-First HTML".

1.  **HTML logisch strukturieren:** Die HTML-Elemente werden so generiert und verschachtelt, dass sie ohne zusätzliches CSS auf einem schmalen Bildschirm eine logische, von oben nach unten lesbare Reihenfolge haben.
    -   *Beispiel:* Für einen Wochenplan wird zuerst der komplette Montag (mit allen Mahlzeiten) generiert, dann der komplette Dienstag usw.
2.  **CSS für Desktop verwenden:** CSS (z.B. `display: flex` oder `display: grid`) wird dann genutzt, um diese von Natur aus vertikale Struktur auf größeren Bildschirmen in ein mehrspaltiges Layout zu zwingen.

Dieser Ansatz ist robuster und wartungsfreundlicher als der umgekehrte Weg, ein Desktop-Layout mit komplexen Media-Queries auf mobile Geräte "herunterzubrechen".

---

## 3. Code-Vorlagen (Boilerplate)

Verwenden Sie diese Vorlagen als Ausgangspunkt.

### `index.html`
```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mein Neues Modul</title>
    <!-- CSS wird über JS importiert, um Abhängigkeiten klar zu halten -->
</head>
<body class="bg-light">
    <!-- Der Header wird hier dynamisch von einem geteilten Skript eingefügt -->
    <header id="main-header"></header>

    <main class="container mt-4">
        <header class="mb-4">
            <h1>Mein Neues Modul</h1>
        </header>

        <section id="mein-neues-modul-container">
            <!-- Der Inhalt dieses Moduls wird hier von JS gerendert -->
        </section>
    </main>

    <!-- Das Haupt-Skript für dieses Modul. 'type="module"' ist essentiell. -->
    <script type="module" src="/modules/mein-neues-modul/js/script.js"></script>
</body>
</html>
```

### `path/paths.js`
```javascript
export const meinModulPaths = {
    data: {
        stammdaten: '/shared/data/mein-neues-modul/stammdaten.json'
    },
    api: {
        getAlleElemente: '/api/mein-neues-modul',
        getElement: (id) => `/api/mein-neues-modul/${id}`,
    }
};
```

### `js/script.js` (Die Integrationsdatei)
```javascript
// Importiert Bootstrap, den Header und die Sub-Module
import 'bootstrap/dist/css/bootstrap.min.css';

// HINWEIS: Bei Bedarf Drag & Drop für mobile Geräte aktivieren.
// Die Standard HTML5 Drag & Drop API funktioniert nicht auf Touch-Geräten.
// Dieser Polyfill übersetzt Touch-Events in Drag-Events.
// Führen Sie `npm install drag-drop-touch` im /frontend Ordner aus.
// import 'drag-drop-touch'; 

import { initializeHeader } from '@shared/components/header/header.js';
import { initUI } from './module/mein-modul-ui.js';
import { fetchData } from './module/mein-modul-api.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeHeader();
        const moduleData = await fetchData();
        initUI(moduleData);
    } catch (error) {
        console.error('Fehler bei der Initialisierung des Moduls:', error);
        const container = document.querySelector('#mein-neues-modul-container');
        if(container) container.innerHTML = '<p class="text-danger">Fehler beim Laden des Moduls.</p>';
    }
});
```
---

## 4. Modul-Registrierung

Damit das Modul im Dashboard erscheint, muss es in `shared/config/module-config.json` registriert werden. Fügen Sie einen neuen Eintrag für Ihr Modul hinzu:

```json
[
  // ... existierende Module
  {
    "id": "mein-neues-modul",
    "name": "Mein Tolles Neues Modul",
    "description": "Eine kurze, prägnante Beschreibung, was dieses Modul tut.",
    "icon": "bi-question-circle",
    "path": "/modules/mein-neues-modul/index.html",
    "roles": ["admin", "Koch"]
  }
]
```
- **id:** Einzigartiger Bezeichner.
- **name:** Anzeigename auf der Dashboard-Kachel.
- **description:** Kurzbeschreibung auf der Dashboard-Kachel.
- **icon:** Ein Bootstrap-Icon-Klassenname (z.B. `bi-gear-fill`).
- **path:** Der Pfad zur `index.html` des Moduls.
- **roles:** Ein Array von Benutzerrollen, die dieses Modul sehen dürfen. 