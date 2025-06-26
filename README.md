# SmartWorkArt - Architektur & Entwicklungsleitfaden

Dieses Dokument ist das zentrale "Grundgesetz" für das SmartWorkArt-Projekt. Es definiert die Architektur, die Code-Konventionen und die Entwicklungsprinzipien. Alle Entwickler und KI-Assistenten müssen sich strikt an diese Regeln halten, um die Stabilität, Wartbarkeit und Skalierbarkeit des Projekts zu gewährleisten.

## Regeln und Prinzipien

rules:
  - title: "Deutsche Sprache im gesamten Projekt"
    content: |
      Um die Konsistenz und Verständlichkeit für das deutsche Entwicklungsteam zu gewährleisten, muss die deutsche Sprache konsequent verwendet werden:
      1.  **Code-Kommentare:** Alle Code-Kommentare müssen auf Deutsch verfasst werden.
      2.  **Commit-Messages:** Alle Git-Commit-Nachrichten müssen auf Deutsch geschrieben werden, um die Projekthistorie für das Team verständlich zu halten.
      3.  **Dokumentation:** Alle Markdown-Dateien, README-Inhalte und technische Dokumentation erfolgen auf Deutsch.
      4.  **Variablen- und Funktionsnamen:** Wo sinnvoll, sollen deutsche Begriffe verwendet werden (z.B. `rezeptListe` statt `recipeList`).
      
      **Commit-Message Format (Deutsch):**
      ```
      typ: Kurze Beschreibung der Änderung
      
      - Detaillierte Erklärung was geändert wurde
      - Warum die Änderung notwendig war
      - Welche Auswirkungen sie hat
      ```
      
      **Beispiele für gute deutsche Commits:**
      - `feat: Neues Rezept-Modul mit Suchfunktion hinzugefügt`
      - `fix: Menüplan-Synchronisation zwischen Frontend und Backend repariert`
      - `docs: Anfänger-Guide für CI/CD Pipeline erstellt`
      - `refactor: API-Client für einheitliche Fehlerbehandlung überarbeitet`

  - title: "Regressionsschutz (Oberstes Gebot)"
    content: |
      Beim Hinzufügen neuer Features oder bei Änderungen ist es entscheidend, bestehende, nicht verwandte Funktionen nicht zu beschädigen oder zu verändern. 
      Auswirkungen auf das Gesamtsystem müssen stets berücksichtigt werden, um Kaskadenfehler zu vermeiden. 
      Vor der Implementierung sind Abhängigkeiten zu analysieren und sicherzustellen, dass die Änderungen isoliert und sicher sind.

  - title: "Daten-Speicherorte Konvention"
    content: |
      Eine strikte Trennung der Datentypen ist einzuhalten:
      1.  **Benutzerdaten:** Alle benutzerbezogenen Daten (Authentifizierung, Profile, Rollen) müssen ausschließlich in der MongoDB-Datenbank über das Backend-API gespeichert und verwaltet werden.
      2.  **Modul- & Anwendungsdaten:** Alle Daten, die von Modulen erzeugt werden (z.B. Rezepte, Menüs, Zutaten), müssen als JSON-Dateien im Verzeichnis `shared/data` abgelegt werden.

  - title: "Systematischer Entwicklungsprozess"
    content: |
      Folge einem strukturierten Entwicklungsprozess, um logische und robuste Ergebnisse zu gewährleisten:
      1.  **Analyse:** Alle Anforderungen und Abhängigkeiten vollständig verstehen.
      2.  **Planung:** Die Implementierungsstruktur und Architektur entwerfen.
      3.  **Implementierung:** In klaren, nachvollziehbaren und sicheren Schritten umsetzen.
      4.  **Review:** Den erstellten Code auf Fehler, mögliche Verbesserungen und die Einhaltung der Regeln prüfen.

  - title: "Blueprint für die Modulentwicklung"
    content: |
      Jedes neue Frontend-Modul muss einer standardisierten 'Blueprint'-Struktur folgen, um Konsistenz und Wartbarkeit zu gewährleisten.

      **🛡️ WICHTIG: Sichere Entwicklung verwenden!**
      Alle neuen Module MÜSSEN das Error-Boundary-System verwenden:
      ```javascript
      import { safeModuleInit } from '@shared/components/error-boundary/error-boundary.js';
      import { api } from '@shared/utils/api-client.js';
      
      safeModuleInit(async () => {
          // Ihre Module-Initialisierung hier
      }, 'IHR_MODULE_NAME');
      ```

      **1. Standard-Ordnerstruktur:**
      - `/[modul-name]/css/`: Enthält aufgeteilte CSS-Dateien.
      - `/[modul-name]/js/`: Enthält das Haupt-`script.js` und einen `/module`-Unterordner.
      - `/[modul-name]/part/`: Enthält bei Bedarf geladene HTML-Teile.
      - `/[modul-name]/path/`: Die Abstraktionsebene ("Schaltzentrale") für das Modul.
      - `/[modul-name]/index.html`: Der Haupteinstiegspunkt für das Modul.

      **2. JavaScript-Modularität (`/js`):**
      - `script.js`: Die Haupt-Integrationsdatei. Sie importiert und initialisiert nur andere Untermodule und enthält selbst minimale Logik. MUSS Error-Boundary verwenden!
      - `/js/module/`: Enthält Feature-basierte, verantwortungsgetriebene Untermodule (z.B. `zutaten-formular.js` für die UI, `zutaten-api.js` für die Datenverarbeitung).

      **3. CSS-Modularität & Benennung (`/css`):**
      - `style.css`: Die Haupt-CSS-Datei, die kleinere, spezifische CSS-Dateien importiert.
      - Alle CSS-Klassen müssen mit dem Modulnamen als Präfix versehen sein, um Konflikte zu vermeiden (z.B. `.zutaten--button`, `.menueplan--card`).

      **4. Pfad-Abstraktionsebene (`/path`):**
      - Dies ist die "Schaltzentrale" des Moduls und verwaltet alle externen Dateninteraktionen.
      - Sie definiert, wo Daten gelesen/geschrieben werden, und abstrahiert, ob die Quelle ein API-Endpunkt (z.B. `/api/zutaten`) oder eine JSON-Datei (`shared/data/zutaten.json`) ist.
      - Sie muss auch Logik zur Erzeugung dynamischer Pfade enthalten (z.B. Erstellung eines Pfades basierend auf Jahr/Woche für Menüpläne).
      - Die Kernmodullogik interagiert AUSSCHLIESSLICH mit dieser Abstraktionsebene, niemals mit fest codierten Pfaden oder API-Endpunkten. 

      **5. Einheitliche API-Nutzung:**
      - Alle HTTP-Requests MÜSSEN über den globalen API-Client erfolgen: `import { api } from '@shared/utils/api-client.js'`
      - NIEMALS direktes `fetch()` verwenden - der API-Client bietet einheitliche Fehlerbehandlung, Retry-Logic und Auth-Handling.

      **6. Template verwenden:**
      Für neue Module das sichere Template verwenden:
      ```bash
      cp shared/templates/module-template.js frontend/modules/ihr-modul/js/script.js
      ``` 

  - title: "UI/Design-Grundsatz: Bootstrap First"
    content: |
      Um ein konsistentes, professionelles und wartbares Erscheinungsbild im gesamten Projekt zu gewährleisten, ist die Verwendung des Bootstrap-Frameworks obligatorisch.
      1.  **Kein individuelles CSS für Layouts:** Anstatt benutzerdefinierte CSS-Regeln für grundlegende Layouts, Komponenten (Buttons, Karten, Formulare) oder das Grid-System zu schreiben, müssen die von Bootstrap bereitgestellten Klassen verwendet werden.
      2.  **Komponenten nutzen:** Alle UI-Elemente sind, wo immer möglich, mit Standard-Bootstrap-Komponenten (`.card`, `.btn`, `.form-control`, `.navbar` etc.) zu erstellen.
      3.  **Einheitlichkeit:** Diese Regel verhindert das Entstehen eines visuellen "Mischmaschs" und stellt sicher, dass alle Module eine einheitliche und intuitive Benutzererfahrung bieten.
      4.  **Ausnahmen:** Eigene CSS-Dateien sind nur für hochspezifische Anpassungen erlaubt, die mit Bootstrap-Utility-Klassen nicht oder nur sehr umständlich zu erreichen sind (z.B. spezielle Animationen oder markenspezifische Design-Elemente).

  - title: "Blueprint-Erweiterung: Vite-Pfade und Abhängigkeiten"
    content: |
      Um 404-Fehler im Vite-Dev-Server zu vermeiden, gelten folgende Konventionen für Pfade:
      1.  **HTML-Pfade (`<link>`, `<script>`):** Alle Pfade in `index.html` müssen absolut vom `frontend`-Ordner (dem Server-Root) aus sein. Beispiel: `<script src="/module/mein-modul/js/script.js">`.
      2.  **Abhängigkeiten zu `shared`:** Auf Ressourcen im `shared`-Ordner (z.B. `variables.css`, `header.js`, Konfigurationsdateien) darf NICHT direkt aus der HTML-Datei verlinkt werden.
      3.  **Korrekte Import-Methoden:**
          - **CSS:** Globale Styles wie `variables.css` müssen über `@import '@shared/styles/variables.css';` in der modul-spezifischen `style.css` importiert werden.
          - **JavaScript:** Geteilte Komponenten (`header.js`) und Konfigurationsdateien (`module-config.json`) müssen über `import ... from '@shared/...'` im JavaScript des Moduls importiert werden.
      4.  **Kein `fetch` für lokale Configs:** Lade Konfigurationsdateien (JSON) per `import`, nicht per `fetch()`. Das ist robuster und vermeidet Laufzeit-Pfadprobleme.

  - title: "Konsistenz von Komponenten-Schnittstellen"
    content: |
      Bei der Verwendung von geteilten Komponenten (z.B. einem Header) muss die HTML-Struktur exakt der von der Komponente erwarteten Schnittstelle entsprechen. Das JavaScript der Komponente (`header.js`) definiert den "Vertrag" (z.B. `<div id="main-header">`), und die HTML-Datei des Moduls (`index.html`) muss diesen Vertrag erfüllen. Ein simpler ID-Konflikt (`#main-header` vs. `#header-container`) kann die Funktionalität der gesamten Komponente lahmlegen. 

  - title: "Modul-Autarkie (Explizite Abhängigkeiten)"
    content: |
      Jedes JavaScript-Modul (.js-Datei) ist eine isolierte, eigenständige Einheit. Es kann nicht auf Variablen oder Importe aus anderen Modulen zugreifen, es sei denn, sie werden explizit importiert.
      
      1.  **CSS-Abhängigkeiten:** Jedes Modul, das Bootstrap-Komponenten oder -Layouts verwendet, muss die Haupt-CSS-Datei in seinem Haupt-JavaScript-Einstiegspunkt (`script.js`) importieren: `import 'bootstrap/dist/css/bootstrap.min.css';`
      2.  **JavaScript-Abhängigkeiten:** Wenn ein Modul eine programmatische Funktionalität einer Bibliothek benötigt (z.B. das Erstellen eines Modals), muss die spezifische Klasse oder Funktion **in genau dieser Datei** importiert werden.
          - **Korrekt:** `import { Modal } from 'bootstrap'; const myModal = new Modal(element);`
          - **Falsch (führt zu "bootstrap is not defined"):** `const myModal = new bootstrap.Modal(element);`
      
      Diese Regel stellt sicher, dass jedes Modul unabhängig und gekapselt funktioniert, ohne auf versteckte, globale Abhängigkeiten angewiesen zu sein.

  - title: "Strikte Datenkonsistenz (Frontend/Backend)"
    content: |
      Die Datenstrukturen, die vom Backend-API gesendet werden, sind der "Single Source of Truth". Das Frontend muss sich exakt an diese Strukturen halten. Eine Abweichung führt unweigerlich zu `TypeError`-Fehlern.
      
      - **Warnendes Beispiel:** Das Backend sendet ein User-Objekt mit der Eigenschaft `user.role` (String, Einzahl). Das Frontend erwartet aber fälschlicherweise `user.roles` (Array, Mehrzahl) und versucht `.includes()` darauf aufzurufen.
      - **Konsequenz:** Absturz der Anwendung, da `.includes()` auf `undefined` nicht existiert.
      - **Regel:** Vor der Verarbeitung von API-Daten muss die genaue Struktur der Daten bekannt sein und im Frontend-Code respektiert werden. Im Zweifelsfall ist der zuständige Backend-Controller zu prüfen.

  - title: "Integrität der Shared-Komponenten"
    content: |
      Geteilte Komponenten und Module im `shared`-Verzeichnis sind das Fundament der Anwendung und werden von vielen Teilen des Systems gleichzeitig genutzt.
      
      - **Absolutes Änderungsverbot für Modul-Fixes:** Es ist strikt untersagt, eine `shared`-Komponente (z.B. `shared/components/header/header.js`) anzupassen, nur weil ein einzelnes Modul (z.B. `frontend/modules/einrichtung`) diese nicht korrekt verwendet.
      - **Fehlerbehebung am Ursprung:** Der Fehler liegt in solchen Fällen immer im aufrufenden Modul. Die Korrektur muss dort erfolgen (z.B. durch Anpassen der `index.html` des Moduls, damit sie der von der `shared`-Komponente erwarteten Schnittstelle entspricht).
      - **Begründung:** Eine Änderung an einer `shared`-Komponente kann unvorhersehbare Seiteneffekte in allen anderen Modulen haben, die diese Komponente ebenfalls nutzen. Die Stabilität des Gesamtsystems hat Vorrang.

  - title: "Prinzip der vollständigen Abhängigkeitsprüfung (Refactoring-Gesetz)"
    content: |
      Das Verschieben oder Umbenennen von Code ist eine der häufigsten Fehlerquellen. Um "tote" Importe und nicht funktionierende Features zu vermeiden, ist bei jedem Refactoring dieser Prozess zwingend einzuhalten:
      
      1.  **Ankündigung:** Kläre, welche Datei/Funktion refaktorisiert wird (z.B. "Ich zentralisiere jetzt die API-Logik in `admin-api.js`.").
      2.  **Identifikation:** Führe vor dem Löschen eine globale Suche (z.B. "Find in Files") nach dem alten Dateinamen oder Funktionsnamen durch, um **alle** abhängigen Dateien zu identifizieren.
      3.  **Durchführung:** Erstelle die neue Logik am neuen Ort.
      4.  **Verifikation:** Passe **alle** in Schritt 2 gefundenen Dateien so an, dass sie auf die neue Quelle verweisen.
      5.  **Aufräumen:** Lösche die alte Datei oder den alten Code-Block **erst dann**, wenn alle Abhängigkeiten aktualisiert wurden.

  - title: "ESLint zur Qualitätssicherung"
    content: |
      Um eine hohe Code-Qualität zu gewährleisten und häufige Fehler (wie unbenutzte Variablen oder fehlerhafte Importe) frühzeitig zu erkennen, ist ESLint im Frontend-Projekt integriert.
      - **Prüfung ausführen:** `cd frontend && npm run lint`
      - **Automatische Korrektur:** `cd frontend && npm run lint:fix`
      - **Empfehlung:** Vor jedem Commit sollte der `lint`-Befehl ausgeführt werden, um die Code-Basis sauber zu halten.

  - title: "Feature-Level-Dokumentation (KI-Sicherheitsnetz)"
    content: |
      Um die Wartbarkeit zu maximieren und Fehler durch kontextblinde KI-Änderungen zu minimieren, muss jedes abgeschlossene Feature (z.B. die Benutzerverwaltung im Admin-Dashboard) seine eigene Dokumentation besitzen.
      1.  **`_FUNKTIONSWEISE.md` erstellen:** Jeder Feature-Ordner (z.B. `features/user-management/`) muss eine `_FUNKTIONSWEISE.md`-Datei enthalten. Diese erklärt den Zweck des Features, seine Abhängigkeiten und die Verantwortlichkeiten der einzelnen Dateien darin.
      2.  **Kopf-Kommentar-Pflicht:** Jede Datei (`.js`, `.html`, etc.), die zu einem Feature gehört, muss am Anfang einen Kommentar enthalten, der explizit auf diese Dokumentation verweist. Beispiel: `/* Siehe _FUNKTIONSWEISE.md für weitere Informationen zu diesem Feature. */`
      3.  **Ziel:** Diese Regel zwingt jeden Bearbeiter (Mensch oder KI), sich zuerst mit dem "Was" und "Warum" zu befassen, bevor der Code geändert wird.

  - title: "API-Datenverträge & Synchronität"
    content: |
      Frontend und Backend kommunizieren über eine API. Diese Kommunikation basiert auf einem impliziten "Vertrag" darüber, wie die ausgetauschten Daten (JSON-Payloads) strukturiert sind. Die strikte Einhaltung dieses Vertrags ist entscheidend für die Stabilität der Anwendung.
      
      1.  **Einheitliche Datenstruktur:** Wenn das Backend für einen Endpunkt ein Objekt mit `{ "email": "...", "password": "..." }` erwartet, muss das Frontend **exakt dieses Format** senden. Schon eine kleine Abweichung (z.B. das Senden von `{ "username": "..." }`) führt zu einem `400 Bad Request`-Fehler, der schwer zu diagnostizieren sein kann.
      
      2.  **Synchronität bei Änderungen:** Wird ein Datenfeld in einem API-Endpunkt auf einer Seite (z.B. im Backend) geändert, muss **sofort** die entsprechende Gegenstelle (im Frontend) angepasst werden. 
      
      3.  **Warnendes Beispiel (Login-Problem):** Ein Fehler, bei dem das Backend von `username` auf `email` umgestellt wurde, das Frontend aber weiterhin `username` sendete, führte zu einem nicht funktionierenden Login, obwohl die Anmeldedaten korrekt waren.
      
      4.  **Dokumentation:** Komplexe oder kritische Endpunkte sollten in der jeweiligen `_FUNKTIONSWEISE.md`-Datei (z.B. im Backend-Controller) klar dokumentiert werden, welches Datenformat sie erwarten und zurückgeben.

  - title: "Prinzip der geteilten Komponenten (Don't Repeat Yourself)"
    content: |
      Logik, die an mehreren Stellen im Frontend benötigt wird, muss in eine wiederverwendbare, geteilte Komponente ausgelagert werden. Diese Komponenten werden im Verzeichnis `shared/components/` abgelegt.
      
      - **Ziel:** Vermeidung von Code-Duplizierung. Wenn eine Funktion an einer Stelle geändert werden muss, muss dies nicht an vielen anderen Stellen ebenfalls geschehen.
      
      - **Anwendungsbeispiel (Dynamic Form Builder):** Die Logik zum Erstellen von dynamischen Formularfeldern aus einer Konfigurationsdatei wird sowohl bei der Registrierung als auch bei der Benutzerbearbeitung im Admin-Panel benötigt. Anstatt den Code in beiden Modulen zu duplizieren, wurde er in `shared/components/dynamic-form/form-builder.js` zentralisiert. Beide Module importieren und verwenden nun diese eine, geteilte Komponente.

  - title: "Prinzip der minimalen Aktualisierung"
    content: |
      Das Aufrufen einer globalen Neulade-Funktion (wie `initializeAdminDashboard()`) ist ein "Vorschlaghammer", der die gesamte Ansicht neu erstellt und zu unerwünschten Nebeneffekten führen kann (z.B. hängende Animationen, Verlust des UI-Zustands).
      - **Regel:** Aktualisierungen müssen so gezielt wie möglich sein. Anstatt die ganze Seite neu zu laden, sollte eine Funktion nur die relevanten Daten neu abrufen und an eine spezialisierte UI-Funktion übergeben, die nur den betroffenen Teil des DOM (z.B. eine Liste) neu zeichnet. Das ist effizienter und vermeidet Fehler.

  - title: "Respektiere den Lebenszyklus von UI-Komponenten"
    content: |
      UI-Komponenten von Drittanbieter-Bibliotheken (insbesondere Bootstrap) sind nicht nur statisches HTML. Sie haben einen eigenen Lebenszyklus mit Zuständen und Events (z.B. wird angezeigt, ist sichtbar, wird ausgeblendet).
      - **Regel:** Wenn wir mit solchen Komponenten interagieren, müssen wir deren Lebenszyklus respektieren. Aktionen, die nach einer Animation stattfinden sollen (z.B. das Neuladen von Daten nach dem Schließen eines Modals), müssen an die von der Bibliothek bereitgestellten Events gekoppelt werden (z.B. `hidden.bs.modal` für Bootstrap). Das verhindert, dass wir einer Komponente "den Boden unter den Füßen wegziehen".

  - title: "Umgang mit trügerischen Werkzeugen (Vite Watcher)"
    content: |
      Manche Fehler werden nicht durch den eigenen Code, sondern durch die Konfiguration der Entwicklungswerkzeuge verursacht.
      - **Regel:** Wenn nach einer Dateiänderung ein unerklärlicher, kompletter Seiten-Reload auftritt, ist der erste Verdächtige immer die `watch`-Konfiguration des Entwicklungsservers (z.B. `vite.config.js`).
      - **Anweisung:** Alle Daten-Dateien (wie `.json`), die von der Anwendung selbst zur Laufzeit geändert werden, müssen von der Überwachung explizit ausgeschlossen werden (`server.watch.ignored`), da der Server sonst einen unnötigen Reload erzwingt.

  - title: "Historische Datenintegrität (Snapshot-Prinzip)"
    content: |
      Bei historischen Daten (wie Menüplänen) ist es entscheidend, dass einmal gespeicherte Informationen unveränderlich bleiben, um die Datenintegrität zu gewährleisten.
      - **Neue Dokumente:** Beim ersten Speichern wird automatisch ein "Snapshot" der aktuellen Stammdaten (z.B. Einrichtungseinstellungen) in das Dokument eingebettet.
      - **Bestehende Dokumente:** Der ursprüngliche Snapshot darf NIEMALS automatisch überschrieben werden, da dies die historische Genauigkeit zerstören würde.
      - **Explizite Updates:** Änderungen an Snapshots dürfen nur durch bewusste Benutzeraktionen erfolgen (z.B. "Einrichtungen aktualisieren"-Button).
      - **Rendering-Logik:** Die UI-Darstellung muss **vorhandene Snapshots bevorzugen** gegenüber aktuellen Stammdaten, um historische Korrektheit zu garantieren.
      - **Fehlerprävention:** Automatisches Neuladen von Plänen nach Snapshot-Updates ist zu vermeiden - stattdessen nur die betroffenen UI-Komponenten neu rendern.

