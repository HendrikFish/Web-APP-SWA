// debug-logger.js - Professionelles Debug-System für Menue-Portal
// Ersetzt schrittweise die bestehenden console.log-Ausgaben

/**
 * Debug-Konfiguration
 */
const DEBUG_CONFIG = {
    // Automatische Erkennung: Development vs Production
    enabled: window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1' || 
             window.location.search.includes('debug=true'),
    
    // Module-spezifische Debug-Level
    modules: {
        api: true,
        ui: true,
        auth: true,
        modal: true,
        navigation: true,
        performance: true
    },
    
    // Console-Styling
    styles: {
        info: 'color: #007bff; font-weight: 500;',
        success: 'color: #28a745; font-weight: 600;',
        warn: 'color: #ffc107; font-weight: 600;',
        error: 'color: #dc3545; font-weight: 700;',
        performance: 'color: #6f42c1; font-weight: 500;'
    }
};

/**
 * Performance-Tracking
 */
class PerformanceTracker {
    constructor() {
        this.timers = new Map();
        this.metrics = new Map();
    }
    
    start(operation) {
        this.timers.set(operation, performance.now());
    }
    
    end(operation) {
        const start = this.timers.get(operation);
        if (start) {
            const duration = performance.now() - start;
            this.metrics.set(operation, duration);
            this.timers.delete(operation);
            
            if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.modules.performance) {
                console.log(
                    `%c⏱️ PERFORMANCE: ${operation} completed in ${duration.toFixed(2)}ms`,
                    DEBUG_CONFIG.styles.performance
                );
            }
            
            return duration;
        }
        return null;
    }
    
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
}

/**
 * Haupt-Debug-Logger
 */
export class DebugLogger {
    constructor(moduleName) {
        this.module = moduleName;
        this.performance = new PerformanceTracker();
    }
    
    /**
     * Info-Meldungen (Allgemeine Informationen)
     */
    info(message, data = null) {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.modules.ui) return;
        
        const prefix = `ℹ️ [${this.module.toUpperCase()}]`;
        if (data) {
            console.log(`%c${prefix} ${message}`, DEBUG_CONFIG.styles.info, data);
        } else {
            console.log(`%c${prefix} ${message}`, DEBUG_CONFIG.styles.info);
        }
    }
    
    /**
     * Erfolg-Meldungen
     */
    success(message, data = null) {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.modules.ui) return;
        
        const prefix = `✅ [${this.module.toUpperCase()}]`;
        if (data) {
            console.log(`%c${prefix} ${message}`, DEBUG_CONFIG.styles.success, data);
        } else {
            console.log(`%c${prefix} ${message}`, DEBUG_CONFIG.styles.success);
        }
    }
    
    /**
     * Warnungen
     */
    warn(message, data = null) {
        if (!DEBUG_CONFIG.enabled) return;
        
        const prefix = `⚠️ [${this.module.toUpperCase()}]`;
        if (data) {
            console.warn(`%c${prefix} ${message}`, DEBUG_CONFIG.styles.warn, data);
        } else {
            console.warn(`%c${prefix} ${message}`, DEBUG_CONFIG.styles.warn);
        }
    }
    
    /**
     * Fehler (IMMER loggen, auch in Production)
     */
    error(message, error = null) {
        const prefix = `❌ [${this.module.toUpperCase()}]`;
        if (error) {
            console.error(`%c${prefix} ${message}`, DEBUG_CONFIG.styles.error, error);
        } else {
            console.error(`%c${prefix} ${message}`, DEBUG_CONFIG.styles.error);
        }
    }
    
    /**
     * API-Aufrufe
     */
    api(method, url, data = null) {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.modules.api) return;
        
        const prefix = `🔗 [${this.module.toUpperCase()}-API]`;
        console.log(`%c${prefix} ${method} ${url}`, DEBUG_CONFIG.styles.info, data);
    }
    
    /**
     * Navigation/Routing
     */
    navigation(action, details = null) {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.modules.navigation) return;
        
        const prefix = `📍 [${this.module.toUpperCase()}-NAV]`;
        console.log(`%c${prefix} ${action}`, DEBUG_CONFIG.styles.info, details);
    }
    
    /**
     * Performance-Tracking starten
     */
    performanceStart(operation) {
        return this.performance.start(`${this.module}:${operation}`);
    }
    
    /**
     * Performance-Tracking beenden
     */
    performanceEnd(operation) {
        return this.performance.end(`${this.module}:${operation}`);
    }
    
    /**
     * Alle Performance-Metriken abrufen
     */
    getPerformanceMetrics() {
        return this.performance.getMetrics();
    }
}

/**
 * Factory-Funktionen für Module
 */
export function createLogger(moduleName) {
    return new DebugLogger(moduleName);
}

/**
 * Vordefinierte Logger für die Haupt-Module
 */
export const loggers = {
    ui: new DebugLogger('ui'),
    api: new DebugLogger('api'),
    auth: new DebugLogger('auth'),
    modal: new DebugLogger('modal'),
    navigation: new DebugLogger('navigation'),
    performance: new DebugLogger('performance')
};

/**
 * Globale Debug-Funktionen (für Migration)
 */
export const debug = {
    info: (message, data) => loggers.ui.info(message, data),
    success: (message, data) => loggers.ui.success(message, data),
    warn: (message, data) => loggers.ui.warn(message, data),
    error: (message, error) => loggers.ui.error(message, error),
    api: (method, url, data) => loggers.api.api(method, url, data),
    nav: (action, details) => loggers.navigation.navigation(action, details)
};

/**
 * Debug-Konsole für Browser DevTools
 */
if (DEBUG_CONFIG.enabled) {
    window.menuePortalDebug = {
        ...window.menuePortalDebug,
        logger: {
            enable: (modules) => {
                if (Array.isArray(modules)) {
                    modules.forEach(mod => DEBUG_CONFIG.modules[mod] = true);
                } else {
                    Object.keys(DEBUG_CONFIG.modules).forEach(mod => DEBUG_CONFIG.modules[mod] = true);
                }
                console.log('🔧 Debug-Module aktiviert:', Object.keys(DEBUG_CONFIG.modules).filter(k => DEBUG_CONFIG.modules[k]));
            },
            disable: (modules) => {
                if (Array.isArray(modules)) {
                    modules.forEach(mod => DEBUG_CONFIG.modules[mod] = false);
                } else {
                    Object.keys(DEBUG_CONFIG.modules).forEach(mod => DEBUG_CONFIG.modules[mod] = false);
                }
                console.log('🔧 Debug-Module deaktiviert');
            },
            getConfig: () => DEBUG_CONFIG,
            getMetrics: () => {
                const allMetrics = {};
                Object.values(loggers).forEach(logger => {
                    Object.assign(allMetrics, logger.getPerformanceMetrics());
                });
                return allMetrics;
            }
        }
    };
    
    console.log('🔧 Debug-Logger aktiviert. Verwende window.menuePortalDebug.logger für Kontrolle');
} 