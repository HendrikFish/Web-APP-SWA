// menue-portal-controls-handler.js - Setup & Controls-Management für das Menü-Portal
// Extrahiert aus menue-portal-ui.js für bessere Modularität

import { 
    navigateWeek,
    navigateToCurrentWeek,
    loadAndDisplayMenuplan
} from './menue-portal-navigation-handler.js';
import { 
    isMobileView,
    updateMobileDetection,
    updateWeekDisplay
} from './menue-portal-ui-utils.js';
import { 
    getMondayOfWeek,
    formatDate
} from './menue-portal-api.js';

// Controls State
let eventListenersInitialized = false;
let bestellControlsInitialized = false;

/**
 * Initialisiert den Controls-Handler
 * @param {object} config - Konfiguration mit Callbacks
 */
export function initControlsHandler(config) {
    // Konfiguration speichern
    window.controlsHandlerConfig = config;
    
    console.log('🎛️ Controls-Handler initialisiert');
}

/**
 * Setup der Steuerelemente (Wochennavigation + Bestellaktionen)
 * @param {object} callbacks - UI-Callback-Funktionen
 * @param {function} callbacks.printMenuplan - Print-Funktion
 * @param {function} callbacks.exportToPDF - PDF-Export-Funktion
 * @param {function} callbacks.renderMenuplanWrapper - Rendering-Wrapper
 * @param {function} callbacks.updateBestellControlsContent - Bestellcontrols-Update
 * @param {number} currentWeek - Aktuelle Woche
 * @param {number} currentYear - Aktuelles Jahr
 */
export function setupControls(callbacks, currentWeek, currentYear) {
    const {
        printMenuplan,
        exportToPDF,
        renderMenuplanWrapper,
        updateBestellControlsContent,
        setupBestellControlsCallback
    } = callbacks;
    
    // Wochennavigation
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const currentWeekBtn = document.getElementById('current-week');
    
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => navigateWeek(-1, {
            updateBestellControlsContent,
            renderMenuplan: renderMenuplanWrapper
        }));
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => navigateWeek(1, {
            updateBestellControlsContent,
            renderMenuplan: renderMenuplanWrapper
        }));
    }
    
    if (currentWeekBtn) {
        currentWeekBtn.addEventListener('click', () => navigateToCurrentWeek({
            updateBestellControlsContent,
            renderMenuplan: renderMenuplanWrapper
        }));
    }
    
    // Action Buttons
    const printBtn = document.getElementById('print-menu');
    const pdfBtn = document.getElementById('export-pdf');
    const refreshBtn = document.getElementById('refresh-menu');
    
    if (printBtn) {
        printBtn.addEventListener('click', printMenuplan);
    }
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', exportToPDF);
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadAndDisplayMenuplan({
            renderMenuplan: renderMenuplanWrapper
        }));
    }
    
    // Bestellaktionen für externe Einrichtungen
    setupBestellControlsCallback();
    
    // Aktuelle Woche anzeigen
    updateWeekDisplay(currentWeek, currentYear, getMondayOfWeek, formatDate);
}

/**
 * Setup für Bestellungs-Controls (nur bei externen Einrichtungen)
 * @param {object} callbacks - Action-Callbacks
 * @param {function} callbacks.exportCurrentBestellungen - Export-Funktion
 * @param {function} callbacks.clearCurrentBestellungen - Clear-Funktion
 * @param {function} callbacks.validateCurrentBestellungen - Validate-Funktion
 * @param {function} callbacks.updateBestellControlsContent - Content-Update-Funktion
 */