### 📜 Neue Regel: Clean & Focused UI

-   **Reduzierte Ästhetik:** Wir bevorzugen ein klares, aufgeräumtes Design.
    -   **Eckige Kanten:** Container wie `cards` sollen die Klasse `rounded-0` erhalten, um einen modernen, scharfkantigen Look zu erzeugen.
    -   **Neutrale Aktionen:** Standard-Aktionen in Tabellen oder Listen (Bearbeiten, Löschen) sollen neutrale Buttons (`btn-light` oder `btn-secondary` mit `border`) verwenden, um visuelle Unruhe zu vermeiden.
    -   **Akzentuierte Hauptaktionen:** Primärfarben (`btn-primary`) sind für die wichtigste Aktion einer Ansicht reserviert (z.B. "Neu erstellen", "Speichern").

## 2. Architektur-Überblick

Wir verwenden eine modulare Monorepo-Architektur, die eine klare Trennung der Verantwortlichkeiten erzwingt.

### Die drei Säulen

*   `/frontend`: Die gesamte Benutzeroberfläche, entwickelt mit Vite.
*   `/backend`: Der Node.js/Express-Server für API-Logik und Datenbankkommunikation.
*   `/shared`: Ein zentraler Ordner für Code, Daten und Konfigurationen, die von Frontend und Backend gemeinsam genutzt werden.

