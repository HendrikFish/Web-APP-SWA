# SmartWorkArt - Zentrale Geschäftslogik

Dieses Dokument beschreibt übergeordnete Geschäftsregeln, die für mehrere Module gelten und für die korrekte Funktion der Anwendungslogik entscheidend sind.

## 1. Menüpläne als historische Snapshots

Diese Regel ist fundamental für die Datenintegrität und alle darauf aufbauenden Module (Bestellung, Kalkulation, Anzeige).

-   **Menüpläne sind unveränderlich:** Ein gespeicherter Wochen-Menüplan (z.B. `25.json`) stellt einen in sich geschlossenen, historisch akkuraten "Snapshot" dar. Er darf nach dem Speichern in seiner Logik nicht mehr verändert werden.

-   **Speicherung von "Anrechten":** Beim Speichern eines Menüplans werden die zu diesem Zeitpunkt gültigen "Abonnements" (welche Einrichtung hat Anspruch auf welche Mahlzeit?) aus den Einrichtungs-Stammdaten kopiert und **direkt in die Menüplan-Datei (`kW.json`) geschrieben.**

-   **Keine dynamische Kombination:** Zukünftige Auswertungen oder Anzeigen dürfen **niemals** einen alten Menüplan mit den *aktuellen* Einrichtungs-Stammdaten dynamisch kombinieren. Die Wahrheit liegt immer in der Menüplan-Datei selbst. Dies stellt sicher, dass eine Änderung an einem Einrichtungs-Abo (z.B. im Juni) keine Auswirkungen auf die Abrechnung des Mai-Plans hat.

## 2. Sonderbehandlung 'Interner' Einrichtungen

Einrichtungen, die in ihren Stammdaten als `"isIntern": true` markiert sind, repräsentieren die eigenen Bewohner und unterliegen einer Sonderbehandlung im gesamten System.

-   **Erweiterter Speiseplan:** Im Gegensatz zu externen Kunden erhalten interne Einrichtungen den vollen Speiseplan. Das schließt nicht nur die Standard-Mahlzeiten (Suppe, Menü 1, Menü 2, Dessert) ein, sondern auch alle zusätzlichen Kategorien, die z.B. das Abendessen oder andere Sonderverpflegungen abbilden.

-   **Systemweite Regel:** Alle Module, die mit Menüplänen oder Bestellungen arbeiten, müssen diese `isIntern`-Eigenschaft prüfen und ihre Logik entsprechend anpassen. 