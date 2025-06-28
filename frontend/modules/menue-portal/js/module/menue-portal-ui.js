// menue-portal-ui.js - REFAKTORIERTE UI-Funktionen für das Menü-Portal
// Orchestriert Mobile Accordion, Desktop Calendar und Bestellfunktionalität

import { showToast } from '@shared/components/toast-notification/toast-notification.js';
import { 
    loadPortalStammdaten
} from './menue-portal-api.js';
import { 
    isMobileView,
    updateMobileDetection,
    updateWeekDisplay,
    showLoading,
    hideLoading,
    showError,
    printMenuplan as printMenuplanUtil,
    exportToPDF as exportToPDFUtil,
    getISOWeek,
    getWeekNumber,
    getWeeksInYear
} from './menue-portal-ui-utils.js';
import { getAllEinrichtungen, getDefaultEinrichtung } from './menue-portal-auth.js';
import { initBewertungModal, openBewertungModal } from './bewertung-modal.js';
import { istDatumBewertbar } from './bewertung-api.js';
import { initInformationModal, openNewInformationModal, openInformationManagementModal } from './informationen-modal.js';
import { getInformationen } from './informationen-api.js';
import { 
    initInformationHandler,
    loadInformationenData
} from './menue-portal-information-handler.js';
import { 
    initNavigationHandler,
    switchEinrichtung,
    navigateWeek,
    navigateToCurrentWeek,
    loadAndDisplayMenuplan,
    getCurrentMenuplan,
    getRezepteCache
} from './menue-portal-navigation-handler.js';
import { 
    renderMenuplan,
    istKategorieZugewiesen,
    istKategorieRelevantFuerEinrichtung,
    extractVisibleCategories
} from './menue-portal-rendering-handler.js';
// renderMobileAccordion und renderDesktopCalendar jetzt über rendering-handler
import { 
    handleBestellungChange, 
    loadBestellungenFromAPI, 
    loadBestellungenIntoUI,
    exportBestellungen,
    clearBestellungen,
    validateBestellungen 
} from './bestellung-handler.js';

// Globale UI-State
let currentEinrichtung = null;
let currentUser = null;

// ISO 8601-konforme Initialisierung
const currentISOWeek = (() => {
    const now = new Date();
    const d = new Date(now.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 1);
    const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return { year: d.getFullYear(), week: weekNumber };
})();

let currentYear = currentISOWeek.year;
let currentWeek = currentISOWeek.week;
let isMobile = false;
let portalStammdaten = null;
let eventListenersInitialized = false; // Flag um mehrfache Event-Listener zu verhindern
let bestellControlsInitialized = false; // Flag für Bestellkontrollen Event-Listener
// currentMenuplan und rezepteCache jetzt in navigation-handler verwaltet
// Informationsdaten jetzt in information-handler verwaltet

/**
 * Initialisiert die UI-Module
 * @param {object} user - Aktueller Benutzer
 * @param {object[]} einrichtungen - Verfügbare Einrichtungen
 */
export async function initMenuePortalUI(user, einrichtungen) {
    try {
        console.log('🎨 Menü-Portal UI wird initialisiert...');
        
        // Benutzer speichern
        currentUser = user;
        window.currentUser = user; // Global verfügbar für Module
        
        // Portal-Stammdaten laden
        const stammdatenResult = await loadPortalStammdaten();
        if (stammdatenResult.success) {
            portalStammdaten = stammdatenResult.stammdaten;
            console.log('✅ Portal-Stammdaten geladen:', portalStammdaten);
        } else {
            console.warn('⚠️ Portal-Stammdaten konnten nicht geladen werden, verwende Fallback');
            // Fallback-Stammdaten
            portalStammdaten = {
                kategorien: {
                    'suppe': { name: 'Suppe', icon: 'bowl-hot' },
                    'menu1': { name: 'Menü 1', icon: 'egg-fried' }, 
                    'menu2': { name: 'Menü 2', icon: 'fish' },
                    'menu': { name: 'Hauptspeise', icon: 'egg-fried' },
                    'dessert': { name: 'Dessert', icon: 'cake' },
                    'abend': { name: 'Abendessen', icon: 'moon-stars' }
                }
            };
        }
        
        // Mobile Detection
        isMobile = isMobileView();
        updateMobileDetection(isMobile, renderMenuplanWrapper);
        
        // Loading ausblenden
        hideLoading();
        
        // Einrichtungs-Selector setup
        setupEinrichtungsSelector(einrichtungen);
        
        // Controls setup
        setupControls();
        
        // Layout Event-Listener
        setupLayoutEventListeners();
        
        // Informations-System initialisieren
        initInformationHandler();
        
        // Navigation-Handler initialisieren
        initNavigationHandler({
            updateActiveEinrichtungButton,
            updateEinrichtungsInfo,
            setupBestellControls,
            updateBestellControlsContent,
            renderMenuplanWrapper
        });
        
        // Standard-Einrichtung wählen und Menüplan laden
        currentEinrichtung = getDefaultEinrichtung();
        console.log('🏢 Standard-Einrichtung ermittelt:', currentEinrichtung ? 
            `${currentEinrichtung.name} (ID: ${currentEinrichtung.id})` : 
            'KEINE EINRICHTUNG GEFUNDEN');
            
        if (currentEinrichtung) {
            window.currentEinrichtung = currentEinrichtung; // Global verfügbar
            
            // Bestellungen für die gewählte Einrichtung laden
            await loadBestellungenFromAPI();
            
            await loadAndDisplayMenuplan({
                renderMenuplan: renderMenuplanWrapper
            });
            // Bewertungs-Modal nach dem Laden des Menüplans initialisieren
            initBewertungModal(currentUser, currentEinrichtung);
            // Informations-Modal initialisieren
            initInformationModal(currentUser, currentEinrichtung);
        } else {
            console.error('❌ Keine Standard-Einrichtung verfügbar!');
            showError('Keine Einrichtung verfügbar');
        }
        
        console.log('✅ Menü-Portal UI initialisiert');
        
    } catch (error) {
        console.error('❌ Fehler bei UI-Initialisierung:', error);
        showToast('Fehler beim Initialisieren der Benutzeroberfläche', 'error');
    }
}