### Frontend-Architektur: Core vs. Modules

Die Frontend-Struktur trennt den geschützten Kern von den erweiterbaren Modulen.

```mermaid
graph TD;
    subgraph Frontend;
        direction TB;
        A("core/") --> B("login/");
        A --> C("dashboard/");
        A --> D("admin-dashboard/");
        
        F("modules/") --> G("zutaten-erstellung-datenbank/");
        F --> H("bewohner-uebersicht/");
        F --> I("...");

        J("public/");
        K("vite.config.js");
        L("package.json");
    end

    style A fill:#D6EAF8,stroke:#333,stroke-width:2px
    style F fill:#D5F5E3,stroke:#333,stroke-width:2px
```

*   **`frontend/core/` (Der geschützte Kern):**
    *   Enthält die grundlegende Anwendungslogik: Login, Dashboard und Admin-Dashboard.
    *   Änderungen an diesem Code sind hochkritisch und erfordern besondere Sorgfalt und Tests.
    *   Regel: Module dürfen **niemals** direkt auf den Code eines anderen Moduls zugreifen. Die Kommunikation zwischen Modulen erfolgt immer über den Core (z.B. über Events oder geteilte Services).

*   **`frontend/modules/` (Der erweiterbare Bereich):**
    *   Hier leben alle fachlichen Module (Zutatenverwaltung, Bewohnerübersicht etc.).
    *   Jedes Modul ist eine eigenständige Einheit und folgt einem strengen Blueprint.
    *   Dies ist der primäre Ort für die Entwicklung neuer Features.

