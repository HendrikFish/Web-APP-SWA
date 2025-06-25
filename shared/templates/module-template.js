/**
 * Module-Template für sichere modulare Entwicklung
 * Verwenden Sie dieses Template für neue Module um Abstürze zu vermeiden
 */

import { safeModuleInit, createErrorFallback, isModuleFailed } from '@shared/components/error-boundary/error-boundary.js';
import { api } from '@shared/utils/api-client.js';

// Module-Konstanten
const MODULE_NAME = 'TEMPLATE_MODULE'; // Ändern Sie dies für jedes neue Modul
const MODULE_CONTAINER_ID = 'app'; // Container-ID für das Modul

/**
 * Module-State (isoliert vom globalen State)
 */
let moduleState = {
    isInitialized: false,
    isLoading: false,
    data: null,
    error: null
};

/**
 * Haupt-Initialisierungs-Funktion des Moduls
 * Diese wird von safeModuleInit() aufgerufen
 */
async function initModule() {
    console.log(`🔄 Initialisiere ${MODULE_NAME}...`);
    
    // Überprüfen ob Container vorhanden ist
    const container = document.getElementById(MODULE_CONTAINER_ID);
    if (!container) {
        throw new Error(`Container mit ID '${MODULE_CONTAINER_ID}' nicht gefunden`);
    }

    // Error-Fallback erstellen falls Modul fehlschlägt
    if (isModuleFailed(MODULE_NAME)) {
        createErrorFallback(MODULE_NAME, container);
        return;
    }

    try {
        // Module-spezifische Initialisierung
        await loadModuleData();
        await setupEventListeners();
        await renderModuleUI();
        
        moduleState.isInitialized = true;
        console.log(`✅ ${MODULE_NAME} erfolgreich initialisiert`);
        
    } catch (error) {
        console.error(`❌ Fehler bei ${MODULE_NAME}-Initialisierung:`, error);
        createErrorFallback(MODULE_NAME, container);
        throw error; // Weitergeben an Error-Boundary
    }
}

/**
 * Lädt Module-spezifische Daten
 */
async function loadModuleData() {
    try {
        moduleState.isLoading = true;
        
        // Beispiel: Parallele API-Calls
        const [stammdaten, userDaten] = await Promise.all([
            api.get('/api/stammdaten'),
            api.get('/api/user/current')
        ]);
        
        moduleState.data = {
            stammdaten,
            user: userDaten
        };
        
        moduleState.isLoading = false;
        
    } catch (error) {
        moduleState.isLoading = false;
        moduleState.error = error;
        throw new Error(`Daten für ${MODULE_NAME} konnten nicht geladen werden: ${error.message}`);
    }
}

/**
 * Event-Listener für Module-spezifische Interaktionen
 */
async function setupEventListeners() {
    try {
        const container = document.getElementById(MODULE_CONTAINER_ID);
        
        // Delegated Event-Handling für bessere Performance
        container.addEventListener('click', handleContainerClick);
        container.addEventListener('change', handleContainerChange);
        
        // Window-Events mit Cleanup
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('resize', handleResize);
        
    } catch (error) {
        throw new Error(`Event-Listener für ${MODULE_NAME} konnten nicht eingerichtet werden: ${error.message}`);
    }
}

/**
 * Rendert die Module-UI
 */
async function renderModuleUI() {
    try {
        const container = document.getElementById(MODULE_CONTAINER_ID);
        
        // Loading-State anzeigen
        if (moduleState.isLoading) {
            container.innerHTML = createLoadingHTML();
            return;
        }
        
        // Error-State anzeigen
        if (moduleState.error) {
            container.innerHTML = createErrorHTML(moduleState.error);
            return;
        }
        
        // Normale UI rendern
        container.innerHTML = createModuleHTML();
        
        // Post-Render-Initialisierungen
        await initializeUIComponents();
        
    } catch (error) {
        throw new Error(`UI für ${MODULE_NAME} konnte nicht gerendert werden: ${error.message}`);
    }
}

/**
 * Erstellt HTML für Loading-State
 */
function createLoadingHTML() {
    return `
        <div class="d-flex justify-content-center align-items-center min-vh-100">
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Lädt...</span>
                </div>
                <p class="mt-3 text-muted">Lade ${MODULE_NAME}...</p>
            </div>
        </div>
    `;
}

