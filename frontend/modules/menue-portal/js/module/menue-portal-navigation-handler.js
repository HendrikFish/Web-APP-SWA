// menue-portal-navigation-handler.js - Navigation und Data-Loading für das Menü-Portal
// Extrahiert aus menue-portal-ui.js für bessere Modularität

import { showToast } from '@shared/components/toast-notification/toast-notification.js';
import { 
    loadMenuplan,
    loadRezepte,
    extractRecipeIds,
    getMondayOfWeek,
    formatDate
} from './menue-portal-api.js';
import { getAllEinrichtungen } from './menue-portal-auth.js';
import { loadInformationenData } from './menue-portal-information-handler.js';
import { 
    showLoading,
    hideLoading,
    showError,
    updateWeekDisplay,
    getISOWeek,
    getWeeksInYear
} from './menue-portal-ui-utils.js';
import { 
    handleBestellungChange, 
    loadBestellungenFromAPI, 
    loadBestellungenIntoUI
} from './bestellung-handler.js';

// Navigation State
let loadMenuplanTimeout = null; // Debouncing für loadAndDisplayMenuplan
let currentMenuplan = null;
let rezepteCache = {};

/**
 * Initialisiert den Navigation-Handler
 * @param {object} config - Konfiguration mit Callbacks und State
 */
export function initNavigationHandler(config) {
    // Konfiguration speichern
    window.navigationHandlerConfig = config;
    
    console.log('🧭 Navigation-Handler initialisiert');
}

/**
 * Wechselt zu einer anderen Einrichtung
 * @param {string} einrichtungId - ID der neuen Einrichtung
 * @param {object} callbacks - UI-Update-Callbacks
 */