### Backend-Architektur: Modulares Plug-and-Play-System

Das Backend spiegelt die modulare Struktur des Frontends. Die `server.js` ist eine minimalistische Schaltzentrale.

```mermaid
graph TD;
    subgraph Backend;
        direction TB;
        A("server.js (Schaltzentrale)") --> B("modules/");
        
        subgraph "modules/ (Plug-ins)";
            direction TB;
            C("benutzer-profil/") --> C1("routes.js") --> C2("controller/");
            D("zutaten-erstellung-datenbank/") --> D1("routes.js") --> D2("controller/");
            E("...")
        end
    end

    style B fill:#D5F5E3,stroke:#333,stroke-width:2px
```

*   **Rolle der `server.js`:**
    *   Startet den Express-Server und verbindet sich mit der Datenbank.
    *   Lädt globale Middleware.
    *   **Importiert und registriert alle Modul-Routen.** Dabei werden Core-Module visuell von Feature-Modulen getrennt.

*   **Blueprint eines Backend-Moduls (`/modules/<modul-name>`):**
    *   **`routes.js`:** Eine "Mini-Schaltzentrale", die nur die Endpunkte des Moduls definiert und sie an die Controller-Logik bindet. Sie enthält selbst keine Geschäftslogik.
    *   **`controller/`:** Ein Ordner, der für jede einzelne Aktion (GET, POST, PUT, DELETE) eine separate, klar benannte Datei enthält (z.B. `getZutaten.js`, `createZutat.js`).
    *   **NEUE REGEL - Controller-Organisation:** Bei Modulen mit vielen Controllern (wie dem Admin-Modul) werden die Controller-Dateien thematisch in Unterordnern gruppiert (z.B. `controller/user-management/`, `controller/module-management/`). Dies hält die Struktur übersichtlich und wartbar. Die `routes.js` passt die Import-Pfade entsprechend an.

### Shared-Architektur: Das gemeinsame Gehirn

Der `shared`-Ordner ist entscheidend für die Code-Wiederverwendung und die Vermeidung von Duplizierung. Er folgt einer klaren, modularen Struktur.

```mermaid
graph TD;
    subgraph "shared/ (Gemeinsame Ressourcen)";
        direction LR;
        A("data/") --> A1("admin/");
        A --> A2("zutaten/");
        A --> A3("...");

        B("components/")
        
        C("admin/")
        D("zutaten/")
        E("...")
    end
```

