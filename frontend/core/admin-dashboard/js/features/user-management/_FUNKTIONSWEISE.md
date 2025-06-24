# Funktionsweise: Benutzerverwaltung

Dieses Dokument beschreibt die Funktionsweise des Features "Benutzerverwaltung" innerhalb des Admin-Dashboards.

## Zweck

Dieses Feature ermöglicht es Administratoren, alle im System registrierten Benutzer einzusehen. Es ist die Grundlage für zukünftige Aktionen wie das Bearbeiten, Genehmigen oder Löschen von Benutzern.

## Dateien und Verantwortlichkeiten

-   **`user-management-api.js`**:
    -   Verantwortlich für die gesamte API-Kommunikation.
    -   Enthält die Funktion `fetchAllUsers()`, die den Endpunkt `/api/admin/users` aufruft, um die Benutzerdaten vom Backend abzurufen.

-   **`user-management-ui.js`**:
    -   Verantwortlich für die Darstellung der Daten im DOM.
    -   Enthält die Funktion `renderUserTable(users)`, die ein Array von Benutzerobjekten entgegennimmt und daraus eine Bootstrap-Tabelle in das dafür vorgesehene Container-Element im Admin-Dashboard rendert.

## Einbindung

Die Haupt-Skriptdatei des Admin-Dashboards (`/core/admin-dashboard/js/script.js`) importiert die Funktionen aus diesen beiden Modulen, ruft zuerst `fetchAllUsers()` auf und übergibt das Ergebnis dann an `renderUserTable()`. 