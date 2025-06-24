# Funktionsweise: Feature "Benachrichtigungsverwaltung"

Dieses Feature ist eine Admin-Oberfläche zur Verwaltung von globalen Benachrichtigungen, die Benutzern als Toast-Nachrichten angezeigt werden können. Es ermöglicht Administratoren, diese Benachrichtigungen zu erstellen, zu bearbeiten, zu löschen und ihre Zielgruppen (basierend auf Benutzerrollen) sowie ihre Auslöser zu definieren.

## Verantwortlichkeiten der Dateien

### `notifications-api.js`
- **Kommunikation mit dem Backend:** Kapselt alle `fetch`-Aufrufe zu den Endpunkten des Benachrichtigungs-Moduls im Backend (`/api/notifications`).
- Stellt asynchrone Funktionen für alle CRUD-Operationen bereit (`getAllNotifications`, `createNotification`, `updateNotification`, `deleteNotification`).
- Dient als klare Abstraktionsschicht zwischen der Frontend-Logik und der Backend-API.

### `notifications-ui.js`
- **Darstellung & UI-Events:** Verantwortlich für die Erstellung und Verwaltung des HTML-DOM für die Benutzeroberfläche.
- `renderNotificationsUI()`: Zeichnet die Haupt-UI, einschließlich der Tabelle und des Modals.
- `createNotificationRow()`: Erstellt eine einzelne Zeile für die Benachrichtigungstabelle.
- `showNotificationModal()`: Steuert die komplexe Logik zum Anzeigen, Befüllen und Zurücksetzen des Modals zum Hinzufügen/Bearbeiten von Benachrichtigungen.

### `script.js` (im Hauptverzeichnis des Admin-Dashboards)
- **Temporärer Orchestrator:** Aufgrund eines technischen Problems bei der Erstellung der `index.js`-Datei für dieses Feature, befindet sich die Steuerungslogik **vorübergehend** in der Haupt-`script.js`.
- `loadNotificationsFeature()`: Diese Funktion agiert als der eigentliche "Controller" für das Feature.
    - Sie ruft `getAllNotifications()` aus der API-Schicht auf.
    - Sie definiert die `callbacks` (`onSave`, `onDelete`), die die Aktionen aus der UI entgegennehmen.
    - Sie ruft die entsprechenden API-Funktionen auf (z.B. `createNotification`).
    - Nach einer erfolgreichen Aktion lädt sie die Ansicht neu, um die Änderungen anzuzeigen.
- **ToDo:** Diese Logik sollte in eine eigene `features/notifications/index.js`-Datei ausgelagert werden, sobald das technische Problem behoben ist, um die Code-Struktur sauber zu halten und unseren Architekturregeln zu entsprechen. 