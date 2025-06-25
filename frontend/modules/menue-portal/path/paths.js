// paths.js - Pfad-Konfigurationen für das Menü-Portal

/**
 * Pfad-Konfigurationen für das Menü-Portal Module
 */
export const PATHS = {
    // API Endpunkte
    API: {
        BASE: '/api',
        MENUEPLAN: '/api/menueplan',
        REZEPTE: '/api/rezepte',
        EINRICHTUNGEN: '/api/einrichtungen',
        USER: '/api/user'
    },
    
    // Frontend Module
    MODULES: {
        MENUE_PORTAL: '/frontend/modules/menue-portal/',
        MENUEPLAN: '/frontend/modules/menueplan/',
        REZEPT: '/frontend/modules/rezept/',
        EINRICHTUNG: '/frontend/modules/einrichtung/'
    },
    
    // Core Komponenten
    CORE: {
        LOGIN: '/frontend/core/login/',
        DASHBOARD: '/frontend/core/dashboard/',
        ADMIN_DASHBOARD: '/frontend/core/admin-dashboard/'
    },
    
    // Shared Komponenten
    SHARED: {
        COMPONENTS: '/shared/components/',
        HEADER: '/shared/components/header/',
        TOAST: '/shared/components/toast-notification/',
        MODAL: '/shared/components/confirmation-modal/',
        STYLES: '/shared/styles/',
        UTILS: '/shared/utils/'
    },
    
    // Asset Pfade
    ASSETS: {
        ICONS: '/frontend/public/assets/icons/',
        ALLERGENE: '/frontend/public/assets/icons/allergene/'
    }
};

/**
 * Hilfsfunktionen für URL-Building
 */
export const PathUtils = {
    /**
     * Erstellt eine vollständige API-URL
     * @param {string} endpoint - API-Endpunkt
     * @param {object} params - URL-Parameter
     * @returns {string} Vollständige URL
     */
    buildApiUrl(endpoint, params = {}) {
        const url = new URL(endpoint, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        return url.toString();
    },
    
    /**
     * Erstellt eine Menüplan-API-URL
     * @param {string} einrichtungId - Einrichtungs-ID
     * @param {number} year - Jahr
     * @param {number} week - Kalenderwoche
     * @returns {string} Menüplan-API-URL
     */
    buildMenuplanUrl(einrichtungId, year, week) {
        return this.buildApiUrl(PATHS.API.MENUEPLAN, {
            einrichtung: einrichtungId,
            year: year,
            week: week
        });
    },
    
    /**
     * Erstellt eine Einrichtungs-URL
     * @param {string} einrichtungId - Einrichtungs-ID
     * @returns {string} Einrichtungs-API-URL
     */
    buildEinrichtungUrl(einrichtungId) {
        return `${PATHS.API.EINRICHTUNGEN}/${einrichtungId}`;
    },
    
    /**
     * Navigiert zu einem anderen Modul
     * @param {string} modulePath - Pfad zum Modul
     */
    navigateToModule(modulePath) {
        window.location.href = modulePath;
    },
    
    /**
     * Prüft ob aktueller Pfad ein bestimmtes Modul ist
     * @param {string} modulePath - Zu prüfender Modulpfad
     * @returns {boolean} true wenn aktuelles Modul
     */
    isCurrentModule(modulePath) {
        return window.location.pathname.includes(modulePath);
    },
    
    /**
     * Gibt den aktuellen Modulnamen zurück
     * @returns {string} Modulname
     */
    getCurrentModule() {
        const path = window.location.pathname;
        if (path.includes('/menue-portal/')) return 'menue-portal';
        if (path.includes('/menueplan/')) return 'menueplan';
        if (path.includes('/rezept/')) return 'rezept';
        if (path.includes('/einrichtung/')) return 'einrichtung';
        if (path.includes('/admin-dashboard/')) return 'admin-dashboard';
        if (path.includes('/dashboard/')) return 'dashboard';
        if (path.includes('/login/')) return 'login';
        return 'unknown';
    }
};

/**
 * Navigation Utilities
 */
export const Navigation = {
    /**
     * Zurück zum Dashboard
     */
    toDashboard() {
        PathUtils.navigateToModule(PATHS.CORE.DASHBOARD);
    },
    
    /**
     * Zum Menüplan-Editor (falls Berechtigung vorhanden)
     */
    toMenueplan() {
        PathUtils.navigateToModule(PATHS.MODULES.MENUEPLAN);
    },
    
    /**
     * Zu den Rezepten
     */
    toRezepte() {
        PathUtils.navigateToModule(PATHS.MODULES.REZEPT);
    },
    
    /**
     * Zu den Einrichtungen
     */
    toEinrichtungen() {
        PathUtils.navigateToModule(PATHS.MODULES.EINRICHTUNG);
    },
    
    /**
     * Zum Admin-Dashboard (falls Admin)
     */
    toAdminDashboard() {
        PathUtils.navigateToModule(PATHS.CORE.ADMIN_DASHBOARD);
    },
    
    /**
     * Logout (zum Login)
     */
    toLogin() {
        localStorage.removeItem('token');
        PathUtils.navigateToModule(PATHS.CORE.LOGIN);
    }
};

/**
 * Module-spezifische Pfad-Konfigurationen
 */
export const MODULE_PATHS = {
    MENUE_PORTAL: {
        INDEX: `${PATHS.MODULES.MENUE_PORTAL}index.html`,
        CSS: `${PATHS.MODULES.MENUE_PORTAL}css/style.css`,
        SCRIPT: `${PATHS.MODULES.MENUE_PORTAL}js/script.js`,
        API: `${PATHS.MODULES.MENUE_PORTAL}js/module/menue-portal-api.js`,
        UI: `${PATHS.MODULES.MENUE_PORTAL}js/module/menue-portal-ui.js`,
        AUTH: `${PATHS.MODULES.MENUE_PORTAL}js/module/menue-portal-auth.js`
    }
};

// Export default für einfachen Import
export default PATHS; 