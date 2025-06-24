# Technische Dokumentation: Datenanbindung des Zutaten-Moduls

Dieses Dokument beschreibt die technische Struktur, die Datenquellen und die zentralen Logiken für die Verarbeitung von Zutatendaten. Es dient als Referenz für Entwickler und KIs.

## 1. Datenquellen (Wo liegen die Daten?)

Die Daten für das Zutaten-Modul sind auf zwei zentrale Dateien im `shared/data/zutaten/`-Verzeichnis aufgeteilt:

-   `zutaten.json`: Die Master-Liste, die **alle jemals erfassten Zutaten-Objekte** enthält. Jede Zutat hat hier eine einzigartige `id` und eine `zutatennummer`.
-   `zutaten-stammdaten.json`: Definiert die Auswahlmöglichkeiten für die Formular-Dropdowns (z.B. Lieferanten, Kategorien) und enthält die **Logik für die Einheitenumrechnung**.

## 2. Zentrale Datenstruktur (Wie sieht eine Zutat aus?)

Jedes Objekt in `zutaten.json` folgt dieser Struktur. Besonders wichtig sind die verschachtelten Objekte `preis`, `allergene` und `naehrwerte`.

```json
{
  "id": "86e25931-fdc1-4191-b159-1946e2538a22",
  "name": "Gouda",
  "kategorie": "Milchprodukte",
  "lieferant": "Pinzgau-Milch",
  "isActive": true,
  "herkunft": "EU",
  "preis": {
    "basis": 10.02,
    "basiseinheit": "kg",
    "verwendungseinheit": "g",
    "umrechnungsfaktor": 1000
  },
  "allergene": [
    { 
      "code": "G", 
      "name": "Milch und Laktose" 
    }
  ],
  "naehrwerte": {
    "kalorien_kcal": 356,
    "fett_g": 28
  }
}
```

## 3. Wichtige Logiken

### Automatische Preisberechnung & Umrechnungsfaktor

-   Der `umrechnungsfaktor` im `preis`-Objekt wird **nicht manuell eingegeben**.
-   Er wird **automatisch** vom Frontend (`zutaten-ui.js`) berechnet, basierend auf den `faktor`-Werten in `zutaten-stammdaten.json`.
-   **Beispiel:**
    -   Basiseinheit `kg` hat `faktor: 1000`.
    -   Verwendungseinheit `g` hat `faktor: 1`.
    -   Der gespeicherte `umrechnungsfaktor` ist `1000 / 1 = 1000`.
-   Diese Logik ist in der `getZutatFormularDaten()`-Funktion gekapselt.

### Optionale Eingabefelder (Allergene & Nährwerte)

-   Die UI-Bereiche für Allergene und Nährwerte sind standardmäßig via `d-none` versteckt.
-   Ein Klick auf den jeweiligen "Bearbeiten"-Button blendet den Bereich ein/aus.
-   Die Daten werden nur dann ausgelesen und gespeichert, wenn der jeweilige Bereich bei der Formularabsendung sichtbar ist. 