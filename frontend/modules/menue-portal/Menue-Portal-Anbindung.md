# Menue-Portal-Modul: Datenstruktur und Anbindung

> **🛡️ SICHERHEIT:** Dieses Modul MUSS das neue Sicherheitssystem verwenden! Siehe `shared/docs/MODULARE-ENTWICKLUNG.md` für sichere Implementierung mit Error-Boundary und einheitlichem API-Client.

Dieses Dokument definiert den "Datenvertrag" für das Menue-Portal-Modul. Alle Komponenten, sowohl im Frontend als auch im Backend, müssen sich an diese Struktur halten.

## 1. Datenquellen (Wo liegen die Daten?)

Das Menue-Portal-Modul nutzt verschiedene Datenquellen:

- **API-Endpunkte:**
  - `/api/user/current` - Aktueller Benutzer mit Einrichtungszuordnungen
  - `/api/menueplan/{year}/{week}` - Menüplan für spezifische Woche
  - `/api/portal/stammdaten` - Portal-spezifische Stammdaten

- **Shared-Data:**
  - `shared/data/portal/portal-stammdaten.json` - Kategorien und Konfiguration
  - `shared/data/rezepte/rezepte.json` - Rezept-Details für Anzeige

## 2. Zentrale Datenstruktur (Benutzer mit Einrichtungszuordnung)

```json
{
  "id": "user-679f7a109d1d8b3535030897",
  "firstName": "Max",
  "lastName": "Mustermann", 
  "email": "max@beispiel.de",
  "role": "Benutzer",
  "einrichtungen": [
    "einrichtung-abc-123",
    "einrichtung-def-456"
  ]
}
```

## 3. Menüplan-Datenstruktur (Read-Only)

```json
{
  "year": 2025,
  "week": 26,
  "einrichtung": {
    "id": "einrichtung-abc-123",
    "name": "Haus Sonnenschein",
    "kuerzel": "HS"
  },
  "days": {
    "montag": {
      "suppe": [
        {
          "id": "rezept-123",
          "name": "Tomatensuppe",
          "allergene": ["C"]
        }
      ],
      "menu1": [
        {
          "id": "rezept-456", 
          "name": "Schnitzel mit Pommes",
          "allergene": ["A", "C", "G"]
        }
      ]
    }
    // ... weitere Wochentage
  }
}
```

## 4. Wichtige Backend-Controller

- **`getPortalStammdaten.js`**: Liefert Portal-spezifische Konfigurationsdaten
- **`getCurrentUser.js`**: Holt aktuellen Benutzer mit Einrichtungszuordnungen
- **`getMenueplanForEinrichtung.js`**: Lädt Menüplan für spezifische Einrichtung und Woche

## 5. Frontend API (`menue-portal-api.js`)

Diese Datei kapselt die gesamte Kommunikation mit den Backend-Endpunkten:

- **Authentifizierung:** Alle Anfragen **müssen** den JWT-Token aus dem `localStorage` verwenden
- **Fehlerbehandlung:** Graceful Degradation bei Netzwerkfehlern oder fehlenden Daten
- **Caching:** Intelligente Zwischenspeicherung von Rezept-Details für Performance

### Wichtige API-Funktionen:

```javascript
// Benutzer-Authentifizierung mit Einrichtungszuordnung
export async function getCurrentUserWithEinrichtungen();

// Menüplan für spezifische Einrichtung laden
export async function loadMenuplanForEinrichtung(einrichtungId, year, week);

// Portal-Stammdaten abrufen
export async function getPortalStammdaten();
```

## 6. Besonderheiten des Read-Only-Moduls

### Multi-Einrichtungs-Support
- Benutzer können mehreren Einrichtungen zugeordnet sein
- UI bietet Selector für verfügbare Einrichtungen
- Backend prüft Berechtigung bei jeder Menüplan-Anfrage

### Performance-Optimierungen
- **Lazy Loading**: Rezept-Details nur bei Bedarf
- **Parallel-Requests**: Gleichzeitige API-Abfragen für bessere Performance
- **Client-Side Caching**: Vermeidung redundanter Backend-Aufrufe

### Responsive Design Integration
- **Mobile-First**: Accordion-Layout für schmale Bildschirme
- **Desktop-Enhancement**: Grid-Layout für große Bildschirme
- **Touch-Optimierung**: Große Touchziele für mobile Nutzung

## 7. Authentifizierung & Zugriffskontrolle

### Sicherheitskonzept
- **JWT-Token-Validierung**: Bei jeder API-Anfrage
- **Einrichtungs-Autorisierung**: Nur zugewiesene Einrichtungen sichtbar
- **Read-Only-Enforcement**: Keine Schreibzugriffe auf Menüpläne möglich

### Error-Handling
- **401 Unauthorized**: Weiterleitung zum Login
- **403 Forbidden**: Meldung über fehlende Berechtigung
- **404 Not Found**: Anzeige leerer Menüplan
- **500 Server Error**: Benutzerfreundliche Fehlermeldung mit Retry-Option 