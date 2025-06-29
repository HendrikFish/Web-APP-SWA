/**
 * Haupt-Script für Zahlen-Auswertung Modul
 * Koordiniert API-Calls, UI-Updates und Event-Handling
 */

// CSS Imports
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@shared/styles/layout.css';
import '../css/style.css';

// Imports
import { initializeHeader } from '@shared/components/header/header.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';

import {
    getVerfügbareWochen,
    getBestelldaten,
    markiereAlsGelesen,
    getAktuellsteWoche,
    exportiereAlsCSV,
    getAktuelleKalenderwoche,
    getPreviousWeek,
    getNextWeek,
    formatWeekDisplay,
    markiereInformationAlsGelesen
} from './module/bestelldaten-api.js';

import {
    renderDesktopTabelle,
    renderMobileAkkordeon,
    renderInfoModal,
    toggleLoadingState,
    showNoDatenState
} from './module/zahlen-ui.js';

// Global State
let aktuelleBestelldaten = null;
let aktuelleWoche = null;

/**
 * Initialisiert das Zahlen-Auswertung-Modul
 */
async function initializeZahlenAuswertung() {
    try {
        // Header initialisieren
        await initializeHeader();
        
        // Event-Listener setup
        setupEventListeners();
        
        // Starte mit aktueller Woche
        await starteMitAktuellerWoche();
        
        console.log('Zahlen-Auswertung Modul erfolgreich initialisiert');
        
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        showToast('Fehler beim Laden des Moduls', 'error');
    }
}

/**
 * Startet mit der aktuellen Kalenderwoche
 */
async function starteMitAktuellerWoche() {
    try {
        // Versuche zuerst die aktuellste verfügbare Woche
        const aktuellsteWoche = await getAktuellsteWoche();
        
        if (aktuellsteWoche) {
            // Verwende aktuellste verfügbare Woche
            aktuelleWoche = {
                year: aktuellsteWoche.year,
                week: aktuellsteWoche.week
            };
        } else {
            // Fallback: Aktuelle Kalenderwoche
            aktuelleWoche = getAktuelleKalenderwoche();
        }
        
        updateWeekDisplay();
        await ladeBestelldatenFürWoche(aktuelleWoche.year, aktuelleWoche.week);
        
    } catch (error) {
        console.error('Fehler beim Starten mit aktueller Woche:', error);
        showToast('Fehler beim Laden der aktuellen Woche', 'error');
    }
}

/**
 * Aktualisiert die Wochenanzeige
 */
function updateWeekDisplay() {
    const weekDisplay = document.getElementById('week-display');
    if (weekDisplay && aktuelleWoche) {
        weekDisplay.textContent = formatWeekDisplay(aktuelleWoche.year, aktuelleWoche.week);
    }
}

/**
 * Navigiert zur vorherigen Woche
 */
async function navigiereToPreviousWeek() {
    if (!aktuelleWoche) return;
    
    const previousWeek = getPreviousWeek(aktuelleWoche.year, aktuelleWoche.week);
    aktuelleWoche = previousWeek;
    
    updateWeekDisplay();
    await ladeBestelldatenFürWoche(aktuelleWoche.year, aktuelleWoche.week);
}

/**
 * Navigiert zur nächsten Woche
 */
async function navigiereToNextWeek() {
    if (!aktuelleWoche) return;
    
    const nextWeek = getNextWeek(aktuelleWoche.year, aktuelleWoche.week);
    aktuelleWoche = nextWeek;
    
    updateWeekDisplay();
    await ladeBestelldatenFürWoche(aktuelleWoche.year, aktuelleWoche.week);
}

/**
 * Springt zur aktuellen Woche
 */
async function springeZurAktuellenWoche() {
    aktuelleWoche = getAktuelleKalenderwoche();
    
    updateWeekDisplay();
    await ladeBestelldatenFürWoche(aktuelleWoche.year, aktuelleWoche.week);
}

/**
 * Lädt Bestelldaten für eine spezifische Woche
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 */
async function ladeBestelldatenFürWoche(year, week) {
    try {
        toggleLoadingState(true);
        showLoadingIndicator(true);
        
        const bestelldaten = await getBestelldaten(year, week);
        aktuelleBestelldaten = bestelldaten;
        
        if (bestelldaten.einrichtungen.length === 0) {
            showNoDatenState();
            showToast(`Keine Bestelldaten für KW ${week}/${year} verfügbar`, 'info');
            return;
        }
        
        // Rendere beide Ansichten
        renderDesktopTabelle(bestelldaten);
        renderMobileAkkordeon(bestelldaten);
        
        toggleLoadingState(false);
        showLoadingIndicator(false);
        
        showToast(`Bestelldaten für KW ${week}/${year} geladen`, 'success');
        
    } catch (error) {
        console.error('Fehler beim Laden der Bestelldaten:', error);
        toggleLoadingState(false);
        showLoadingIndicator(false);
        showNoDatenState();
        showToast(error.message || 'Fehler beim Laden der Bestelldaten', 'error');
    }
}

/**
 * Zeigt/versteckt den Loading-Indikator
 * @param {boolean} show - Zeigen oder verstecken
 */
function showLoadingIndicator(show) {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.style.display = show ? 'block' : 'none';
    }
}

/**
 * Setup Event-Listener für Interaktionen
 */
function setupEventListeners() {
    // Wochennavigation
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const currentWeekBtn = document.getElementById('current-week');
    const refreshBtn = document.getElementById('refresh-btn');
    
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', navigiereToPreviousWeek);
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', navigiereToNextWeek);
    }
    
    if (currentWeekBtn) {
        currentWeekBtn.addEventListener('click', springeZurAktuellenWoche);
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            if (aktuelleWoche) {
                await ladeBestelldatenFürWoche(aktuelleWoche.year, aktuelleWoche.week);
            }
        });
    }
    
    // Info-Modal Event-Listener
    setupInfoModalListeners();
    
    // Keyboard Shortcuts
    setupKeyboardShortcuts();
}

