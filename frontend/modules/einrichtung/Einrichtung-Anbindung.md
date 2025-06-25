# Einrichtung-Modul: Datenstruktur und Anbindung

> **🛡️ SICHERHEIT:** Dieses Modul MUSS das neue Sicherheitssystem verwenden! Siehe `shared/docs/MODULARE-ENTWICKLUNG.md` für sichere Implementierung mit Error-Boundary und einheitlichem API-Client.

Dieses Dokument definiert den "Datenvertrag" für das Einrichtung-Modul. Alle Komponenten, sowohl im Frontend als auch im Backend, müssen sich an diese Struktur halten.

## 1. Datenstruktur (`einrichtungen.json`)

Ein einzelnes Einrichtungs-Objekt hat die folgende Struktur.

```json
{
  "id": "einrichtung-1750849301933-randomstring",
  "name": "Seniorenresidenz am Park",
  "kuerzel": "SAP",
  "adresse": "Hauptstraße 1, 12345 Musterstadt",
  "ansprechperson": "Erika Mustermann",
  "telefon": "01234-567890",
  "email": "info@sap.de",
  "isIntern": false,
  "personengruppe": "Senioren",
  "tour": "Tour-A",
  "speiseplan": {
    "Montag": { "suppe": true, "hauptspeise": true, "dessert": false },
    "Dienstag": { "suppe": true, "hauptspeise": true, "dessert": false }
    // ... weitere Tage
  },
  "gruppen": [
    {
      "name": "Wohnbereich 1",
      "anzahl": 15
    },
    {
      "name": "Wohnbereich 2",
      "anzahl": 20
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
-   `name`, `kuerzel`, `adresse`, etc. (String): Vom Benutzer eingegebene Kerndaten.
-   `isIntern` (Boolean): Gibt an, ob es sich um eine interne (`true`) oder externe (`false`) Einrichtung handelt.
-   `speiseplan` (Object): Ein Objekt, das für jeden Wochentag die Auswahl der Speisekomponenten speichert.
-   `gruppen` (Array): Eine Liste von Objekten, die die untergeordneten Gruppen mit Namen und Personenanzahl definieren.
-   `isActive` (Boolean): Für Soft-Deletes.
-   `createdAt`, `updatedAt` (String): ISO 8601 Zeitstempel, die automatisch vom Backend verwaltet werden.
-   `createdBy`, `updatedBy` (Object): Speichert die ID und den Namen des Benutzers, der den Datensatz erstellt bzw. zuletzt geändert hat.

## 2. Wichtige Backend-Controller

-   `createEinrichtung.js`: Nimmt die Einrichtungsdaten entgegen, validiert sie gegen das Zod-Schema, reichert sie mit `id`, Zeitstempeln und Benutzerinfos an und speichert sie.
-   `updateEinrichtung.js`: Aktualisiert eine bestehende Einrichtung und setzt `updatedAt` und `updatedBy` neu.
-   `getEinrichtungen.js`: Holt alle Einrichtungen mit `isActive: true`.
-   `getEinrichtungStammdaten.js`: Liefert statische Daten wie Touren und Personengruppen aus `einrichtungen-stammdaten.json`.
-   `deleteEinrichtung.js`: Führt einen Soft-Delete durch, indem `isActive` auf `false` gesetzt wird.

## 3. Frontend API (`einrichtung-api.js`)

Diese Datei kapselt die gesamte Kommunikation mit den oben genannten Endpunkten.
-   **Authentifizierung:** Alle schreibenden Operationen (`createEinrichtung`, `updateEinrichtung`, `deleteEinrichtung`) **müssen** den JWT-Token des angemeldeten Benutzers aus dem `localStorage` lesen und als `Authorization: Bearer <TOKEN>` im Header der Anfrage mitsenden.
-   **Fehlerbehandlung:** Jede Funktion behandelt Netzwerk- und Serverfehler und gibt eine verständliche Fehlermeldung zurück, die über den Toast-Mechanismus angezeigt wird.
-   **Validierung:** Die `einrichtung-form-ui.js` nutzt das geteilte Validierungsschema aus `shared/einrichtungen/einrichtung.validation.js`, um die Benutzereingaben zu prüfen, *bevor* die Daten an die API gesendet werden. 