export function setupBestellControls(callbacks) {
    const {
        exportCurrentBestellungen,
        clearCurrentBestellungen,
        validateCurrentBestellungen,
        updateBestellControlsContent
    } = callbacks;
    
    // Event-Listener nur einmal in action-buttons-container registrieren
    if (!bestellControlsInitialized) {
        const actionContainer = document.querySelector('.action-buttons-container');
        if (actionContainer) {
            actionContainer.addEventListener('click', (e) => {
                if (e.target.id === 'export-bestellungen') {
                    exportCurrentBestellungen();
                } else if (e.target.id === 'clear-bestellungen') {
                    clearCurrentBestellungen();
                } else if (e.target.id === 'validate-bestellungen') {
                    validateCurrentBestellungen();
                }
            });
        }
        bestellControlsInitialized = true;
        console.log('✅ Bestellkontrollen Event-Listener initialisiert');
    }
    
    // HTML-Inhalt aktualisieren
    updateBestellControlsContent();
}

/**
 * Aktualisiert nur den Inhalt der Bestellkontrollen ohne Event-Listener neu zu registrieren
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {number} currentWeek - Aktuelle Woche
 * @param {number} currentYear - Aktuelles Jahr
 */
export function updateBestellControlsContent(currentEinrichtung, currentWeek, currentYear) {
    const actionContainer = document.querySelector('.action-buttons-container .d-flex');
    const bestellContainer = document.getElementById('bestellung-controls');
    
    // Alten bestellung-controls Container ausblenden
    if (bestellContainer) {
        bestellContainer.style.display = 'none';
    }
    
    if (!actionContainer) return;
    
    // Vorhandene Bestellungs-Buttons entfernen
    const existingBestellButtons = actionContainer.querySelectorAll('.bestellung-control-btn');
    existingBestellButtons.forEach(btn => btn.remove());
    
    // Für externe Einrichtungen: Bestellungs-Buttons hinzufügen
    if (currentEinrichtung && !currentEinrichtung.isIntern) {
        const bestellButtons = `
            <div class="d-flex gap-2 me-2 bestellung-control-btn">
                <span class="text-success fw-bold me-2" style="line-height: 2.25rem;">
                    <i class="bi bi-cart-check-fill me-1"></i>
                    KW ${currentWeek}/${currentYear}:
                </span>
                <button type="button" class="btn btn-outline-success btn-sm" id="export-bestellungen">
                        <i class="bi bi-download me-1"></i>
                    Export
                    </button>
                <button type="button" class="btn btn-outline-warning btn-sm" id="clear-bestellungen">
                        <i class="bi bi-trash me-1"></i>
                        Löschen
                    </button>
                <button type="button" class="btn btn-outline-info btn-sm" id="validate-bestellungen">
                        <i class="bi bi-check-circle me-1"></i>
                        Prüfen
                    </button>
        </div>
    `;
        actionContainer.insertAdjacentHTML('afterbegin', bestellButtons);
    }
}

/**
 * Setup der Layout Event-Listener (nur einmal)
 * @param {function} renderMenuplanWrapper - Rendering-Wrapper-Funktion
 */
export function setupLayoutEventListeners(renderMenuplanWrapper) {
    // Verhindere mehrfache Registrierung
    if (eventListenersInitialized) {
        return;
    }
    
    // Resize-Handler
    window.addEventListener('menue-portal:layout-change', () => {
        const isMobile = isMobileView();
        updateMobileDetection(isMobile, renderMenuplanWrapper);
    });
    
    // Window Resize mit Debouncing um Toast-Spam zu verhindern
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const isMobile = isMobileView();
            updateMobileDetection(isMobile, renderMenuplanWrapper);
        }, 250); // 250ms Debounce
    });
    
    eventListenersInitialized = true;
    console.log('✅ Layout Event-Listener initialisiert');
}

/**
 * Exportiert den aktuellen Status der Controls-Initialisierung
 */
export function getControlsStatus() {
    return {
        eventListenersInitialized,
        bestellControlsInitialized
    };
}

/**
 * Resettet den Controls-Status (für Tests/Entwicklung)
 */
export function resetControlsStatus() {
    eventListenersInitialized = false;
    bestellControlsInitialized = false;
} 