/**
 * Setup Event-Listener für Info-Modal
 */
function setupInfoModalListeners() {
    // Modal wird geöffnet - Einrichtung laden
    const modal = document.getElementById('info-modal');
    if (modal) {
        modal.addEventListener('show.bs.modal', (e) => {
            const triggerButton = e.relatedTarget;
            const einrichtungId = triggerButton?.getAttribute('data-einrichtung-id');
            
            if (einrichtungId && aktuelleBestelldaten) {
                const einrichtung = aktuelleBestelldaten.einrichtungen.find(e => e.id === einrichtungId);
                if (einrichtung) {
                    renderInfoModal(einrichtung, aktuelleBestelldaten);
                }
            }
        });
    }
    
    // Als-Gelesen-Markieren Button (für Bestelldaten)
    const markReadBtn = document.getElementById('lesebestaetigung-btn');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', async () => {
            const einrichtungId = markReadBtn.getAttribute('data-einrichtung-id');
            if (einrichtungId && aktuelleWoche) {
                await markiereEinrichtungAlsGelesen(einrichtungId);
            }
        });
    }
    
    // Setup globale Handler
    window.markiereAlsGelesenHandler = async (einrichtungId, year, week) => {
        await markiereEinrichtungAlsGelesen(einrichtungId);
    };
    
    window.markiereInformationAlsGelesenHandler = async (informationId, year, week) => {
        try {
            await markiereInformationAlsGelesen(year, week, informationId);
            
            // Reload data to reflect changes
            await ladeBestelldatenFürWoche(year, week);
            
            showToast('Information als gelesen markiert', 'success');
            
        } catch (error) {
            console.error('Fehler beim Markieren der Information als gelesen:', error);
            showToast('Fehler beim Markieren als gelesen', 'error');
        }
    };
}

/**
 * Markiert eine Einrichtung als gelesen
 * @param {string} einrichtungId - ID der Einrichtung
 */
async function markiereEinrichtungAlsGelesen(einrichtungId) {
    try {
        await markiereAlsGelesen(aktuelleWoche.year, aktuelleWoche.week, einrichtungId);
        
        // Reload data to reflect changes
        await ladeBestelldatenFürWoche(aktuelleWoche.year, aktuelleWoche.week);
        
        showToast('Als gelesen markiert', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('info-modal'));
        if (modal) {
            modal.hide();
        }
        
    } catch (error) {
        console.error('Fehler beim Markieren als gelesen:', error);
        showToast('Fehler beim Markieren als gelesen', 'error');
    }
}

/**
 * Setup Keyboard Shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore wenn Input/Textarea focused
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                navigiereToPreviousWeek();
                break;
            case 'ArrowRight':
                e.preventDefault();
                navigiereToNextWeek();
                break;
            case 'Home':
                e.preventDefault();
                springeZurAktuellenWoche();
                break;
            case 'F5':
                e.preventDefault();
                if (aktuelleWoche) {
                    ladeBestelldatenFürWoche(aktuelleWoche.year, aktuelleWoche.week);
                }
                break;
        }
    });
}

/**
 * Exportiert aktuelle Daten als CSV
 */
function exportierenAlsCSV() {
    if (!aktuelleBestelldaten) {
        showToast('Keine Daten zum Exportieren verfügbar', 'warning');
        return;
    }
    
    try {
        const csvData = exportiereAlsCSV(aktuelleBestelldaten);
        
        // Create download link
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `zahlen-auswertung-kw${aktuelleWoche.week}-${aktuelleWoche.year}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('CSV-Export erfolgreich', 'success');
        
    } catch (error) {
        console.error('Fehler beim CSV-Export:', error);
        showToast('Fehler beim CSV-Export', 'error');
    }
}

/**
 * Debug-Informationen loggen
 */
function debug() {
    console.group('🔍 Zahlen-Auswertung Debug Info');
    console.log('Aktuelle Woche:', aktuelleWoche);
    console.log('Aktuelle Bestelldaten:', aktuelleBestelldaten);
    console.log('DOM-Elemente:', {
        weekDisplay: document.getElementById('week-display'),
        prevWeek: document.getElementById('prev-week'),
        nextWeek: document.getElementById('next-week'),
        currentWeek: document.getElementById('current-week'),
        desktopTable: document.getElementById('desktop-tabelle'),
        mobileAccordion: document.getElementById('mobile-accordion')
    });
    console.groupEnd();
}

// Auto-Refresh Feature
let autoRefreshInterval = null;

/**
 * Startet automatisches Aktualisieren alle 5 Minuten
 */
function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(async () => {
        if (aktuelleWoche) {
            console.log('🔄 Auto-Refresh: Lade aktuelle Woche neu...');
            await ladeBestelldatenFürWoche(aktuelleWoche.year, aktuelleWoche.week);
        }
    }, 5 * 60 * 1000); // 5 Minuten
    
    showToast('Auto-Refresh aktiviert (alle 5 Min)', 'info');
}

/**
 * Stoppt automatisches Aktualisieren
 */
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        showToast('Auto-Refresh deaktiviert', 'info');
    }
}

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});



// Global functions for debugging
window.ZahlenAuswertung = {
    debug,
    exportierenAlsCSV,
    startAutoRefresh,
    stopAutoRefresh,
    aktuelleWoche: () => aktuelleWoche,
    aktuelleBestelldaten: () => aktuelleBestelldaten
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeZahlenAuswertung); 