*   **`shared/data/[modulname]/`:**
    *   **Zweck:** Enthält die JSON-Datendateien für ein bestimmtes Modul.
    *   **Beispiel:** Alle Daten, die zur Zutatenverwaltung gehören (`zutaten.json`, `kategorien.json`), liegen in `shared/data/zutaten/`.
    *   **Regel:** Dies ist die primäre Quelle für nicht-benutzerbezogene Anwendungsdaten.

*   **`shared/[modulname]/`:**
    *   **Zweck:** Enthält wiederverwendbaren JavaScript-Code, der spezifisch für ein Modul ist, aber sowohl vom Frontend als auch vom Backend benötigt wird.
    *   **Beispiel:** Ein Zod-Validierungsschema für ein Rezept-Objekt würde in `shared/rezepte/rezept-schema.js` liegen, damit Frontend und Backend dieselben Validierungsregeln verwenden.

*   **`shared/components/`:** Enthält globale, wiederverwendbare UI-Komponenten (z.B. der Header, Toast-Benachrichtigungen).

## 3. Setup & Start

1.  **Voraussetzungen:** Node.js v16 oder höher, laufende MongoDB-Instanz (lokal oder Atlas).

2.  **Umgebungsvariablen erstellen:**
    -   Navigieren Sie in das `backend`-Verzeichnis.
    -   Erstellen Sie eine neue Datei mit dem exakten Namen `.env`.
    -   Fügen Sie die folgenden Variablen hinzu und passen Sie die Werte an:
        ```
        # Ihr Verbindungsstring von MongoDB Atlas oder Ihrer lokalen Instanz
        MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
        
        # Ein beliebiger, langer und geheimer Schlüssel zur Signierung der Login-Tokens
        JWT_SECRET=DEIN_SUPER_GEHEIMES_WORT_HIER_EINFUEGEN
        
        # Backend-Port (Standard: 3000)
        BACKEND_PORT=3000
        
        # Entwicklungsumgebung
        NODE_ENV=development
        ```
    -   **Wichtig für MongoDB Atlas:** Stellen Sie sicher, dass Ihre IP-Adresse in der Whitelist steht.

3.  **Abhängigkeiten installieren:** Führen Sie `npm install` in den Hauptverzeichnissen `frontend/` und `backend/` aus.

4.  **Projekt starten:** Führen Sie `npm start` im Projekt-Root-Verzeichnis aus. Dieser Befehl startet parallel den Backend-Server (Port 3000) und den Frontend-Vite-Server (Port 5173+). Der Backend-Server sollte nun die Meldung "✅ MongoDB erfolgreich verbunden" ausgeben.

5.  **Tests ausführen:** Alle Tests laufen isoliert von der Produktionsumgebung mit `npm run test` oder `npm run test:isolated` im Backend-Verzeichnis.

## 4. Globale Code-Konventionen

Eine einheitliche Sprache ist entscheidend für die Wartbarkeit.

*   **Asynchroner Code:** Konsequente Nutzung von `async/await` für alle Promise-basierten Operationen. `.then()`-Ketten sind zu vermeiden.
*   **Variablen:** `const` ist der Standard. `let` wird nur verwendet, wenn ein Re-Assignment des Wertes unumgänglich ist. `var` ist verboten.
*   **Funktionen:**
    *   Klassische `function`-Deklarationen für benannte Top-Level-Funktionen (z.B. in Controllern), um einen klaren `this`-Kontext zu wahren.
    *   Pfeilfunktionen (`=>`) für anonyme Funktionen und Callbacks (z.B. in `Array.prototype.map`).
*   **Kommentare:** Alle Kommentare müssen auf **Deutsch** verfasst werden und den *Zweck* des Codes erklären, nicht die technische Umsetzung.
*   **Formatierung:** Ein einheitlicher Code-Formatierer (z.B. Prettier) wird empfohlen.

## 5. Wichtige Konfigurationen & Tools

*   **Vite-Aliase:** Für den Zugriff auf den `/shared`-Ordner aus dem Frontend müssen Vite-Aliase verwendet werden. Dies ist die einzig erlaubte Methode.
    *   **Korrekt:** `import ... from '@shared/utils/...'`
    *   **Falsch:** `import ... from '../../shared/utils/...'`
*   **Bootstrap 5:** Das primäre UI-Framework für Komponenten wie Buttons, Cards und Modals. Eigene Styles sollten auf ein Minimum reduziert werden.
*   **`shared/config/`:** Enthält zentrale, systemweite Konfigurationsdateien (z.B. `module-config.json`, `role-permissions.json`).
*   **Kein `fetch` für lokale Assets:** Lokale Projektdateien (Konfigurationen, HTML-Templates, etc.) dürfen **niemals** zur Laufzeit per `fetch()` geladen werden, da dies zu 404-Fehlern im Vite-Server führt.
    *   **Korrekt (für JS/JSON):** `import config from '@shared/config/module-config.json';`
    *   **Korrekt (für HTML/CSS/SVG...):** `import template from '@shared/components/header.html?raw';`
    *   **Falsch:** `fetch('/shared/config/module-config.json')`

## 6. Entwicklung von Modulen

Die Entwicklung neuer Module ist der Kern der Weiterentwicklung dieses Projekts. Um maximale Konsistenz und Qualität zu gewährleisten, muss jedes Modul exakt nach den Vorgaben des Modul-Blueprints erstellt werden.

**🛡️ WICHTIGER HINWEIS: Sicherheitssystem**
Das Projekt verfügt über ein umfassendes Sicherheitssystem für modulare Entwicklung:
- **Error-Boundary-System**: Verhindert App-Abstürze durch fehlerhafte Module
- **Einheitlicher API-Client**: Löst Backend/Frontend-Inkonsistenzen  
- **Backend Error-Middleware**: Verhindert Server-Abstürze
- **Module-Template**: Sichere Basis für neue Module

**➡️ Detaillierte Anleitungen finden Sie in:**
- `shared/docs/MODULARE-ENTWICKLUNG.md` - **Hauptanleitung für sichere Entwicklung**
- `frontend/modules/MODULE_BLUEPRINT.md` - Schritt-für-Schritt-Anleitung
- `shared/templates/module-template.js` - Sichere Vorlage für neue Module

## 7. Benutzer- & Authentifizierungssystem

Das Herzstück der Anwendung ist ein robustes System zur Verwaltung von Benutzern, Rollen und Berechtigungen.

### 7.1. Datenmodell (MongoDB)

Alle Benutzerdaten werden in einer MongoDB-Datenbank in der `users`-Collection gespeichert. Das Mongoose-Schema (`backend/models/User.js`) definiert die Struktur eines Benutzers und beinhaltet folgende Schlüsselfelder:

-   `email`: Eindeutige E-Mail-Adresse, dient als Login-Name.
-   `password`: Das mit bcrypt sicher gehashte Passwort des Benutzers.
-   `firstName`, `lastName`: Vor- und Nachname des Benutzers.
-   `role`: Definiert die Rolle des Benutzers als **String** (z.B. `"admin"`, `"Küche"`). Dies ist die Grundlage der Rechteverwaltung.
-   `isApproved`: Ein Boolean-Flag, das steuert, ob ein neu registrierter Benutzer sich anmelden darf.