export async function switchEinrichtung(einrichtungId, callbacks = {}) {
    try {
        showLoading();
        
        // Neue Einrichtung aus allen verfügbaren holen
        const alleEinrichtungen = await getAllEinrichtungen();
        const neueEinrichtung = alleEinrichtungen.find(e => e.id === einrichtungId);
        
        if (!neueEinrichtung) {
            throw new Error('Einrichtung nicht gefunden');
        }
        
        // Globale State-Updates
        window.currentEinrichtung = neueEinrichtung;
        
        // UI-Callbacks ausführen
        if (callbacks.updateActiveEinrichtungButton) callbacks.updateActiveEinrichtungButton();
        if (callbacks.updateEinrichtungsInfo) callbacks.updateEinrichtungsInfo();
        if (callbacks.setupBestellControls) callbacks.setupBestellControls();
        
        // Bestellungen für neue Einrichtung laden
        await loadBestellungenFromAPI();
        
        // Menüplan neu laden (lädt automatisch auch Informationen)
        await loadAndDisplayMenuplan(callbacks);
        
        showToast(`Zu ${neueEinrichtung.name} gewechselt`, 'success');
        
    } catch (error) {
        console.error('Fehler beim Wechseln der Einrichtung:', error);
        showToast('Fehler beim Wechseln der Einrichtung', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Navigiert zu einer anderen Woche
 * @param {number} direction - Richtung (-1 = vorherige, +1 = nächste)
 * @param {object} callbacks - UI-Update-Callbacks
 */
export async function navigateWeek(direction, callbacks = {}) {
    try {
        showLoading();
        
        // Aktuelle Woche und Jahr aus globalen Variablen
        let currentWeek = window.currentWeek;
        let currentYear = window.currentYear;
        const currentEinrichtung = window.currentEinrichtung;
        
        // Aktuelle Woche ändern
        const newWeek = currentWeek + direction;
        let newYear = currentYear;
        
        // Jahr-Grenze prüfen (ISO 8601-konform)
        if (newWeek < 1) {
            newYear--;
            currentWeek = getWeeksInYear(newYear);
            currentYear = newYear;
        } else if (newWeek > getWeeksInYear(currentYear)) {
            newYear++;
            currentWeek = 1;
            currentYear = newYear;
        } else {
            currentWeek = newWeek;
        }
        
        // Sicherheitsprüfung: Falls die Werte noch immer ungültig sind
        if (currentWeek < 1 || currentWeek > 53) {
            console.warn('⚠️ Ungültige Kalenderwoche korrigiert:', currentWeek);
            currentWeek = Math.max(1, Math.min(53, currentWeek));
        }
        
        // Globale Variablen aktualisieren
        window.currentWeek = currentWeek;
        window.currentYear = currentYear;
        
        console.log(`📅 Navigation: KW ${currentWeek}/${currentYear}`);
        
        updateWeekDisplay(currentWeek, currentYear, getMondayOfWeek, formatDate);
        
        // UI-Callbacks ausführen
        if (callbacks.updateBestellControlsContent) callbacks.updateBestellControlsContent();
        
        // Bestellungen für neue Woche laden
        if (currentEinrichtung) {
            await loadBestellungenFromAPI();
        }
        
        await loadAndDisplayMenuplan(callbacks);
        
    } catch (error) {
        console.error('Fehler bei Wochennavigation:', error);
        showToast('Fehler beim Laden der Woche', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Springt zur aktuellen Woche (ISO 8601-konform)
 * @param {object} callbacks - UI-Update-Callbacks
 */
export async function navigateToCurrentWeek(callbacks = {}) {
    try {
        showLoading();
        
        const now = new Date();
        const isoWeek = getISOWeek(now);
        const currentEinrichtung = window.currentEinrichtung;
        
        // ISO-Jahr und -Woche verwenden (kann vom Kalenderjahr abweichen)
        window.currentYear = isoWeek.year;
        window.currentWeek = isoWeek.week;
        
        console.log(`📅 Heutige Woche: KW ${window.currentWeek}/${window.currentYear}`);
        
        updateWeekDisplay(window.currentWeek, window.currentYear, getMondayOfWeek, formatDate);
        
        // UI-Callbacks ausführen
        if (callbacks.updateBestellControlsContent) callbacks.updateBestellControlsContent();
        
        // Bestellungen für neue Woche laden
        if (currentEinrichtung) {
            await loadBestellungenFromAPI();
        }
        
        await loadAndDisplayMenuplan(callbacks);
        
    } catch (error) {
        console.error('Fehler beim Navigieren zur aktuellen Woche:', error);
        showToast('Fehler beim Laden der aktuellen Woche', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Lädt und zeigt den Menüplan an (mit Debouncing)
 * @param {object} callbacks - UI-Update-Callbacks
 */
export async function loadAndDisplayMenuplan(callbacks = {}) {
    // Debouncing um mehrfache schnelle Aufrufe zu verhindern
    if (loadMenuplanTimeout) {
        clearTimeout(loadMenuplanTimeout);
    }
    
    loadMenuplanTimeout = setTimeout(async () => {
        try {
            const currentWeek = window.currentWeek;
            const currentYear = window.currentYear;
            const currentEinrichtung = window.currentEinrichtung;
            
            console.log(`📋 Lade Menüplan für KW ${currentWeek}/${currentYear}...`);
            
            if (!currentEinrichtung) {
                throw new Error('Keine Einrichtung ausgewählt');
            }
            
            // Menüplan laden
            const result = await loadMenuplan(currentEinrichtung.id, currentYear, currentWeek);
            if (!result.success) {
                throw new Error(result.error || 'Fehler beim Laden des Menüplans');
            }
            
            currentMenuplan = result.menuplan;
            window.currentMenuplan = currentMenuplan; // Global verfügbar
            
            // Rezepte laden
            await loadMenuplanRecipes();
            
            // Informationen laden
            await loadInformationenData(currentEinrichtung, currentYear, currentWeek);
            
            // UI rendern
            if (callbacks.renderMenuplan) callbacks.renderMenuplan();
            
            // Bestellungen laden (falls externe Einrichtung) - mit Delay für vollständiges Rendering
            if (!currentEinrichtung.isIntern) {
                const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
                setTimeout(() => {
                    loadBestellungenIntoUI(wochenschluessel);
                }, 200); // 200ms Delay für vollständiges DOM-Rendering
            }
            
            console.log('✅ Menüplan geladen und dargestellt');
            
        } catch (error) {
            console.error('❌ Fehler beim Laden des Menüplans:', error);
            showError(error.message);
        }
    }, 100); // 100ms Debounce
}

/**
 * Lädt alle Rezepte für den aktuellen Menüplan
 */
export async function loadMenuplanRecipes() {
    if (!currentMenuplan || !currentMenuplan.days) return;
    
    try {
        // Alle Rezept-IDs sammeln
        const recipeIds = extractRecipeIds(currentMenuplan);
        
        if (recipeIds.length === 0) {
            console.log('ℹ️ Keine Rezepte im Menüplan gefunden');
            return;
        }
        
        // Rezepte laden
        const result = await loadRezepte(recipeIds);
        if (result.success) {
            rezepteCache = result.rezepte;
            window.rezepteCache = rezepteCache; // Global verfügbar
            console.log(`✅ ${Object.keys(rezepteCache).length} Rezepte geladen`);
        } else {
            console.warn('⚠️ Fehler beim Laden der Rezepte:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Rezepte:', error);
    }
}

/**
 * Exportiert den aktuellen Menüplan
 * @returns {object} Aktueller Menüplan
 */
export function getCurrentMenuplan() {
    return currentMenuplan;
}

/**
 * Exportiert den Rezepte-Cache
 * @returns {object} Rezepte-Cache
 */
export function getRezepteCache() {
    return rezepteCache;
}

/**
 * Setzt den Menüplan (für Tests/Entwicklung)
 * @param {object} menuplan - Neuer Menüplan
 */
export function setCurrentMenuplan(menuplan) {
    currentMenuplan = menuplan;
    window.currentMenuplan = menuplan;
} 