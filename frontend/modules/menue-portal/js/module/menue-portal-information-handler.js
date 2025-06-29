// menue-portal-information-handler.js - Information-System für das Menü-Portal
// Extrahiert aus menue-portal-ui.js für bessere Modularität

import { showToast } from '@shared/components/toast-notification/toast-notification.js';
import { getInformationen } from './informationen-api.js';
import { openInformationManagementModal } from './informationen-modal.js';

// Globale Informations-Daten
let currentInformationenData = {};

/**
 * Initialisiert das Information-System (nur Event-Listener setup)
 */
export function initInformationHandler() {
    setupInformationEventListeners();
    console.log('📋 Information-Handler initialisiert (ohne Daten-Laden)');
}

/**
 * Informations-Event-Listener (nur einmal registrieren)
 */
export function setupInformationEventListeners() {
    // Globale Funktion für Information-Click verfügbar machen
    window.handleInformationClick = handleInformationClick;
    
    // Event-Listener für Information-Updates
    window.addEventListener('informationCreated', (e) => {
        console.log('📋 Information erstellt - Event empfangen:', e.detail);
        
        // Aktuelle UI-Informationen neu laden
        const currentEinrichtung = window.currentEinrichtung;
        const currentYear = window.currentYear;
        const currentWeek = window.currentWeek;
        
        if (currentEinrichtung && currentYear && currentWeek) {
            loadInformationenData(currentEinrichtung, currentYear, currentWeek).then(() => {
                updateInformationButtons();
                console.log('✅ Informations-Buttons nach Erstellung aktualisiert');
            });
        }
        
        // Zusätzlich: Wenn die Information für eine andere Woche erstellt wurde, Hinweis anzeigen
        if (e.detail && e.detail.information) {
            const infoKW = e.detail.information.kalenderwoche;
            const infoJahr = e.detail.information.jahr;
            
            if (infoKW !== currentWeek || infoJahr !== currentYear) {
                showToast(
                    `Information wurde für KW ${infoKW}/${infoJahr} erstellt. Um sie zu sehen, navigieren Sie zu dieser Woche.`, 
                    'info'
                );
            }
        }
    });
    
    window.addEventListener('informationUpdated', (e) => {
        console.log('📋 Information aktualisiert - Event empfangen:', e.detail);
        
        // Aktuelle UI-Informationen neu laden
        const currentEinrichtung = window.currentEinrichtung;
        const currentYear = window.currentYear;
        const currentWeek = window.currentWeek;
        
        if (currentEinrichtung && currentYear && currentWeek) {
            loadInformationenData(currentEinrichtung, currentYear, currentWeek).then(() => {
                updateInformationButtons();
                console.log('✅ Informations-Buttons nach Update aktualisiert');
            });
        }
    });
    
    window.addEventListener('informationDeleted', (e) => {
        console.log('📋 Information gelöscht - Event empfangen:', e.detail);
        
        // Aktuelle UI-Informationen neu laden
        const currentEinrichtung = window.currentEinrichtung;
        const currentYear = window.currentYear;
        const currentWeek = window.currentWeek;
        
        if (currentEinrichtung && currentYear && currentWeek) {
            loadInformationenData(currentEinrichtung, currentYear, currentWeek).then(() => {
                updateInformationButtons();
                console.log('✅ Informations-Buttons nach Löschung aktualisiert');
            });
        }
    });
    
    console.log('📋 Informations-Event-Listener erfolgreich registriert');
}

/**
 * Aktualisiert nur die Informations-Button-Zustände ohne UI-Neurendierung
 */
export function updateInformationButtons() {
    console.log('🔄 Aktualisiere nur Informations-Button-Zustände...');
    
    try {
        const informationenData = window.currentInformationenData || currentInformationenData;
        
        // Alle Informations-Buttons finden
        const allInfoButtons = document.querySelectorAll('.information-btn, .information-btn-desktop');
        
        allInfoButtons.forEach(button => {
            // Tag und Kategorie des Buttons ermitteln
            const categoryElement = button.closest('.category-section, .grid-content-cell');
            if (!categoryElement) return;
            
            const dayKey = categoryElement.getAttribute('data-day') || getDayFromButton(categoryElement);
            const categoryKey = categoryElement.getAttribute('data-category') || getCategoryFromButton(categoryElement);
            
            if (!dayKey || !categoryKey) return;
            
            // Prüfen ob Informationen für diesen Tag vorhanden sind
            const tagInformationen = informationenData[dayKey] || [];
            const activeInformationen = tagInformationen.filter(info => !info.soft_deleted);
            
            // Button-Zustand entsprechend setzen
            if (activeInformationen.length > 0) {
                button.classList.add('has-info');
            } else {
                button.classList.remove('has-info');
            }
        });
        
        console.log('✅ Informations-Button-Zustände erfolgreich aktualisiert');
        
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Informations-Button-Zustände:', error);
    }
}