### 7.2. Konfigurationsdateien (`shared/config`)

Die Flexibilität des Systems basiert auf zentralen Konfigurationsdateien:

-   `module-config.json`: Definiert alle verfügbaren Frontend-Module der Anwendung (Name und ID).
-   `form-fields.json`: Steuert, welche Felder im Registrierungsformular angezeigt und ob sie als Pflichtfelder behandelt werden.
-   `role-permissions.json`: **Das Kernstück der Rechteverwaltung.** Hier wird für jede Rolle (z.B. `Küche`, `Saal`) definiert, auf welche Module sie standardmäßig Zugriff hat.

### 7.3. Wichtige API-Endpunkte (`backend/server.js`)

-   `/api/auth/register`: Nimmt neue Benutzerregistrierungen entgegen.
-   `/api/auth/login`: Authentifiziert Benutzer und gibt ein JWT (JSON Web Token) zurück.
-   `/api/admin/users`: (Admin) Ruft die Liste aller Benutzer ab.
-   `/api/admin/user/:id`: (Admin) Aktualisiert die Daten eines spezifischen Benutzers.
-   `/api/role-permissions`: Ruft die Konfiguration der Rollenberechtigungen ab.
-   `/api/admin/role-permissions`: (Admin) Speichert die aktualisierten Rollenberechtigungen.

### 7.4. Frontend-Ablauf

1.  **Login (`/frontend/login`):** Der Benutzer meldet sich an. Bei Erfolg wird das erhaltene JWT im `localStorage` gespeichert.
2.  **Header (`/shared/components/header`):** Nach dem Login wird eine zentrale `initializeHeader`-Funktion aufgerufen. Diese ruft den `/api/user/current`-Endpunkt auf, um die Daten des eingeloggten Benutzers zu erhalten und den Header (z.B. Benutzername) zu füllen. Diese Funktion gibt das `user`-Objekt zurück, das dann von jeder Seite verwendet wird, um rollenbasierte Ansichten zu steuern.
3.  **Dashboard (`/frontend/dashboard`):** Dient als zentrale Anlaufstelle und leitet basierend auf den `allowedModules` des Benutzers auf die für ihn freigeschalteten Module weiter.

## 8. Info-Nachrichten an Benutzer

Das System beinhaltet eine Funktion, mit der Admins Nachrichten an bestimmte Benutzerrollen senden können, die nach dem Login als Modal angezeigt werden.

-   **Datenmodell:** `InfoNotification` in MongoDB (`backend/server.js`).
-   **Verwaltung:** Über den "Info an User"-Tab im Admin-Dashboard.
-   **Anzeige:** Die `fetchAndShowInfoNotifications`-Funktion in `header.js` ruft die relevanten Nachrichten ab und zeigt sie an.

## 9. Grundsätze für die Weiterentwicklung

-   **Stabilität vor Geschwindigkeit:** Neue Funktionen dürfen bestehende nicht beeinträchtigen. Änderungen müssen isoliert und auf ihre Auswirkungen auf das Gesamtsystem geprüft werden.
-   **Testpflicht bei größeren Änderungen:** Bei allen wesentlichen Änderungen – wie dem Refactoring von Kernmodulen, dem Hinzufügen komplexer neuer Features oder der Modifikation kritischer Datenflüsse – ist die Erstellung von Tests (Unit- oder Integrationstests) obligatorisch. Diese Tests validieren die neue Funktionalität und sichern bestehende Systemteile gegen Regressionen ab.
-   **Klare Datentrennung:**
    -   **Benutzerdaten** (Profile, Rollen etc.) gehören ausschließlich in die **MongoDB-Datenbank** und werden über das Backend verwaltet.
    -   **Anwendungsdaten** (z.B. Rezepte, Zutaten, Menüpläne) werden als JSON-Dateien im **`/shared/data`**-Verzeichnis gespeichert und bei Bedarf vom Frontend geladen.
-   **Nachvollziehbarkeit:** Code, Ordnerstrukturen und Dateinamen sollen klar und selbsterklärend sein, um die Einarbeitung und Wartung zu erleichtern.

## 🏗️ Projektstruktur

```
SmartWorkArt/
├── frontend/                    # Frontend-Anwendung
│   ├── login/                   # Loginseite (HTML, JS, CSS)
│   ├── dashboard/               # Übersicht nach Login
│   ├── module/                  # Alle Module einzeln
│   │   ├── mitarbeiter-uebersicht/            # Mitarbeiter Übersicht
│   │   ├── bewohner-uebersicht/               # Bewohner Übersicht
│   │   ├── zutaten-erstellung-datenbank/      # Zutaten Erstellung und Datenbank
│   │   ├── rezepte-erstellung-datenbank/      # Rezepte Erstellung und Datenbank
│   │   ├── menueerstellung/                   # Menüerstellung
│   │   ├── menueanzeige/                      # Menüanzeige
│   │   ├── einrichtungen-uebersicht/          # Einrichtungen Übersicht
│   │   ├── mahlzeiten-bestellung-intern/      # Mahlzeiten Bestellung Intern
│   │   ├── mahlzeit-bestellung-extern/        # Mahlzeit Bestellung Extern
│   │   └── mahlzeiten-bestellung-auswertung/  # Mahlzeiten Bestellung Auswertung
│   ├── node_modules/            # NPM-Pakete für das Frontend (Bootstrap, Vite etc.)
│   ├── dist/                    # Kompilierte, optimierte Frontend-Dateien
│   ├── package.json             # Frontend-Abhängigkeiten und Skripte
│   └── vite.config.js           # Konfigurationsdatei für Vite
│
├── backend/                     # Backend-Anwendung
│   ├── login/                   # Authentifizierung, Sitzungen
│   ├── dashboard/               # Modulliste, Systeminfos
│   ├── module/                  # Backend-Logik pro Modul
│   │   ├── mitarbeiter-uebersicht/
│   │   ├── bewohner-uebersicht/
│   │   ├── zutaten-erstellung-datenbank/
│   │   ├── rezepte-erstellung-datenbank/
│   │   ├── menueerstellung/
│   │   ├── menueanzeige/
│   │   ├── einrichtungen-uebersicht/
│   │   ├── mahlzeiten-bestellung-intern/
│   │   ├── mahlzeit-bestellung-extern/
│   │   └── mahlzeiten-bestellung-auswertung/
│   └── package.json             # Backend-Abhängigkeiten (z.B. Express)
│
├── shared/                      # Gemeinsame Ressourcen
│   ├── styles/                  # Zentrale CSS-Variablen, Icons, Themes
│   ├── utils/                   # Hilfsfunktionen (Logger, Validator)
│   ├── data/                    # Gemeinsame Inhalte
│   └── config/                  # Konfigurationsdateien
│       ├── module-config.json   # Sichtbarkeit, Namen, Reihenfolge der Module
│       └── system.json          # App-Einstellungen, Farben, Sprachen etc.
│
└── data/                        # Datenverzeichnis
    ├── mitarbeiter-uebersicht/
    ├── bewohner-uebersicht/
    ├── zutaten-erstellung-datenbank/
    └── ...
        └── archiv/              # Strukturierte Backups
```

