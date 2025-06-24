# Funktionsweise: `admin-api.js`

Dieses Modul ist die **einzige und zentrale API-Schnittstelle** für das gesamte Admin-Dashboard. Es kapselt die gesamte Backend-Kommunikation und stellt eine einheitliche, robuste Methode für authentifizierte Anfragen bereit.

## Architektur & Verantwortlichkeiten

1.  **Private Hilfsfunktion `fetchWithAuth`:**
    -   Das Herzstück dieses Moduls. Diese `private` Funktion wird von allen exportierten Funktionen intern genutzt.
    -   Sie holt den JWT aus dem `localStorage`. Falls kein Token vorhanden ist, leitet sie sofort zum Login weiter.
    -   Sie baut den `Authorization`-Header und fügt ihn zu jeder Anfrage hinzu.
    -   Sie fängt `401/403`-Fehler ab, entfernt ungültige Tokens und leitet zum Login um. Dies stellt sicher, dass die Anwendung niemals mit einer ungültigen Sitzung weiterläuft.
    -   Sie standardisiert die Fehlerbehandlung für alle anderen Netzwerk- oder Serverfehler.

2.  **Exportierte API-Funktionen:**
    -   Das Modul exportiert eine Reihe von klar benannten Funktionen, die jeweils einen spezifischen Endpunkt ansprechen (z.B. `fetchAllUsers`, `updateUser`, `getCustomFields`).
    -   Diese Funktionen sind extrem schlank. Ihre einzige Aufgabe ist es, `fetchWithAuth` mit der korrekten URL, HTTP-Methode und ggf. einem `body` aufzurufen.
    -   **Beispiel:** `export async function fetchAllUsers() { return fetchWithAuth('/api/admin/users'); }`

## Verwendung

Der Orchestrator (`script.js`) importiert alle benötigten Admin-Funktionen **ausschließlich** aus dieser Datei.

```javascript
// in script.js
import { 
    fetchAllUsers, 
    updateUser, 
    getCustomFields 
} from './admin-api.js';

// ...
const users = await fetchAllUsers();
// ...
await updateUser(userId, data);
```

Dieses Design stellt sicher, dass die Feature-Logik im Orchestrator sauber und von den Details der API-Kommunikation vollständig entkoppelt ist. Die Fehlerbehandlung (z.B. bei ungültigen Tokens) geschieht automatisch und muss nicht in jedem Feature neu implementiert werden. 