/**
 * Erstellt HTML für Error-State
 */
function createErrorHTML(error) {
    return `
        <div class="alert alert-danger d-flex align-items-center" role="alert">
            <i class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2"></i>
            <div>
                <strong>Fehler beim Laden von ${MODULE_NAME}</strong><br>
                <small>${error.message}</small>
            </div>
            <button type="button" class="btn btn-outline-danger btn-sm ms-auto" onclick="location.reload()">
                <i class="bi bi-arrow-clockwise"></i> Neu laden
            </button>
        </div>
    `;
}

/**
 * Erstellt die Haupt-HTML-Struktur
 */
function createModuleHTML() {
    return `
        <div class="container-fluid">
            <div class="row">
                <div class="col">
                    <h1>🎯 ${MODULE_NAME}</h1>
                    <p>Module erfolgreich geladen!</p>
                    
                    <!-- Module-spezifische Inhalte hier einfügen -->
                    <div id="${MODULE_NAME}-content">
                        <!-- Dynamische Inhalte -->
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialisiert UI-Komponenten nach dem Rendering
 */
async function initializeUIComponents() {
    try {
        // Beispiel: Bootstrap-Komponenten initialisieren
        // const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        // tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
        
        console.log(`🎨 UI-Komponenten für ${MODULE_NAME} initialisiert`);
        
    } catch (error) {
        console.warn(`⚠️ UI-Komponenten für ${MODULE_NAME} konnten nicht vollständig initialisiert werden:`, error);
        // Nicht kritisch - UI sollte trotzdem funktionieren
    }
}

/**
 * Event-Handler für Container-Clicks (delegiert)
 */
function handleContainerClick(event) {
    try {
        // Module-spezifische Click-Behandlung
        const target = event.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        console.log(`🖱️ ${MODULE_NAME} Action:`, action);
        
        // Action-Router
        switch (action) {
            case 'reload':
                location.reload();
                break;
            // Weitere Actions hier hinzufügen
            default:
                console.warn(`Unbekannte Action: ${action}`);
        }
        
    } catch (error) {
        console.error(`Fehler bei Click-Handling in ${MODULE_NAME}:`, error);
        // UI sollte weiter funktionieren
    }
}

/**
 * Event-Handler für Container-Changes
 */
function handleContainerChange(event) {
    try {
        // Module-spezifische Change-Behandlung
        console.log(`📝 ${MODULE_NAME} Change:`, event.target);
        
    } catch (error) {
        console.error(`Fehler bei Change-Handling in ${MODULE_NAME}:`, error);
    }
}

/**
 * Window-Resize-Handler
 */
function handleResize() {
    try {
        // Responsive Anpassungen
        console.log(`📐 ${MODULE_NAME} Resize-Event`);
        
    } catch (error) {
        console.error(`Fehler bei Resize-Handling in ${MODULE_NAME}:`, error);
    }
}

/**
 * Cleanup-Funktion für Module-Aufräumarbeiten
 */
function cleanup() {
    try {
        console.log(`🧹 Cleanup für ${MODULE_NAME}...`);
        
        // Event-Listener entfernen
        // API-Calls abbrechen
        // Timers/Intervals stoppen
        
        moduleState.isInitialized = false;
        
    } catch (error) {
        console.error(`Fehler beim Cleanup von ${MODULE_NAME}:`, error);
    }
}

/**
 * API-Funktionen (Module-spezifisch)
 */
const moduleApi = {
    
    /**
     * Beispiel API-Funktion
     */
    async getData() {
        try {
            return await api.get(`/api/${MODULE_NAME}/data`);
        } catch (error) {
            console.error(`API-Fehler in ${MODULE_NAME}:`, error);
            throw error;
        }
    },
    
    /**
     * Weitere API-Funktionen hier hinzufügen
     */
};

/**
 * Öffentliche Module-API
 */
export const moduleExports = {
    // Haupt-Initialisierung (wird von Script.js aufgerufen)
    init: () => safeModuleInit(initModule, MODULE_NAME),
    
    // Weitere öffentliche Funktionen
    getState: () => ({ ...moduleState }),
    cleanup,
    api: moduleApi
};

// Auto-Initialisierung falls Modul direkt geladen wird
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', moduleExports.init);
} else {
    moduleExports.init();
}

// Default Export für ES6-Module
export default moduleExports; 