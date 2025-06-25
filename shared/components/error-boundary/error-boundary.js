/**
 * Globale Error-Boundary für Module-Isolation
 * Verhindert dass einzelne Module die ganze App zum Absturz bringen
 */

let globalErrorHandler = null;

/**
 * Initialisiert die globale Error-Boundary
 */
export function initErrorBoundary() {
    // Globaler Fehler-Handler für unbehandelte Errors
    window.addEventListener('error', (event) => {
        console.error('🚨 Globaler JavaScript-Fehler:', event.error);
        handleModuleError(event.error, 'JavaScript Runtime Error');
        event.preventDefault(); // Verhindert dass der Browser abstürzt
    });

    // Handler für unbehandelte Promise-Rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('🚨 Unbehandelte Promise-Rejection:', event.reason);
        handleModuleError(event.reason, 'Promise Rejection');
        event.preventDefault();
    });

    console.log('✅ Error-Boundary initialisiert');
}

/**
 * Behandelt Module-spezifische Fehler
 * @param {Error} error - Der aufgetretene Fehler
 * @param {string} moduleName - Name des betroffenen Moduls
 */
function handleModuleError(error, moduleName = 'Unbekanntes Modul') {
    const errorInfo = {
        moduleName,
        message: error.message || 'Unbekannter Fehler',
        stack: error.stack,
        timestamp: new Date().toISOString()
    };

    // Error in der Konsole protokollieren
    console.group(`🚨 Modul-Fehler: ${moduleName}`);
    console.error('Fehler:', error);
    console.error('Stack:', error.stack);
    console.groupEnd();

    // Toast-Benachrichtigung anzeigen (falls verfügbar)
    showErrorToast(errorInfo);

    // Optional: Error an Backend senden für Monitoring
    sendErrorToBackend(errorInfo);
}

/**
 * Zeigt eine benutzerfreundliche Fehlermeldung
 */
function showErrorToast(errorInfo) {
    try {
        import('@shared/components/toast-notification/toast-notification.js')
            .then(({ showToast }) => {
                showToast(
                    `Fehler in ${errorInfo.moduleName}: ${errorInfo.message}`, 
                    'error'
                );
            })
            .catch(() => {
                // Fallback wenn Toast nicht verfügbar
                alert(`Fehler in ${errorInfo.moduleName}: ${errorInfo.message}`);
            });
    } catch (e) {
        console.warn('Toast-System nicht verfügbar, verwende Alert-Fallback');
        alert(`Fehler in ${errorInfo.moduleName}: ${errorInfo.message}`);
    }
}

/**
 * Sendet Fehler-Details an Backend für Monitoring
 */
async function sendErrorToBackend(errorInfo) {
    try {
        await fetch('/api/errors/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorInfo)
        });
    } catch (e) {
        console.warn('Konnte Fehler nicht an Backend senden:', e);
    }
}

/**
 * Wrapper-Funktion für Module-Initialisierung mit Error-Handling
 * @param {Function} initFunction - Die Initialisierungs-Funktion des Moduls
 * @param {string} moduleName - Name des Moduls
 */
export async function safeModuleInit(initFunction, moduleName) {
    try {
        console.log(`🔄 Initialisiere Modul: ${moduleName}`);
        await initFunction();
        console.log(`✅ Modul erfolgreich geladen: ${moduleName}`);
    } catch (error) {
        console.error(`❌ Fehler beim Laden von Modul ${moduleName}:`, error);
        handleModuleError(error, moduleName);
        
        // Modul als fehlgeschlagen markieren aber App weiterlaufen lassen
        markModuleAsFailed(moduleName, error);
    }
}

/**
 * Markiert ein Modul als fehlgeschlagen
 */
function markModuleAsFailed(moduleName, error) {
    window.failedModules = window.failedModules || [];
    window.failedModules.push({
        name: moduleName,
        error: error.message,
        timestamp: new Date().toISOString()
    });
}

/**
 * Prüft ob ein Modul fehlgeschlagen ist
 */
export function isModuleFailed(moduleName) {
    return window.failedModules?.some(m => m.name === moduleName) || false;
}

/**
 * Erstellt einen Error-Fallback-Container für ein fehlgeschlagenes Modul
 */
export function createErrorFallback(moduleName, container) {
    if (container) {
        container.innerHTML = `
            <div class="alert alert-warning d-flex align-items-center" role="alert">
                <i class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2"></i>
                <div>
                    <strong>Modul "${moduleName}" konnte nicht geladen werden.</strong><br>
                    <small>Bitte versuchen Sie die Seite neu zu laden oder kontaktieren Sie den Support.</small>
                </div>
                <button type="button" class="btn btn-outline-warning btn-sm ms-auto" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise"></i> Neu laden
                </button>
            </div>
        `;
    }
} 