## 🎯 Modul-Übersicht

### Modul 01: Mitarbeiter Übersicht 👨‍💼
- **Zweck**: Übersicht und Verwaltung aller Mitarbeiter im Seniorenheim
- **Features**: Mitarbeiterliste, Personalprofile, Dienstpläne, Qualifikationen, Kontaktdaten
- **Zielgruppe**: Personalabteilung, Administratoren, Manager

### Modul 02: Bewohner Übersicht 👥
- **Zweck**: Übersicht und Verwaltung aller Bewohner im Seniorenheim
- **Features**: Bewohnerliste, Bewohnerprofile, Medizinische Daten, Angehörigenkontakte, Zimmerzuordnung
- **Zielgruppe**: Pflegepersonal, Administratoren

### Modul 03: Zutaten Erstellung und Datenbank 🥕
- **Zweck**: Verwaltung und Erstellung von Zutaten in der Datenbank
- **Features**: Zutaten-Datenbank, Neue Zutaten erstellen, Zutaten bearbeiten, Allergeninformationen, Nährwertangaben
- **Zielgruppe**: Küchenpersonal, Administratoren

### Modul 04: Rezepte Erstellung und Datenbank 📖
- **Zweck**: Erstellung und Verwaltung von Rezepten in der Datenbank
- **Features**: Rezept-Datenbank, Neue Rezepte erstellen, Rezepte bearbeiten, Zutatenlisten, Zubereitungsanweisungen
- **Zielgruppe**: Küchenpersonal, Administratoren

### Modul 05: Menüerstellung 🍽️
- **Zweck**: Erstellung und Planung von Menüs für verschiedene Zeiträume
- **Features**: Menüplanung, Wöchentliche Menüs, Tagesmenüs, Diätanpassungen, Menüvorlagen
- **Zielgruppe**: Küchenpersonal, Manager

### Modul 06: Menüanzeige 📋
- **Zweck**: Anzeige und Präsentation der aktuellen Menüs
- **Features**: Aktuelle Menüs, Tagesübersicht, Wochenübersicht, Allergen-Hinweise, Menü-Druck
- **Zielgruppe**: Küchenpersonal, Pflegepersonal, Bewohner

### Modul 07: Einrichtungen Übersicht 🏢
- **Zweck**: Übersicht über alle Einrichtungen und Räumlichkeiten
- **Features**: Einrichtungsliste, Raumverwaltung, Ausstattung, Kapazitäten, Wartungsstatus
- **Zielgruppe**: Manager, Administratoren

### Modul 08: Mahlzeiten Bestellung Intern 🍴
- **Zweck**: Interne Bestellung von Mahlzeiten für Mitarbeiter
- **Features**: Mitarbeiter-Bestellungen, Bestellformular, Bestellhistorie, Bestätigungen, Abholzeiten
- **Zielgruppe**: Küchenpersonal, Mitarbeiter

### Modul 09: Mahlzeit Bestellung Extern 🛒
- **Zweck**: Externe Bestellung von Mahlzeiten für Besucher und Angehörige
- **Features**: Externe Bestellungen, Online-Bestellsystem, Zahlungsabwicklung, Lieferung, Bestellbestätigung
- **Zielgruppe**: Besucher, Angehörige, Küchenpersonal

### Modul 10: Mahlzeiten Bestellung Auswertung 📊
- **Zweck**: Auswertung und Statistiken zu Mahlzeitenbestellungen
- **Features**: Bestellstatistiken, Auswertungsberichte, Trendanalysen, Export-Funktionen, Dashboard
- **Zielgruppe**: Management, Küchenpersonal

## 📱 Mobile-First Design & Touch-Optimierung

SmartWorkArt ist vollständig für die mobile Nutzung optimiert, mit besonderem Fokus auf die Smartphone-Bedienung im Seniorenheim-Alltag.

### 🎯 **Mobile Design-Prinzipien:**
- **Mobile-First Ansatz:** Alle Module werden primär für Smartphones entwickelt
- **Touch-optimierte Interaktionen:** Native Touch-Events für präzise Bedienung
- **Responsive Layout-Switching:** Automatischer Wechsel zwischen Desktop- und Mobile-Layouts
- **Sticky Navigation:** Wichtige Controls bleiben beim Scrollen immer sichtbar

### 📋 **Menüplan-Modul: Vollständige Mobile-UX**

Das **Menüplan-Modul** dient als Referenz-Implementierung für optimale Mobile-UX:

#### **Desktop-Layout (>768px):**
- **8-spaltiges CSS-Grid:** Kategorien + 7 Wochentage
- **Sticky Headers:** Kategorie-Spalte und Wochentag-Header bleiben sichtbar
- **Standard Drag & Drop:** Maus-basierte Rezept-Verschiebung

#### **Mobile-Layout (≤768px):**
- **Accordion-Design:** Wochentage als expandierbare Karten
- **Auto-Expand:** Heutiger Tag öffnet sich automatisch
- **Kategorie-Icons:** Emoji-Icons für bessere Orientierung (🍲 Suppe, 🍽️ Menü 1)
- **Touch-Drag & Drop:** Native Touch-Events mit visuellem Feedback
- **Sticky Controls:** Navigation und Suche bleiben immer erreichbar

#### **Touch-Workflow:**
1. **Touch-Start:** Rezept antippen → Alle Drop-Zonen werden blau markiert
2. **Touch-Move:** Finger bewegen → Live-Validierung (grün = gültig, rot = ungültig)
3. **Touch-End:** Loslassen → Rezept wird verschoben + Bestätigung

#### **CSS-Implementierung:**
```css
.menueplan-controls {
    position: sticky;
    top: 0; /* Respektiert body padding-top: 70px */
    z-index: 1020;
    background-color: #f8f9fa;
}

@media (max-width: 768px) {
    .mobile-accordion { /* Accordion-Container für Mobile */ }
    .day-accordion-section { /* Expandierbare Tages-Karten */ }
    .touch-drop-zone-highlight { /* Touch-Feedback-Klassen */ }
}
```

### 🛠️ **Mobile-Entwicklungsrichtlinien:**

#### **Responsive Layout-Switching:**
```javascript
function renderGrid() {
    if (window.innerWidth <= 768) {
        renderMobileAccordion(); // Accordion für Mobile
    } else {
        renderDesktopGrid(); // CSS-Grid für Desktop
    }
}
```

#### **Native Touch-Events:**
```javascript
function initTouchSupport() {
    ['touchstart', 'touchmove', 'touchend'].forEach(eventType => {
        document.addEventListener(eventType, handleTouchEvent, { passive: false });
    });
}
```

#### **Sticky Controls Pattern:**
- **Navbar:** `position: fixed, top: 0` (Bootstrap .fixed-top)
- **Module Controls:** `position: sticky, top: 0` (nutzt body padding-top)
- **Ergebnis:** Controls kleben direkt unter Navbar, bleiben bei Touch-Drag sichtbar

