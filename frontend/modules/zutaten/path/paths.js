/**
 * @module path-config
 * @description Definiert und exportiert alle Datenpfade, die im Zutaten-Modul verwendet werden.
 * Dies zentralisiert die Pfadverwaltung und erleichtert zukünftige Änderungen.
 */

/**
 * Definiert alle externen Datenquellen und API-Endpunkte für das Zutaten-Modul.
 */
export const zutatenPaths = {
    api: {
        // Endpunkt zum Abrufen und Erstellen von Zutaten
        zutaten: '/api/zutaten',
        // Endpunkt zum Abrufen der Stammdaten (Kategorien, Lieferanten etc.)
        stammdaten: '/api/zutaten/stammdaten',
        // Endpunkt zum Abrufen der Namensvorschläge für das Eingabefeld
        vorschlaege: '/api/zutaten/vorschlaege',
        exportZutaten: '/api/zutaten/export',
        importZutaten: '/api/zutaten/import'
    },
    stammdaten: {
        kategorien: '/shared/data/zutaten/zutaten-stammdaten.json',
    }
}; 