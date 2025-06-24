# Funktionsweise: Admin-Dashboard-Navigation

Dieses Dokument beschreibt die Funktionsweise des Features "Admin-Dashboard-Navigation".

## Zweck

Dieses Feature ist verantwortlich für die Darstellung der linken Sidebar-Navigation im Admin-Dashboard. Es stellt sicher, dass alle verfügbaren Admin-Funktionen als klickbare Links angezeigt werden.

## Dateien und Verantwortlichkeiten

-   **`admin-navigation-ui.js`**:
    -   Verantwortlich für die gesamte DOM-Manipulation der Sidebar.
    -   Enthält die Funktion `renderAdminSidebar(container, features, onNavigate)`, die eine Liste von Feature-Objekten entgegennimmt und daraus eine klickbare Navigationsleiste erstellt.
    -   Löst den `onNavigate`-Callback aus, wenn ein Link geklickt wird.

## Datenquelle

-   `shared/config/admin-features-config.json`: Dieses Feature liest die Konfigurationsdatei, um zu wissen, welche Navigationspunkte gerendert werden sollen.

## Einbindung

Die Haupt-Skriptdatei des Admin-Dashboards (`/core/admin-dashboard/js/script.js`) importiert `renderAdminSidebar`, übergibt den Sidebar-Container und die Feature-Konfiguration und definiert, was passieren soll, wenn ein Navigationspunkt angeklickt wird. 