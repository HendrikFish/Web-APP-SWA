# Einrichtung-Modul: Funktionsweise und UI-Komponenten

## 1. Zweck des Moduls

Das Einrichtung-Modul ist die zentrale Schnittstelle zur Verwaltung von Einrichtungen. Es ermöglicht das Erstellen, Anzeigen, Bearbeiten und Löschen von internen und externen Einrichtungen. Diese können z.B. andere Heime, Lieferanten oder interne Wohnbereiche sein.

## 2. UI-Komponenten & Layout

Die Benutzeroberfläche ist in zwei Hauptbereiche gegliedert: ein einklappbares Formular für die Dateneingabe und eine dynamische Liste zur Anzeige und Verwaltung der bestehenden Einrichtungen.

### Oben: Einrichtungsformular (`einrichtung-form-ui.js`)
Das Formular wird über einen "Neue Einrichtung"-Button ein- und ausgeblendet und ist für die Desktop-Ansicht in drei Spalten aufgeteilt, um die Übersichtlichkeit zu maximieren.

-   **Spalte 1: Grunddaten & Konfiguration**
    -   **Formularfelder:** Eingabefelder für Name, Kürzel, Adresse und Kontaktdaten.
    -   **Konfiguration:** Auswahl für Typ (Intern/Extern), Personengruppe und zugehörige Tour.

-   **Spalte 2: Speiseangebot (Mittag)**
    -   Eine Matrix aus Checkboxen, um pro Wochentag festzulegen, welche Speisekomponenten (Suppe, Hauptspeise, Dessert) die Einrichtung erhält.
    -   Ein "Alle"-Button pro Tag ermöglicht das schnelle An- und Abwählen aller Optionen für diesen Tag.

-   **Spalte 3: Gruppenverwaltung & Aktionen**
    -   **Dynamische Gruppen:** Ein Bereich, in dem beliebig viele Gruppen (z.B. Wohnbereiche oder Abteilungen) mit Namen und Personenanzahl hinzugefügt werden können.
    -   **Live-Zusammenfassung:** Zeigt die Gesamtanzahl der Personen, die sich aus den einzelnen Gruppen ergibt, in Echtzeit an.
    -   **Aktions-Buttons:** Buttons zum Speichern oder Abbrechen der Eingabe.

### Unten: Einrichtungsliste (`einrichtung-liste-ui.js`)
Hier werden alle existierenden Einrichtungen angezeigt und verwaltet.

-   **Such- & Sortierleiste:** Ermöglicht das Filtern der Liste nach Namen und das Sortieren nach verschiedenen Kriterien wie Name, Kürzel oder Gesamtanzahl der Personen. Die Sortierrichtung (aufsteigend/absteigend) ist ebenfalls wählbar.
-   **Einrichtungskarten/Zeilen:** Jede Einrichtung wird als eigene Karte oder Zeile dargestellt, die die wichtigsten Informationen zusammenfasst.
-   **Aktionen:** Bietet Buttons zum Bearbeiten oder Löschen einer Einrichtung direkt aus der Liste.

## 3. Wichtige Logik (`script.js`)

Die `script.js` dient als zentraler Controller, der den Zustand verwaltet und die UI-Module koordiniert.
-   **Zustandsverwaltung:** Hält die Liste aller Einrichtungen sowie die benötigten Stammdaten (z.B. Touren, Personengruppen) im Speicher.
-   **Event-Handling:** Nutzt ein delegiertes Event-Listener-Muster, um auf Aktionen wie das Absenden des Formulars, Klicks auf Sortier-Buttons oder das Bearbeiten/Löschen aus der Liste zu reagieren.
-   **API-Kommunikation:** Ruft die Funktionen aus `einrichtung-api.js` auf, um mit dem Backend zu kommunizieren und die Daten zu laden und zu speichern. 