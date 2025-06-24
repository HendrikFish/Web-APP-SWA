# Rezept-Modul: Funktionsweise und UI-Komponenten

## 1. Zweck des Moduls

Das Rezept-Modul ist die zentrale Schnittstelle zur Verwaltung von Rezepten. Es ermöglicht das Erstellen, Anzeigen, Bearbeiten und Löschen von Rezepten, die aus einer Liste von Zutaten und einer Anleitung bestehen.

## 2. UI-Komponenten & Layout

Die Benutzeroberfläche ist in einem zweispaltigen Layout organisiert, um eine klare Trennung zwischen Bearbeitung und Anzeige zu gewährleisten.

### Linke Spalte: Rezeptformular (`rezept-form-ui.js`)
Hier finden alle Aktionen zur Dateneingabe statt:
-   **Formularfelder:** Eingabefelder für Rezeptname, Kategorie und Anleitung.
-   **Zutatensuche:** Eine Live-Suche, die bei der Eingabe passende Zutaten aus dem gesamten Datenbestand vorschlägt.
-   **Zutatenliste:** Die Liste der aktuell zum Rezept hinzugefügten Zutaten. Jede Zutat hat ein eigenes Mengenfeld und einen Button zum Entfernen.
-   **Mengensteuerung:** Das Mengenfeld wird von `-` und `+` Buttons flankiert. Bei Einheiten wie "g" oder "ml" erhöhen/senken diese Buttons den Wert in 10er-Schritten, ansonsten in 1er-Schritten. Die manuelle Eingabe beliebiger Werte ist immer möglich.
-   **Live-Zusammenfassung:** Ein Bereich, der in Echtzeit die geschätzten Gesamtkosten, die gesammelten Allergene und die Kalorien des Rezepts anzeigt, während Zutaten hinzugefügt oder Mengen geändert werden.

### Rechte Spalte: Rezeptliste (`rezept-liste-ui.js`)
Hier werden alle existierenden Rezepte angezeigt und verwaltet:
-   **Such- & Sortierleiste:** Ermöglicht das Filtern der Liste nach Namen und das Sortieren nach Name (A-Z, Z-A) oder Erstellungsdatum.
-   **Rezeptkarten:** Jedes Rezept wird als eigene Karte dargestellt.
-   **Autoren-Info:** Jede Karte zeigt an, von wem und wann das Rezept erstellt wurde (`Erstellt von [Name] am [Datum]`), um die Nachvollziehbarkeit zu gewährleisten.

## 3. Wichtige Logik (`script.js`)

Die `script.js` dient als zentraler Controller, der den Zustand verwaltet und die UI-Module koordiniert.
-   **Zustandsverwaltung:** Hält die Liste aller Rezepte (`alleRezepte`) und aller Zutaten (`alleZutaten`) im Speicher.
-   **Event-Handling:** Verwendet ein robustes, delegiertes Event-Listener-Muster, um auf Aktionen wie das Absenden des Formulars oder Klicks auf Buttons in der Liste zu reagieren und Fehler durch doppelte Listener zu vermeiden.
-   **API-Kommunikation:** Ruft die Funktionen aus `rezept-api.js` auf, um mit dem Backend zu kommunizieren. 