/**
 * Setup der Einrichtungs-Auswahl (nur einmal aufrufen)
 * @param {object[]} einrichtungen - Verfügbare Einrichtungen
 */
function setupEinrichtungsSelector(einrichtungen) {
    const container = document.getElementById('einrichtungs-selector');
    
    if (!container) return;
    
    // Wenn nur eine Einrichtung: Selector ausblenden
    if (einrichtungen.length <= 1) {
        container.style.display = 'none';
        updateEinrichtungsInfo(); // Info trotzdem aktualisieren
        return;
    }
    
    // Buttons für jede Einrichtung erstellen
    const buttonsHtml = einrichtungen.map(einrichtung => {
        const typeLabel = einrichtung.isIntern ? 'Intern' : 'Extern';
        const typeColor = einrichtung.isIntern ? 'info' : 'success';
        
        return `
            <button 
                type="button" 
                class="btn btn-outline-primary einrichtung-btn" 
                data-einrichtung-id="${einrichtung.id}"
            >
                ${einrichtung.name}
                <span class="badge bg-light text-dark ms-1">${einrichtung.kuerzel}</span>
                <span class="badge bg-${typeColor} ms-1">${typeLabel}</span>
            </button>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <div class="d-flex align-items-center flex-wrap gap-3">
                    <h6 class="card-title mb-0">
                    <i class="bi bi-building"></i> Einrichtung wählen:
                </h6>
                <div class="btn-group-sm d-flex flex-wrap gap-2" role="group">
                    ${buttonsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Selector anzeigen
    container.style.display = 'block';
    
    // Event-Listener für Einrichtungsauswahl (nur einmal registrieren)
    container.addEventListener('click', async (e) => {
        if (e.target.classList.contains('einrichtung-btn')) {
            const einrichtungId = e.target.dataset.einrichtungId;
            await switchEinrichtung(einrichtungId, {
                updateActiveEinrichtungButton,
                updateEinrichtungsInfo,
                setupBestellControls,
                renderMenuplan: renderMenuplanWrapper
            });
        }
    });
    
    // Aktuelle Einrichtung als aktiv markieren
    updateActiveEinrichtungButton();
    // Einrichtungs-Info aktualisieren
    updateEinrichtungsInfo();
}

/**
 * Aktualisiert nur die Einrichtungs-Info ohne Event-Listener neu zu registrieren
 */
function updateEinrichtungsInfo() {
    const infoElement = document.getElementById('einrichtungs-info');
    
    if (infoElement && currentEinrichtung) {
        const typeLabel = currentEinrichtung.isIntern ? 'Intern' : 'Extern';
        const typeColor = currentEinrichtung.isIntern ? 'bg-info' : 'bg-success';
        
        infoElement.innerHTML = `
            <i class="bi bi-building"></i>
            <strong>${currentEinrichtung.name}</strong>
            <span class="badge bg-secondary ms-2">${currentEinrichtung.kuerzel}</span>
            <span class="badge ${typeColor} ms-1">${typeLabel}</span>
        `;
    }
}

/**
 * Aktualisiert die aktiven Button-Klassen ohne Event-Listener neu zu registrieren
 */
function updateActiveEinrichtungButton() {
    if (currentEinrichtung) {
        // Alle Buttons deaktivieren
        document.querySelectorAll('.einrichtung-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Aktuellen Button aktivieren
        const activeBtn = document.querySelector(`[data-einrichtung-id="${currentEinrichtung.id}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

/**
 * Setup der Steuerelemente (Wochennavigation + Bestellaktionen)
 */
function setupControls() {
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
    setupBestellControls();
    
    // Aktuelle Woche anzeigen
    updateWeekDisplay(currentWeek, currentYear, getMondayOfWeek, formatDate);
}

/**
 * Setup für Bestellungs-Controls (nur bei externen Einrichtungen)
 */
function setupBestellControls() {
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
 */
function updateBestellControlsContent() {
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
 */
function setupLayoutEventListeners() {
    // Verhindere mehrfache Registrierung
    if (eventListenersInitialized) {
        return;
    }
    
    // Resize-Handler
    window.addEventListener('menue-portal:layout-change', () => {
        isMobile = isMobileView();
        updateMobileDetection(isMobile, renderMenuplanWrapper);
    });
    
    // Window Resize mit Debouncing um Toast-Spam zu verhindern
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            isMobile = isMobileView();
            updateMobileDetection(isMobile, renderMenuplanWrapper);
        }, 250); // 250ms Debounce
    });
    
    eventListenersInitialized = true;
    console.log('✅ Layout Event-Listener initialisiert');
}

// Information Event-Listener jetzt in information-handler

// updateInformationButtons jetzt in information-handler

// getDayFromButton und getCategoryFromButton jetzt in information-handler

// handleInformationClick jetzt in information-handler

// switchEinrichtung jetzt in navigation-handler

// navigateWeek jetzt in navigation-handler

// navigateToCurrentWeek jetzt in navigation-handler

// loadAndDisplayMenuplan jetzt in navigation-handler

// loadMenuplanRecipes jetzt in navigation-handler

// loadInformationenData jetzt in information-handler

/**
 * Rendert den Menüplan basierend auf Bildschirmgröße - Wrapper für Rendering-Handler
 */
function renderMenuplanWrapper() {
    renderMenuplan(isMobile, portalStammdaten, currentEinrichtung, currentYear, currentWeek);
}

// istKategorieZugewiesen jetzt in rendering-handler

// istKategorieRelevantFuerEinrichtung jetzt in rendering-handler 

// extractVisibleCategories jetzt in rendering-handler

// === Bestellaktionen ===

function exportCurrentBestellungen() {
    const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
    const exportData = exportBestellungen(wochenschluessel);
    
    if (!exportData) {
        showToast('Keine Bestellungen zum Exportieren', 'warning');
        return;
    }
    
    // JSON-Download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bestellungen-${currentEinrichtung.kuerzel}-KW${currentWeek}-${currentYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Bestellungen exportiert', 'success');
}

function clearCurrentBestellungen() {
    if (!confirm('Alle Bestellungen für diese Woche löschen?')) return;
    
    const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
    clearBestellungen(wochenschluessel);
    
    // UI neu rendern
    renderMenuplanWrapper();
}

function validateCurrentBestellungen() {
    const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
    const validation = validateBestellungen(wochenschluessel);
    
    if (validation.valid) {
        showToast('Alle Bestellungen sind gültig', 'success');
    } else {
        let message = 'Bestellprobleme gefunden:\n';
        validation.errors.forEach(error => message += `- ${error}\n`);
        if (validation.warnings.length > 0) {
            message += '\nWarnungen:\n';
            validation.warnings.forEach(warning => message += `- ${warning}\n`);
        }
        alert(message);
    }
}

// === Layout & Hilfsfunktionen jetzt in UI-Utils ===

function printMenuplan() {
    // Callback für Mobile-Detection-Update
    const updateMobileCallback = () => {
        isMobile = isMobileView();
        updateMobileDetection(isMobile, renderMenuplanWrapper);
    };
    
    // UI-Utils-Funktion verwenden (aus Import)
    printMenuplanUtil(isMobile, renderMenuplanWrapper, updateMobileCallback);
}

function exportToPDF() {
    // Callback für Mobile-Detection-Update
    const updateMobileCallback = () => {
        isMobile = isMobileView();
        updateMobileDetection(isMobile, renderMenuplanWrapper);
    };
    
    // UI-Utils-Funktion verwenden (aus Import)
    exportToPDFUtil(currentWeek, currentYear, currentEinrichtung, isMobile, renderMenuplanWrapper, updateMobileCallback);
}

// ISO-Funktionen sind jetzt in UI-Utils verfügbar

// Global verfügbar machen für Event-Handler
window.handleBewertungClick = function(dayKey, categoryKey, rezeptNamen, dateString) {
    const date = new Date(dateString);
    openBewertungModal(dayKey, categoryKey, rezeptNamen, date);
};

// Module als globale Variablen verfügbar machen
window.currentWeek = currentWeek;
window.currentYear = currentYear;
window.showToast = showToast;
window.istKategorieZugewiesen = istKategorieZugewiesen;