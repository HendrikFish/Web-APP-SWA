/**
 * Definiert alle externen Datenquellen und API-Endpunkte für das Rezept-Modul.
 * Die Kernlogik interagiert NUR mit diesem Objekt.
 */
export const rezeptPaths = {
    // API-Endpunkte des Backends
    api: {
        getAlleRezepte: '/api/rezepte',
        createRezept: '/api/rezepte',
        updateRezept: (id) => `/api/rezepte/${id}`,
        deleteRezept: (id) => `/api/rezepte/${id}`,
        getStammdaten: '/api/rezepte/stammdaten',
    },
    // Pfade zu anderen Modulen oder gemeinsamen Ressourcen
    shared: {
        // Wir benötigen die Zutaten-API, um nach Zutaten suchen zu können
        getAlleZutaten: '/api/zutaten',
        getZutatenStammdaten: '/api/zutaten/stammdaten'
    }
}; 