/**
 * Hilfsfunktion: Ermittelt Tag-Key aus Button-Element
 * @param {HTMLElement} element - DOM-Element
 * @returns {string|null} Tag-Key oder null
 */
export function getDayFromButton(element) {
    // Verschiedene Strategien versuchen
    let dayKey = element.getAttribute('data-day');
    if (dayKey) return dayKey;
    
    // In Accordion-Structure
    const accordionItem = element.closest('.accordion-item');
    if (accordionItem) {
        dayKey = accordionItem.getAttribute('data-day');
        if (dayKey) return dayKey;
    }
    
    // In Desktop-Grid
    const dayCard = element.closest('.day-card');
    if (dayCard) {
        dayKey = dayCard.getAttribute('data-day');
        if (dayKey) return dayKey;
    }
    
    // Fallback: aus DOM-Struktur ableiten
    const dayHeader = element.closest('[data-day]');
    if (dayHeader) {
        return dayHeader.getAttribute('data-day');
    }
    
    return null;
}

/**
 * Hilfsfunktion: Ermittelt Kategorie-Key aus Button-Element
 * @param {HTMLElement} element - DOM-Element
 * @returns {string|null} Kategorie-Key oder null
 */
export function getCategoryFromButton(element) {
    // Verschiedene Strategien versuchen
    let categoryKey = element.getAttribute('data-category');
    if (categoryKey) return categoryKey;
    
    // In Category-Section
    const categorySection = element.closest('.category-section');
    if (categorySection) {
        categoryKey = categorySection.getAttribute('data-category');
        if (categoryKey) return categoryKey;
    }
    
    // Fallback: aus DOM-Struktur ableiten
    const categoryElement = element.closest('[data-category]');
    if (categoryElement) {
        return categoryElement.getAttribute('data-category');
    }
    
    return null;
}

/**
 * Globale Funktion für Information-Click-Handler
 * @param {string} dayKey - Wochentag-Key
 * @param {string} isoDate - ISO-Datum-String
 */
export function handleInformationClick(dayKey, isoDate) {
    try {
        const datum = new Date(isoDate);
        console.log(`📋 Information-Click für ${dayKey}, ${datum.toLocaleDateString()}`);
        
        // Öffne das Management-Modal (Übersicht + Bearbeitung/Erstellung)
        openInformationManagementModal(dayKey, datum);
        
    } catch (error) {
        console.error('❌ Fehler beim Öffnen des Informations-Modals:', error);
        showToast('Fehler beim Öffnen des Informations-Modals', 'error');
    }
}

/**
 * Lädt Informationen für die angegebene Woche
 * @param {object} einrichtung - Einrichtungs-Objekt
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @returns {Promise<void>}
 */
export async function loadInformationenData(einrichtung, year, week) {
    if (!einrichtung || !year || !week) {
        console.warn('⚠️ Informationen können nicht geladen werden - fehlende Parameter:', {
            einrichtung: !!einrichtung,
            year,
            week
        });
        currentInformationenData = {};
        window.currentInformationenData = {};
        return;
    }
    
    try {
        console.log(`📋 Lade Informationen für KW ${week}/${year}, Einrichtung: ${einrichtung.name} (${einrichtung.id})...`);
        
        const result = await getInformationen(year, week, einrichtung.id);
        if (result.success) {
            currentInformationenData = result.informationen;
            window.currentInformationenData = currentInformationenData; // Global verfügbar
            console.log(`✅ Informationen geladen:`, Object.keys(currentInformationenData).length, 'Tage');
        } else {
            console.warn('⚠️ Keine Informationen für diese Woche gefunden');
            currentInformationenData = {};
            window.currentInformationenData = {};
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Informationen:', error);
        currentInformationenData = {};
        window.currentInformationenData = {};
    }
}

/**
 * Exportiert die aktuellen Informationsdaten
 * @returns {object} Aktuelle Informationsdaten
 */
export function getCurrentInformationenData() {
    return currentInformationenData;
} 