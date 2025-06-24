# Funktionsweise: `script.js` (Admin-Dashboard Orchestrator)

Dieses Skript ist der **zentrale Dirigent** für das Admin-Dashboard. Es initialisiert die gesamte Ansicht, verwaltet den Zustand und steuert, welches Feature angezeigt wird.

## Verantwortlichkeiten

1.  **Initialisierung (`initializeAdminDashboard`):**
    -   Prüft via `initializeHeader()`, ob ein Benutzer angemeldet ist und die `admin`-Rolle besitzt. Leitet andernfalls um.
    -   Ruft **einmalig** alle Benutzerdaten über `fetchAllUsers()` ab und speichert sie in einem lokalen Cache (`allUsersCache`), um wiederholte API-Aufrufe zu vermeiden.
    -   Berechnet aus dem Cache die Anzahl der ausstehenden Genehmigungen (`pendingUsers.length`).
    -   Rendert die `renderAdminNavigation` und übergibt ihr die Feature-Liste, die Anzahl der Genehmigungen und einen Verweis auf die `handleNavigation`-Funktion als Callback.
    -   Ruft `handleNavigation` für das erste Feature auf, um den Standard-Inhalt zu laden.

2.  **Navigation & Feature-Rendering (`handleNavigation`):**
    -   Diese Funktion agiert als **zentraler Router** für den Inhaltsbereich. Sie wird bei der Initialisierung und bei jedem Klick auf einen Navigationspunkt aufgerufen.
    -   Sie leert den Inhaltscontainer und erstellt einen neuen, leeren `div` mit einer eindeutigen ID für das ausgewählte Feature (z.B. `<div id="user-management-content"></div>`).
    -   Sie enthält eine `switch`- (oder `if-else`)-Logik, die basierend auf der `featureId` den passenden Code-Block ausführt.
    -   **Für jedes Feature:**
        -   Sie filtert die benötigten Daten aus dem `allUsersCache`.
        -   Sie ruft die entsprechende `render...` oder `initialize...`-Funktion des Feature-UI-Moduls auf und übergibt dieser den neuen Container, die gefilterten Daten und die notwendigen Callback-Funktionen.
        -   **Callback-Definition:** Die Callbacks (z.B. `onApprove`, `onDelete`) werden hier definiert. Sie rufen die entsprechenden API-Funktionen aus `admin-api.js` auf und stoßen bei Erfolg einen vollständigen Neustart über `initializeAdminDashboard()` an, um die gesamte Ansicht (inkl. Badge in der Navigation) zu aktualisieren.

3.  **Zentralisierung:** Die Logik für einfachere Features (wie `field-configurator`) ist vollständig in den entsprechenden `case`-Block in `handleNavigation` integriert, um die Anzahl der Dateien zu reduzieren.

4.  **Komponenten-Rendering:** Es stößt das Rendern der Hauptkomponenten an:
    -   **Navigation:** Es ruft `renderAdminNavigation` auf und übergibt die Liste der Features sowie den `pendingCount`, damit die Navigation das Benachrichtigungs-Badge anzeigen kann.
    -   **Inhaltsbereich:** Es ruft `handleNavigation` auf, um das Standard-Feature (z.B. die Benutzerverwaltung) im Hauptbereich zu laden.

5.  **Feature-Management (`handleNavigation`):**
    -   Die Funktion `handleNavigation` agiert als Router. Basierend auf der Auswahl in der Navigation lädt sie das entsprechende Feature-Modul in den `admin-feature-container`.
    -   Sie filtert die benötigten Daten aus einem globalen Cache (`allUsersCache`).
    -   Sie definiert und übergibt die notwendigen Callbacks an die UI-Funktionen der Features. Bei Erfolg rufen diese Callbacks `initializeAdminDashboard()` auf, um die gesamte Ansicht zu aktualisieren.

## Ablaufdiagramm (Aktualisiert)

```mermaid
graph TD
    A[Start: Seite laden] --> B{initializeAdminDashboard};
    B --> C{initializeHeader & Auth-Check};
    C -- Ja, Admin --> D[fetchAllUsers in Cache];
    C -- Nein --> E[Redirect];
    
    D --> F[pendingCount berechnen];
    F --> G[renderAdminNavigation<br>(übergibt handleNavigation als Callback)];
    G --> H[handleNavigation für Default-Feature];

    subgraph "Navigation & Rendering"
        direction LR
        H --> I{Feature-ID?};
        I -- user-management --> J[Filtere Cache<br>rufe renderUserTable];
        I -- user-approval --> K[Filtere Cache<br>rufe initializeUserApproval];
        I -- field-config --> L[Rufe getCustomFields<br>rufe renderFieldConfigurator];
    end

    subgraph "User-Interaktion im Feature"
        direction TB
        M[UI wird gerendert] -- Klick auf 'Löschen' --> N{Callback onDelete wird ausgeführt};
        N --> O[deleteUser() aus admin-api.js];
        O --> B;
    end

    G -- Klick auf anderen Nav-Punkt --> H;

``` 