/**
 * Pfad-Konfiguration für Zahlen-Auswertung Modul
 * Definiert alle relevanten Pfade und URLs
 */

export const PATHS = {
    // Basis-Pfade
    MODULE_ROOT: '/frontend/modules/zahlen-auswertung',
    SHARED_ROOT: '/shared',
    
    // Daten-Pfade
    BESTELLDATEN_BASE: '/shared/data/portal/bestellungen',
    BESTELLDATEN_STAMMDATEN: '/shared/data/portal/bestellungen/stammdaten.json',
    
    // Dynamische Pfade
    BESTELLDATEN_JAHR: (year) => `/shared/data/portal/bestellungen/${year}`,
    BESTELLDATEN_WOCHE: (year, week) => `/shared/data/portal/bestellungen/${year}/${week}.json`,
    
    // Modul-Ressourcen
    ASSETS: {
        CSS: '/frontend/modules/zahlen-auswertung/css/style.css',
        JS: '/frontend/modules/zahlen-auswertung/js/script.js',
        MODULES: '/frontend/modules/zahlen-auswertung/js/module'
    },
    
    // Externe Abhängigkeiten
    DEPENDENCIES: {
        BOOTSTRAP_CSS: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        BOOTSTRAP_JS: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
        BOOTSTRAP_ICONS: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css'
    },
    
    // Navigation
    NAVIGATION: {
        DASHBOARD: '/frontend/core/dashboard',
        ADMIN: '/frontend/core/admin-dashboard',
        MENUE_PORTAL: '/frontend/modules/menue-portal',
        MENUEPLAN: '/frontend/modules/menueplan',
        REZEPTE: '/frontend/modules/rezept',
        ZUTATEN: '/frontend/modules/zutaten',
        EINRICHTUNG: '/frontend/modules/einrichtung'
    },
    
    // Shared Components
    COMPONENTS: {
        HEADER: '/shared/components/header',
        TOAST: '/shared/components/toast-notification',
        MODAL: '/shared/components/confirmation-modal',
        FORM_BUILDER: '/shared/components/dynamic-form'
    },
    
    // Utilities
    UTILS: {
        API_CLIENT: '/shared/utils/api-client.js',
        LOGGER: '/backend/utils/logger.js'
    }
};

// Funktionen für Pfad-Generierung
export const generatePaths = {
    /**
     * Generiert Pfad zu Bestelldaten-Datei
     * @param {number} year - Jahr
     * @param {number} week - Kalenderwoche
     * @returns {string} Pfad zur Datei
     */
    bestelldatenDatei: (year, week) => PATHS.BESTELLDATEN_WOCHE(year, week),
    
    /**
     * Generiert Pfad zu Jahres-Ordner
     * @param {number} year - Jahr
     * @returns {string} Pfad zum Ordner
     */
    bestelldatenJahr: (year) => PATHS.BESTELLDATEN_JAHR(year),
    
    /**
     * Generiert Export-Dateiname
     * @param {number} year - Jahr
     * @param {number} week - Kalenderwoche
     * @param {string} format - Format (csv, pdf, json)
     * @returns {string} Dateiname
     */
    exportDatei: (year, week, format = 'csv') => `bestelldaten_kw${week}_${year}.${format}`,
    
    /**
     * Generiert Backup-Dateiname
     * @param {number} year - Jahr
     * @param {number} week - Kalenderwoche
     * @returns {string} Backup-Dateiname
     */
    backupDatei: (year, week) => `backup_bestelldaten_kw${week}_${year}_${Date.now()}.json`
};

// Validierung für Pfade
export const validatePaths = {
    /**
     * Validiert Jahr
     * @param {number} year - Jahr
     * @returns {boolean} Gültig
     */
    isValidYear: (year) => {
        return Number.isInteger(year) && year >= 2020 && year <= 2030;
    },
    
    /**
     * Validiert Kalenderwoche
     * @param {number} week - Kalenderwoche
     * @returns {boolean} Gültig
     */
    isValidWeek: (week) => {
        return Number.isInteger(week) && week >= 1 && week <= 53;
    },
    
    /**
     * Validiert Jahr/Woche Kombination
     * @param {number} year - Jahr
     * @param {number} week - Kalenderwoche
     * @returns {boolean} Gültig
     */
    isValidYearWeek: (year, week) => {
        return validatePaths.isValidYear(year) && validatePaths.isValidWeek(week);
    }
};

// Konfiguration für verschiedene Umgebungen
export const ENVIRONMENT_PATHS = {
    development: {
        BASE_URL: 'http://localhost:3000',
        API_URL: 'http://localhost:3001/api'
    },
    production: {
        BASE_URL: 'https://smartworkart.com',
        API_URL: 'https://api.smartworkart.com'
    },
    test: {
        BASE_URL: 'http://localhost:3002',
        API_URL: 'http://localhost:3003/api'
    }
};

// Aktuelle Umgebung ermitteln
export const getCurrentEnvironment = () => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
            return 'development';
        } else if (host.includes('test') || host.includes('staging')) {
            return 'test';
        }
    }
    return 'production';
};

// Aktuelle Pfade basierend auf Umgebung
export const getCurrentPaths = () => {
    const env = getCurrentEnvironment();
    return ENVIRONMENT_PATHS[env];
};

export default PATHS; 