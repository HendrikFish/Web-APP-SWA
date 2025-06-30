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
    markiereInformationAlsGelesen,
    hatUngeleseneInformationen,
    getAnzahlUngeleseneInformationen
} from './module/bestelldaten-api.js';

import {
    renderDesktopTabelle,
    renderMobileAkkordeon,
    renderAlleAnsichten,
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
        
        // Rendere alle drei Ansichten (Desktop, Tablet, Smartphone)
        renderAlleAnsichten(bestelldaten);
        
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
    const modal = document.getElementById('info-modal');
    if (!modal) return;
    
    let triggerElement = null; // Referenz für Focus-Rückkehr
    
    // Modal wird geöffnet - Einrichtung laden
    modal.addEventListener('show.bs.modal', (e) => {
        triggerElement = e.relatedTarget; // Speichere auslösendes Element
        const einrichtungId = triggerElement?.getAttribute('data-einrichtung-id');
        
        if (einrichtungId && aktuelleBestelldaten) {
            const einrichtung = aktuelleBestelldaten.einrichtungen.find(e => e.id === einrichtungId);
            if (einrichtung) {
                renderInfoModal(einrichtung, aktuelleBestelldaten);
            }
        }
    });
    
    // Modal ist vollständig geöffnet - Focus management
    modal.addEventListener('shown.bs.modal', () => {
        // Entferne aria-hidden explizit (Bootstrap Bug workaround)
        modal.removeAttribute('aria-hidden');
        
        // Setze Focus auf ersten focusable Element im Modal
        const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    });
    
    // Modal beginnt sich zu schließen - Focus preparation
    modal.addEventListener('hide.bs.modal', () => {
        // Entferne Focus von allen Modal-Elementen
        const focusedElement = modal.querySelector(':focus');
        if (focusedElement) {
            focusedElement.blur();
        }
    });
    
    // Modal ist vollständig geschlossen - Focus zurücksetzen
    modal.addEventListener('hidden.bs.modal', () => {
        // Focus zurück zum auslösenden Element
        if (triggerElement && typeof triggerElement.focus === 'function') {
            triggerElement.focus();
        }
        triggerElement = null; // Referenz löschen
    });
    
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
            // Zeige Loading auf dem Button
            const button = document.querySelector(`[data-info-id="${informationId}"]`);
            const originalText = button?.innerHTML;
            if (button) {
                button.disabled = true;
                button.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Wird markiert...';
            }
            
            // Backend-API aufrufen
            await markiereInformationAlsGelesen(year, week, informationId);
            
            // UI sofort aktualisieren ohne kompletten Reload
            updateInformationKarteUI(informationId);
            
            // Lokale Daten aktualisieren
            updateLokaleDatenFürGelesenInformation(informationId);
            
            // Info-Buttons in Tabelle/Accordion aktualisieren
            updateInfoButtonStatus();
            
            showToast('Information als gelesen markiert', 'success');
            
            // Optional: Sanfter Hintergrund-Refresh nach 2 Sekunden
            setTimeout(() => {
                ladeBestelldatenFürWoche(year, week);
            }, 2000);
            
        } catch (error) {
            console.error('Fehler beim Markieren der Information als gelesen:', error);
            showToast('Fehler beim Markieren als gelesen', 'error');
            
            // Button zurücksetzen bei Fehler
            const button = document.querySelector(`[data-info-id="${informationId}"]`);
            if (button && originalText) {
                button.disabled = false;
                button.innerHTML = originalText;
            }
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

/**
 * Aktualisiert das UI einer spezifischen Information-Karte sofort
 * @param {string} informationId - ID der Information
 */
function updateInformationKarteUI(informationId) {
    // Finde die Information-Karte
    const infoKarte = document.querySelector(`[data-info-id="${informationId}"]`)?.closest('.information-karte');
    if (!infoKarte) return;
    
    // Ändere von "ungelesen" zu "gelesen"
    infoKarte.classList.remove('ungelesen');
    infoKarte.classList.add('gelesen');
    
    // Entferne "ungelesen" Badge
    const ungelesenesBadge = infoKarte.querySelector('.badge.bg-danger');
    if (ungelesenesBadge && ungelesenesBadge.textContent.includes('ungelesen')) {
        ungelesenesBadge.remove();
    }
    
    // Verstecke/Entferne Button
    const button = infoKarte.querySelector('.mark-info-read-btn');
    if (button) {
        const actionsContainer = button.parentElement;
        if (actionsContainer && actionsContainer.classList.contains('information-actions')) {
            // Entferne kompletten Actions-Container
            actionsContainer.remove();
        } else {
            // Nur Button verstecken
            button.style.display = 'none';
        }
    }
    
    // Sanfte Übergangsanimation
    infoKarte.style.transition = 'all 0.3s ease';
    infoKarte.style.transform = 'scale(0.98)';
    setTimeout(() => {
        infoKarte.style.transform = 'scale(1)';
    }, 150);
}

/**
 * Aktualisiert lokale Daten für eine als gelesen markierte Information
 * @param {string} informationId - ID der Information
 */
function updateLokaleDatenFürGelesenInformation(informationId) {
    if (!aktuelleBestelldaten) return;
    
    // Durchsuche alle Einrichtungen und ihre Informationen
    aktuelleBestelldaten.einrichtungen.forEach(einrichtung => {
        if (einrichtung.informationen) {
            Object.values(einrichtung.informationen).forEach(tagInfos => {
                if (Array.isArray(tagInfos)) {
                    const info = tagInfos.find(i => i.id === informationId);
                    if (info) {
                        info.read = true;
                        info.gelesen_am = new Date().toISOString();
                        
                        // Update Einrichtungs-Status
                        einrichtung.hatUngeleseneInfos = hatUngeleseneInformationen(aktuelleBestelldaten.informationen, einrichtung.id);
                        einrichtung.anzahlUngeleseneInfos = getAnzahlUngeleseneInformationen(aktuelleBestelldaten.informationen, einrichtung.id);
                    }
                }
            });
        }
    });
    
    // Update globale Informationen-Daten
    if (aktuelleBestelldaten.informationen) {
        Object.values(aktuelleBestelldaten.informationen).forEach(tagDaten => {
            if (tagDaten) {
                Object.values(tagDaten).forEach(einrichtungInfos => {
                    if (Array.isArray(einrichtungInfos)) {
                        const info = einrichtungInfos.find(i => i.id === informationId);
                        if (info) {
                            info.read = true;
                            info.gelesen_am = new Date().toISOString();
                        }
                    }
                });
            }
        });
    }
}

/**
 * Aktualisiert den Status der Info-Buttons in Tabelle und Accordion
 */
function updateInfoButtonStatus() {
    if (!aktuelleBestelldaten) return;
    
    aktuelleBestelldaten.einrichtungen.forEach(einrichtung => {
        const infoButtons = document.querySelectorAll(`[data-einrichtung-id="${einrichtung.id}"].info-btn`);
        
        infoButtons.forEach(button => {
            const badge = button.querySelector('.badge');
            const hasUnread = einrichtung.hatUngeleseneInfos;
            const anzahlUngelesen = einrichtung.anzahlUngeleseneInfos;
            
            // Update Button-Klassen
            if (hasUnread) {
                button.classList.add('ungelesen');
                button.title = `${anzahlUngelesen} ungelesene Information(en)`;
            } else {
                button.classList.remove('ungelesen');
                button.title = 'Informationen anzeigen';
            }
            
            // Update Badge
            if (badge) {
                if (hasUnread) {
                    badge.textContent = anzahlUngelesen;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    });
} 