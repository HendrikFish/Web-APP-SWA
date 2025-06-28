# Portal-Bestellungen JSON-Struktur

Dieses Verzeichnis enthält alle Portal-Bestellungen in JSON-Format. Bestellungen werden **ausschließlich in JSON-Dateien** gespeichert, nicht in localStorage.

## 📁 Ordnerstruktur

```
shared/data/portal/bestellungen/
├── stammdaten.json          # Schema-Definition und Metadaten
├── vorlage.json            # Vorlage für neue Wochen
├── README.md               # Diese Dokumentation
├── 2025/                   # Bestellungen für 2025
│   ├── 26.json            # KW 26/2025
│   ├── 27.json            # KW 27/2025
│   └── ...
└── 2026/                   # Bestellungen für 2026
    └── ...
```

## 💾 Speicherkonzept

**Nur JSON-Dateien:**
- ✅ Direkte Speicherung in JSON-Dateien
- ✅ Permanente Archivierung
- ✅ Server-seitige Verarbeitung möglich
- ❌ Kein localStorage (temporär oder dauerhaft)

## 🔧 API-Integration

**Bestellungen laden:**
```javascript
// Bestellungen für KW 26/2025 laden
const response = await fetch('/shared/data/portal/bestellungen/2025/26.json');
const bestellungen = await response.json();
```

**Bestellungen speichern:**
```javascript
// Direkt in JSON-Datei speichern (über Backend-API)
await fetch('/api/bestellungen/2025/26', {
  method: 'POST',
  body: JSON.stringify(bestellungsdaten)
});
```

Dieses Verzeichnis enthält alle Portal-Bestellungen in JSON-Format nach dem gleichen Schema wie die Menüpläne.

## 📁 Ordnerstruktur

```
shared/data/portal/bestellungen/
├── stammdaten.json          # Schema-Definition und Metadaten
├── vorlage.json            # Vorlage für neue Wochen
├── README.md               # Diese Dokumentation
├── 2025/                   # Bestellungen für 2025
│   ├── 26.json            # KW 26/2025
│   ├── 27.json            # KW 27/2025
│   └── ...
└── 2026/                   # Bestellungen für 2026
    └── ...
```

## 📋 Datei-Schema

### Bestelldatei (z.B. `2025/26.json`)
```json
{
  "year": 2025,
  "week": 26,
  "erstellt_am": "2025-06-23T08:00:00.000Z",
  "letzte_änderung": "2025-06-28T14:30:00.000Z",
  "einrichtungen": {
    "einrichtung-id": {
      "info": {
        "id": "einrichtung-id",
        "name": "Einrichtungsname",
        "typ": "kindergarten|schule|extern",
        "gruppen": [...]
      },
      "tage": {
        "montag": {
          "kategorie": {
            "gruppenname": anzahl
          }
        }
      },
      "wochenstatistik": {...}
    }
  },
  "wochenstatistik": {...},
  "metadaten": {...}
}
```

## 🔄 Kategorien-Mapping

### Externe Einrichtungen (Seniorenheime)
- `menu1` - Menü 1 (separate Bestellung)
- `menu2` - Menü 2 (separate Bestellung)
- `suppe` - Automatisch berechnet (menu1 + menu2)
- `dessert` - Automatisch berechnet (menu1 + menu2)

### Kindergarten/Schule
- `hauptspeise` - Zusammenfassung von menu1/menu2 (Koch entscheidet)
- `suppe` - Automatisch berechnet (hauptspeise)
- `dessert` - Automatisch berechnet (hauptspeise)

## 🔧 API-Integration

**Bestellungen laden:**
```javascript
// Bestellungen für KW 26/2025 laden
const response = await fetch('/shared/data/portal/bestellungen/2025/26.json');
const bestellungen = await response.json();
```

**Bestellungen speichern:**
```javascript
// Direkt in JSON-Datei speichern (über Backend-API)
await fetch('/api/bestellungen/2025/26', {
  method: 'POST',
  body: JSON.stringify(bestellungsdaten)
});
```

## 📊 Automatische Berechnung

**Suppe und Dessert** werden automatisch 1:1 zu den Hauptspeisen-Bestellungen berechnet:
- Bei externen Einrichtungen: `suppe = menu1 + menu2`
- Bei Kindergarten/Schule: `suppe = hauptspeise`

## 🔧 Verwendung

### Neue Woche erstellen
1. `vorlage.json` kopieren nach `{jahr}/{kw}.json`
2. `year`, `week`, `erstellt_am` ausfüllen
3. `bestellfrist` und `lieferwoche` setzen
4. Einrichtungs-Bestellungen hinzufügen

## 📈 Statistiken

Jede Datei enthält automatisch berechnete Statistiken:
- **Wochenstatistik**: Gesamt-Bestellungen, Durchschnitt pro Einrichtung
- **Tagesstatistik**: Höchster/niedrigster Tag pro Einrichtung
- **Einrichtungstypen**: Verteilung der Einrichtungstypen

## 🗂️ Export-Formate

1. **JSON**: Standard-Format für System-Integration
2. **CSV**: Excel-kompatibel für Tabellenkalkulation
3. **PDF**: Druckbare Bestellübersicht für die Küche

## 📅 Archivierung

- **Aktuelle Bestellungen**: JSON-Dateien
- **Abgeschlossene Wochen**: JSON-Dateien (schreibgeschützt)
- **Archivierung**: Nach 2 Jahren in separaten Ordner

## 🔗 Integration

**Mit bestehenden Modulen:**
- Backend-APIs: Laden/Speichern von JSON-Dateien
- Frontend-Module: Direkte JSON-Integration
- Export-Module: Generieren CSV/PDF aus JSON-Daten

## 📝 Hinweise

- **Datenschutz**: Nur anonymisierte Gruppendaten, keine Personendaten
- **Konsistenz**: Schema folgt exakt dem Menüplan-Format
- **Erweiterbarkeit**: Neue Kategorien/Gruppen einfach hinzufügbar
- **Performance**: Direkte JSON-Zugriffe ohne localStorage-Overhead 