# Modul: Professionelle Zutatenerfassung

Dieses Modul dient der Erfassung und Verwaltung von Zutaten für die Menüplanung. Es wurde entwickelt, um eine schnelle, intuitive und fehlerfreie Dateneingabe zu ermöglichen, insbesondere auf mobilen Geräten.

## Features

- **Professionelle Datenerfassung:** Erfasst nicht nur den Namen, sondern auch Lieferanten, Kategorien, Allergene, Preise und Einheiten.
- **Vorschläge bei der Eingabe:** Schlägt beim Eintippen des Namens passende Zutaten aus einer vordefinierten Liste vor, um die Eingabe zu beschleunigen und Konsistenz zu sichern.
- **Dynamische Konfiguration:** Lieferanten, Kategorien, Allergene und Einheiten sind nicht fest im Code verankert, sondern werden aus einer zentralen Konfigurationsdatei geladen.
- **Interaktive UI:**
    - Die Auswahl der "Basiseinheit" (z.B. Kg) filtert automatisch die passenden "Verwendungseinheiten" (z.B. g).
    - Der Preis pro Verwendungseinheit wird automatisch berechnet.
- **Zentrale Datenhaltung:** Alle Zutaten werden in einer einzigen `zutaten.json`-Datei gespeichert.
- **Import/Export:** Ermöglicht den Export aller aktiven Zutaten in eine saubere JSON-Datei und den intelligenten Import, der Duplikate überspringt.

---

## Wichtige Erweiterungen (Q2 2024)

Das Modul wurde signifikant erweitert, um es für zukünftige Anforderungen (Rezept-Modul) vorzubereiten.

-   **Strukturierte Preis- & Einheitenlogik:** Der Preis wird jetzt als verschachteltes Objekt gespeichert. Der Umrechnungsfaktor wird automatisch basierend auf den Faktoren in den Stammdaten berechnet, was die Eingabe sicherer und einfacher macht.
-   **Optionale Eingabebereiche:** Die Eingabe von Allergenen und Nährwerten wurde hinter "Bearbeiten"-Buttons versteckt. Das sorgt für eine sehr aufgeräumte Standardansicht.
-   **Herkunftskennzeichnung:** Ein neues Pflichtfeld zur Erfassung der Herkunft (`Einheimisch`, `EU`, `Nicht-EU`) wurde hinzugefügt.
-   **Responsive UI:** In der Zutatenliste werden auf mobilen Geräten nur noch die Icons für "Bearbeiten" und "Löschen" angezeigt, um Platz zu sparen.

---

## Technische Architektur & Konfiguration

Das Modul folgt den Projekt-Blueprints und zeichnet sich durch eine klare Trennung von Verantwortlichkeiten aus.

### Wichtige Dateien

- `index.html`: Die Struktur der Eingabemaske.
- `js/script.js`: Der Haupt-Orchestrator, der die Sub-Module lädt.
- `js/module/zutaten-ui.js`: Verantwortlich für die gesamte DOM-Manipulation und die interaktive Logik des Formulars.
- `js/module/zutaten-api.js`: Kapselt alle `fetch`-Aufrufe zum Backend.
- `path/paths.js`: Definiert die API-Endpunkte für dieses Modul.

### (Admin) Konfiguration

Ein Administrator kann das Modul anpassen, ohne den Code ändern zu müssen. Alle zentralen Stammdaten werden in der Datei `shared/data/zutaten/zutaten-stammdaten.json` verwaltet.

**Struktur der `zutaten-stammdaten.json`:**

```json
{
  "lieferanten": ["Lieferant A", "Lieferant B", "..."],
  "kategorien": ["Obst", "Gemüse", "..."],
  "allergene": [
    { "name": "Glutenhaltiges Getreide", "code": "A", "icon": "..." }
  ],
  "einheiten": [
    { "name": "Gramm", "abk": "g", "typ": "Gewicht", "faktor": 1 },
    { "name": "Kilogramm", "abk": "kg", "typ": "Gewicht", "faktor": 1000 }
  ]
}
```

- **`lieferanten`**: Eine Liste von Zeichenketten.
- **`kategorien`**: Eine Liste von Zeichenketten für die Produktkategorien.
- **`allergene`**: Eine Liste von Objekten. `name` ist die Anzeige, `code` der gespeicherte Wert.
- **`einheiten`**: Eine Liste von Objekten. Jede Einheit hat einen `namen`, eine `abk` (Abkürzung), einen `typ` (zur Gruppierung) und einen `faktor` für die automatische Umrechnung.

### Struktur der gespeicherten Zutat

Eine in `shared/data/zutaten/zutaten.json` gespeicherte Zutat hat folgende, erweiterte Struktur:

```json
{
  "id": "zutat-1667832384013-abcdef123",
  "zutatennummer": 1,
  "name": "Tomate",
  "kategorie": "Gemüse",
  "lieferant": "Transgourmet",
  "isActive": true,
  "herkunft": "Einheimisch",
  "preis": {
    "basis": 1.99,
    "basiseinheit": "kg",
    "verwendungseinheit": "g",
    "umrechnungsfaktor": 1000
  },
  "allergene": [
    { "code": "L", "name": "Sellerie" }
  ],
  "naehrwerte": {
    "kalorien_kcal": 18
  }
}
```

**Hinweis zur Lesbarkeit:** Die Backend-API sollte die `zutaten.json` lesbar formatiert speichern (`JSON.stringify(daten, null, 2)`).