### 📏 **Mobile Testing-Checklist:**
- [ ] Layout-Switching funktioniert bei Bildschirmgrößen-Änderung
- [ ] Touch-Drag & Drop auf Smartphones getestet
- [ ] Sticky Controls bleiben bei Touch-Interaktionen sichtbar
- [ ] Auto-Expand und Kategorie-Icons funktional
- [ ] Visual Touch-Feedback (Blau/Grün/Rot) korrekt
- [ ] Horizontal Scroll bei kompakten Elementen (z.B. Rezept-Pills)

### 🎨 **Mobile UI-Komponenten:**
- **Accordion-Sektionen:** Expandierbare Container für komplexe Inhalte
- **Touch-optimierte Buttons:** Mindestgröße 44px für Finger-Navigation
- **Emoji-Icons:** Universelle Kategorie-Kennzeichnung
- **Horizontale Pills:** Kompakte Listen für begrenzte Bildschirmbreite
- **Visual Touch-Feedback:** Farbkodierte Drop-Zonen für präzise Platzierung

**🏆 Das Mobile-First Design macht SmartWorkArt zum idealen Tool für den mobilen Alltag im Seniorenheim!**

## 🚀 Installation & Setup

### Voraussetzungen
- Node.js (Version 16 oder höher)
- npm

### Backend-Setup
```bash
# Im Hauptverzeichnis (SmartWorkArt/)
cd backend
npm install
# Starten Sie den Backend-Server (genauer Befehl muss noch definiert werden)
npm start 
```

### Frontend-Setup
```bash
# Im Hauptverzeichnis (SmartWorkArt/)
cd frontend
npm install
```

## 🛠️ Entwicklung

### Frontend-Entwicklung mit Vite
Um den Frontend-Entwicklungsserver zu starten, navigieren Sie in den `frontend`-Ordner und führen Sie folgenden Befehl aus:
```bash
# Im /frontend Ordner
npm run dev
```
Vite startet einen Hot-Reload-Server, der Ihren Browser automatisch öffnet und bei jeder Code-Änderung aktualisiert.

Um die finalen, optimierten Dateien für die Produktion zu erstellen, verwenden Sie:
```bash
# Im /frontend Ordner
npm run build
```
Die fertigen Dateien werden im `frontend/dist`-Ordner abgelegt.

### Fehlerbehebung
- **404 Not Found für `/shared/...` Dateien**: Wenn beim Ausführen von `npm run dev` eine Datei aus dem `/shared` Ordner nicht gefunden wird, liegt das daran, dass der Vite-Entwicklungsserver standardmäßig nur auf Dateien innerhalb des `frontend`-Ordners zugreift.
  - **Lösung**: In der `frontend/vite.config.js` wurde die Option `server.fs.allow` hinzugefügt, um den Zugriff auf das übergeordnete Verzeichnis (`..`) zu erlauben. Dies behebt das Problem.

### Code-Stil
- **JavaScript (ES6+)**: Moderne JavaScript-Features mit Modulen, verarbeitet durch Vite.
- **CSS3**: Moderne Styling mit CSS-Variablen.
- **Bootstrap 5**: Frontend-Framework für responsive Komponenten.
- **Vite**: Build-Tool und Entwicklungsserver für das Frontend.

### Backend
- **Node.js**: Server-Side JavaScript
- **Express.js**: Web-Framework
- **MongoDB**: NoSQL-Datenbank für flexible Datenhaltung.
- **Mongoose**: Object Data Modeling (ODM) für MongoDB.
- **JWT**: Authentifizierung (geplant)

### Tools & Utilities
- **Vite**: Schnelles Build-Tool und Dev-Server für das Frontend.
- **npm**: Paketverwaltung für Frontend und Backend.
- **CSS-Variablen**: Einheitliches Design-System.

## 📱 Responsive Design

Das System ist vollständig responsive und optimiert für:
- **Desktop**: 1200px und größer
- **Tablet**: 768px - 1199px
- **Mobile**: 320px - 767px

## 🔐 Sicherheit

- **Authentifizierung**: JWT-basierte Sessions
- **Autorisierung**: Rollenbasierte Zugriffskontrolle
- **Validierung**: Input-Validierung auf Client und Server
- **CSRF-Schutz**: Cross-Site Request Forgery Protection
- **XSS-Schutz**: Cross-Site Scripting Protection

## 📊 Features

### Kernfunktionen
- ✅ Modulare Architektur
- ✅ Responsive Design
- ✅ Rollenbasierte Zugriffskontrolle
- ✅ Mehrsprachigkeit (DE/EN)
- ✅ Dark Mode
- ✅ Auto-Save
- ✅ Export/Import-Funktionen
- ✅ Suchfunktion
- ✅ Benachrichtigungssystem

### Küchenverwaltung
- ✅ Zutaten-Datenbank
- ✅ Rezeptverwaltung
- ✅ Menüplanung
- ✅ Allergenverwaltung
- ✅ Bestellsystem (Intern/Extern)
- ✅ Auswertungen

## 🤝 Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe `LICENSE` Datei für Details.

## 👥 Team

- **Entwicklung**: SmartWorkArt
- **Design**: SmartWorkArt
- **Konzept**: SmartWorkArt

## 📞 Support

Bei Fragen oder Problemen:
- **Email**: support@smartworkart.de
- **Issues**: GitHub Issues
- **Dokumentation**: [Wiki](https://github.com/smartworkart/seniorenheim-verwaltung/wiki)

---

**Entwickelt mit ❤️ für Seniorenheime** 

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**
    -   **Problem:** Kleine Checkboxen sind auf Touch-Geräten schwer zu treffen und bieten eine schlechte User Experience.
    -   **Regel:** Für die Auswahl mehrerer Optionen (wie z.B. Allergene) müssen anstelle von Checkboxen klickbare Buttons (`<button type="button">`) verwendet werden. Der Zustand der Auswahl wird über eine `.active`-Klasse gesteuert. Dies bietet eine größere, benutzerfreundlichere Zielfläche. Die Anordnung sollte in einem flexiblen Grid erfolgen, um den Platz optimal zu nutzen.

#### Datenmanagement & Struktur

1.  **Daten-Struktur: Verschachtelte Objekte für Klarheit**
    -   **Regel:** Bei der Strukturierung von Datenmodellen sollten verschachtelte Objekte verwendet werden, um die Beziehungen und Hierarchien klar darzustellen.
    -   **Anwendungsbeispiel:** Wenn ein Rezept mehrere Zutaten enthält, können diese als verschachtelte Objekte in einem Array oder als verschachtelte Objekte innerhalb eines Objekts strukturiert werden.

2.  **Werte-Normalisierung:** Bei der Zuweisung von Daten an UI-Elemente (z.B. `select`-Dropdowns) müssen die Werte normalisiert werden (z.B. Umwandlung in Kleinbuchstaben, Abgleich von Vollnamen und Abkürzungen), um eine korrekte Zuordnung zu gewährleisten.

3.  **Mobile-First-UI: Buttons statt Checkboxen für Mehrfachauswahl**