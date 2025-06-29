# Admin Benachrichtigungen

Dieser Ordner enthält alle Daten für das Admin-Benachrichtigungssystem.

## Dateien

### notifications.json
Enthält alle erstellten Admin-Benachrichtigungen mit folgender Struktur:
- `id`: Eindeutige UUID der Benachrichtigung
- `title`: Titel der Benachrichtigung
- `message`: Nachrichtentext
- `trigger`: Auslöser (onLogin, once, interval)
- `triggerValue`: Optionaler Wert für den Trigger
- `targetRoles`: Array der Zielgruppen (admin, Koch, etc.)
- `active`: Status der Benachrichtigung (true/false)
- `createdAt`: Erstellungsdatum (ISO String)

## Verwendung

Die Benachrichtigungen werden über die Backend-API verwaltet:
- **GET** `/api/notifications` - Alle Benachrichtigungen abrufen
- **POST** `/api/notifications` - Neue Benachrichtigung erstellen
- **PUT** `/api/notifications/:id` - Benachrichtigung aktualisieren
- **DELETE** `/api/notifications/:id` - Benachrichtigung löschen

## Betroffene Backend-Controller

Die folgenden Controller greifen auf diese Dateien zu:
- `backend/modules/notifications/controller/createNotification.js`
- `backend/modules/notifications/controller/deleteNotification.js`
- `backend/modules/notifications/controller/getAllNotifications.js`
- `backend/modules/notifications/controller/updateNotification.js`
- `backend/modules/auth/controller/getUnreadNotifications.js` 