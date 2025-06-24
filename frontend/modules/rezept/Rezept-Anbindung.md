# Rezept-Modul: Datenstruktur und Anbindung

Dieses Dokument definiert den "Datenvertrag" für das Rezept-Modul. Alle Komponenten, sowohl im Frontend als auch im Backend, müssen sich an diese Struktur halten.

## 1. Datenstruktur (`rezepte.json`)

Ein einzelnes Rezept-Objekt hat die folgende Struktur.

```json
{
  "id": "rezept-1750849301933-randomstring",
  "name": "Spaghetti Carbonara",
  "kategorie": "Hauptspeise",
  "anleitung": "1. Speck anbraten. 2. Eier und Käse mischen...",
  "zutaten": [
    {
      "zutatId": "zutat-12345-abcdef",
      "menge": 150,
      "einheit": "g"
    },
    {
      "zutatId": "zutat-67890-ghijk",
      "menge": 2,
      "einheit": "Stk"
    }
  ],
  "isActive": true,
  "createdAt": "2025-06-24T10:21:41.933Z",
  "updatedAt": "2025-06-24T10:21:41.933Z",
  "createdBy": {
    "userId": "679f7a109d1d8b3535030897",
    "name": "Max Mustermann"
  },
  "updatedBy": {
    "userId": "679f7a109d1d8b3535030897",
    "name": "Max Mustermann"
  }
}
```

### Feld-Beschreibung:
-   `id` (String): Einzigartiger, automatisch generierter Identifikator.
-   `name`, `kategorie`, `anleitung` (String): Vom Benutzer eingegebene Kerndaten.
-   `zutaten` (Array): Eine Liste von Objekten, die die Verknüpfung zu einer Zutat darstellen.
    -   `zutatId`: Die ID der verknüpften Zutat aus `zutaten.json`.
    -   `menge`: Die für dieses Rezept benötigte Menge.
    -   `einheit`: Die verwendete Einheit (z.B. "g", "ml", "Stk"). Diese wird zum Zeitpunkt der Hinzufügung aus dem Zutat-Stamm übernommen.
-   `isActive` (Boolean): Für Soft-Deletes.
-   `createdAt`, `updatedAt` (String): ISO 8601 Zeitstempel, die automatisch vom Backend verwaltet werden. `createdAt` wird bei der Erstellung gesetzt und bleibt unverändert. `updatedAt` wird bei jeder Änderung aktualisiert.
-   `createdBy`, `updatedBy` (Object): Speichert die ID und den Namen des Benutzers, der den Datensatz erstellt bzw. zuletzt geändert hat.

## 2. Wichtige Backend-Controller

-   `createRezept.js`: Nimmt die Rezeptdaten entgegen, reichert sie mit `id`, `isActive`, Zeitstempeln und Benutzerinformationen an und speichert sie.
-   `updateRezept.js`: Aktualisiert ein bestehendes Rezept. Setzt `updatedAt` und `updatedBy` neu und füllt `createdAt` bei Altdatensätzen auf.
-   `getRezepte.js`: Holt alle Rezepte mit `isActive: true`.
-   `getRezeptStammdaten.js`: Liefert statische Daten wie z.B. die Liste der verfügbaren Kategorien.

## 3. Frontend API (`rezept-api.js`)

Diese Datei kapselt die gesamte Kommunikation mit den oben genannten Endpunkten.
-   **Authentifizierung:** Alle schreibenden Operationen (`createRezept`, `updateRezept`, `deleteRezept`) **müssen** den JWT-Token des angemeldeten Benutzers aus dem `localStorage` lesen und als `Authorization: Bearer <TOKEN>` im Header der Anfrage mitsenden.
-   **Fehlerbehandlung:** Jede Funktion behandelt Netzwerk- und Serverfehler und gibt eine verständliche Fehlermeldung zurück. 