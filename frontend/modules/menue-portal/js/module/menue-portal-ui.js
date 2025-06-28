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
import { 
    initControlsHandler,
    setupControls,
    setupBestellControls,
    updateBestellControlsContent,
    setupLayoutEventListeners
} from './menue-portal-controls-handler.js';
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
// eventListenersInitialized und bestellControlsInitialized jetzt in controls-handler verwaltet
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
        
        // Controls-Handler initialisieren
        initControlsHandler({
            updateBestellControlsContent: updateBestellControlsContentWrapper,
            setupBestellControls: setupBestellControlsWrapper
        });
        
        // Controls setup
        setupControls({
            printMenuplan,
            exportToPDF,
            renderMenuplanWrapper,
            updateBestellControlsContent: updateBestellControlsContentWrapper,
            setupBestellControlsCallback: setupBestellControlsWrapper
        }, currentWeek, currentYear);
        
        // Layout Event-Listener
        setupLayoutEventListeners(renderMenuplanWrapper);
        
        // Informations-System initialisieren
        initInformationHandler();
        
        // Navigation-Handler initialisieren
        initNavigationHandler({
            updateActiveEinrichtungButton,
            updateEinrichtungsInfo,
            setupBestellControls: setupBestellControlsWrapper,
            updateBestellControlsContent: updateBestellControlsContentWrapper,
            renderMenuplanWrapper
        });
        
        // Standard-Einrichtung wählen und Menüplan laden
        currentEinrichtung = getDefaultEinrichtung();
        console.log('🏢 Standard-Einrichtung ermittelt:', currentEinrichtung ? 
            `${currentEinrichtung.name} (ID: ${currentEinrichtung.id})` : 
            'KEINE EINRICHTUNG GEFUNDEN');
            
        if (currentEinrichtung) {
            window.currentEinrichtung = currentEinrichtung; // Global verfügbar
            
            // Standard-Einrichtung für künftige Sitzungen speichern
            localStorage.setItem('menue-portal-last-einrichtung', currentEinrichtung.id);
            
            // Bestellungen für die gewählte Einrichtung laden
            await loadBestellungenFromAPI();
            
            await loadAndDisplayMenuplan({
                renderMenuplan: renderMenuplanWrapper
            });
            
            // Informationen für die aktuelle Woche laden
            await loadInformationenData(currentEinrichtung, currentYear, currentWeek);
            
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
                setupBestellControls: setupBestellControlsWrapper,
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
 * Rendert den Menüplan basierend auf Bildschirmgröße - Wrapper für Rendering-Handler
 */
function renderMenuplanWrapper() {
    console.log('🎨 Render Wrapper Debug:', {
        isMobile,
        portalStammdaten: !!portalStammdaten,
        currentEinrichtung: currentEinrichtung ? currentEinrichtung.name : 'KEINE',
        currentYear,
        currentWeek
    });
    
    // Parameter-Validation
    if (!currentEinrichtung) {
        console.warn('⚠️ Rendering ohne Einrichtung - warte auf Initialisierung');
        return;
    }
    
    if (!currentYear || !currentWeek) {
        console.warn('⚠️ Rendering ohne Jahr/Woche - warte auf Initialisierung');
        return;
    }
    
    renderMenuplan(isMobile, portalStammdaten, currentEinrichtung, currentYear, currentWeek);
}

/**
 * Wrapper für setupBestellControls mit lokalen Funktions-Callbacks
 */
function setupBestellControlsWrapper() {
    setupBestellControls({
        exportCurrentBestellungen,
        clearCurrentBestellungen,
        validateCurrentBestellungen,
        updateBestellControlsContent: updateBestellControlsContentWrapper
    });
}

/**
 * Wrapper für updateBestellControlsContent
 */
function updateBestellControlsContentWrapper() {
    updateBestellControlsContent(currentEinrichtung, currentWeek, currentYear);
}

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