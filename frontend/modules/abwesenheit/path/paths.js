/**
 * Pfad-Abstraktionsebene für das Abwesenheiten-Modul
 * Zentrale Verwaltung aller Datenpfade und API-Endpunkte
 */

export const abwesenheitPaths = {
    // JSON-Datenpfade
    data: {
        einrichtungen: '/shared/data/einrichtungen/einrichtungen.json',
        ferienStatus: '/shared/data/abwesenheit/ferien-status.json',
        ferienRouting: '/shared/data/abwesenheit/ferien-routing.json'
    },

    // API-Endpunkte (falls später implementiert)
    api: {
        einrichtungen: '/api/einrichtungen',
        ferienStatus: '/api/abwesenheit/status',
        ferienRouting: '/api/abwesenheit/routing'
    },

    /**
     * Generiert den Pfad für Abwesenheitsdaten einer bestimmten KW
     * @param {number} kw - Kalenderwoche
     * @returns {string} Vollständiger Pfad
     */
    getKwDataPath(kw) {
        return `${this.data.ferienStatus}?kw=${kw}`;
    },

    /**
     * Generiert den API-Pfad für eine bestimmte Einrichtung und KW
     * @param {string} einrichtung - Kürzel der Einrichtung
     * @param {number} kw - Kalenderwoche
     * @returns {string} API-Pfad
     */
    getEinrichtungStatusPath(einrichtung, kw) {
        return `${this.api.ferienStatus}/${einrichtung}/${kw}`;
    },

    /**
     * Generiert den Pfad für Routing-Daten einer bestimmten KW
     * @param {number} kw - Kalenderwoche
     * @returns {string} Vollständiger Pfad
     */
    getRoutingDataPath(kw) {
        return `${this.data.ferienRouting}?kw=${kw}`;
    },

    /**
     * Bestimmt ob lokale JSON-Dateien oder API verwendet werden soll
     * @returns {boolean} true für API, false für lokale Dateien
     */
    useAPI() {
        // Für jetzt verwenden wir lokale JSON-Dateien
        // Später kann hier eine Umgebungsvariable abgefragt werden
        return false;
    },

    /**
     * Gibt den korrekten Datenpfad basierend auf der aktuellen Konfiguration zurück
     * @param {string} dataType - Art der Daten ('einrichtungen', 'ferienStatus', 'ferienRouting')
     * @returns {string} Pfad zu den Daten
     */
    getDataSource(dataType) {
        if (this.useAPI()) {
            return this.api[dataType];
        }
        return this.data[dataType];
    }
}; 