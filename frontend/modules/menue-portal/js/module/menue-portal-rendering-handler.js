// menue-portal-rendering-handler.js - Rendering und Display-Logik für das Menü-Portal
// Extrahiert aus menue-portal-ui.js für bessere Modularität

import { getCategoryIcon } from './menue-portal-api.js';
import { getCurrentMenuplan, getRezepteCache } from './menue-portal-navigation-handler.js';
import { showError } from './menue-portal-ui-utils.js';
import { renderMobileAccordion } from './mobile-accordion-handler.js';
import { renderDesktopCalendar } from './desktop-calendar-handler.js';

/**
 * Rendert den Menüplan basierend auf Bildschirmgröße
 * @param {boolean} isMobile - Mobile-Ansicht aktiv
 * @param {object} portalStammdaten - Portal-Stammdaten
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {number} currentYear - Aktuelles Jahr
 * @param {number} currentWeek - Aktuelle Woche
 */
export function renderMenuplan(isMobile, portalStammdaten, currentEinrichtung, currentYear, currentWeek) {
    const currentMenuplan = getCurrentMenuplan();
    const rezepteCache = getRezepteCache();
    
    if (!currentMenuplan || !portalStammdaten) {
        showError('Keine Daten zum Anzeigen verfügbar');
        return;
    }
    
    if (isMobile) {
        renderMobileAccordion(
            currentMenuplan, 
            portalStammdaten, 
            currentEinrichtung, 
            currentYear, 
            currentWeek, 
            rezepteCache,
            (categoryKey, dayKey, isMobile) => istKategorieRelevantFuerEinrichtung(categoryKey, dayKey, currentEinrichtung, isMobile),
            () => extractVisibleCategories(portalStammdaten, currentEinrichtung)
        );
    } else {
        renderDesktopCalendar(
            currentMenuplan, 
            portalStammdaten, 
            currentEinrichtung, 
            currentYear, 
            currentWeek, 
            rezepteCache,
            (categoryKey, dayKey, isMobile) => istKategorieRelevantFuerEinrichtung(categoryKey, dayKey, currentEinrichtung, isMobile),
            () => extractVisibleCategories(portalStammdaten, currentEinrichtung)
        );
    }
}

/**
 * Prüft ob eine Einrichtung eine Kategorie an einem Tag zugewiesen bekommen hat
 * @param {string} categoryKey - Kategorie-Schlüssel (z.B. 'menu1', 'dessert')
 * @param {string} dayKey - Tag-Schlüssel (z.B. 'montag', 'dienstag')
 * @param {string} einrichtungId - ID der Einrichtung
 * @returns {boolean} True wenn Einrichtung diese Kategorie zugewiesen bekommen hat
 */
export function istKategorieZugewiesen(categoryKey, dayKey, einrichtungId) {
    const currentMenuplan = getCurrentMenuplan();
    if (!currentMenuplan || !currentMenuplan.days || !currentMenuplan.days[dayKey]) {
        return false;
    }
    
    const dayData = currentMenuplan.days[dayKey];
    const zuweisungen = dayData.Zuweisungen || {};
    
    // Für zusammengefasste "hauptspeise": prüfe menu1 ODER menu2 ODER menu
    if (categoryKey === 'hauptspeise') {
        // Spezialfall: Kindergarten/Schule mit 'menu' Struktur
        // Diese sind immer zugewiesen wenn Rezepte vorhanden sind
        if (dayData['menu'] && dayData['menu'].length > 0) {
            return true; // Kindergarten/Schule mit neuer Struktur
        }
        
        const menu1Zuweisungen = zuweisungen['menu1'] || [];
        const menu2Zuweisungen = zuweisungen['menu2'] || [];
        const menuZuweisungen = zuweisungen['menu'] || [];
        
        // Prüfe alle möglichen Strukturen
        return menu1Zuweisungen.includes(einrichtungId) || 
               menu2Zuweisungen.includes(einrichtungId) ||
               menuZuweisungen.includes(einrichtungId);
    }
    
    // Für normale Kategorien
    const kategorieZuweisungen = zuweisungen[categoryKey] || [];
    return kategorieZuweisungen.includes(einrichtungId);
}

/**
 * Prüft ob eine Kategorie für die aktuelle Einrichtung relevant/sichtbar ist
 * @param {string} categoryKey - Kategorie-Schlüssel
 * @param {string} dayKey - Tag-Schlüssel
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {boolean} isMobile - Mobile-Ansicht
 * @returns {boolean} True wenn Kategorie angezeigt werden soll
 */
export function istKategorieRelevantFuerEinrichtung(categoryKey, dayKey, currentEinrichtung, isMobile = false) {
    const currentMenuplan = getCurrentMenuplan();
    if (!currentEinrichtung || !currentMenuplan) return false;
    
    // Für interne Einrichtungen: Alle Kategorien anzeigen
    if (currentEinrichtung.isIntern) {
        return true;
    }
    
    // Speiseplan der Einrichtung für diesen Tag prüfen
    const speiseplanTag = currentEinrichtung.speiseplan?.[dayKey];
    if (!speiseplanTag) return false;
    
    // Spezielle Behandlung für Kindergarten und Schule
    const istKindergartenOderSchule = ['Kindergartenkinder', 'Schüler'].includes(currentEinrichtung.personengruppe);
    
    if (istKindergartenOderSchule) {
        // Für Kindergarten/Schule: menu1 und menu2 nicht einzeln anzeigen
        if (['menu1', 'menu2'].includes(categoryKey)) {
            return false;
        }
        
        // Stattdessen "hauptspeise" als zusammengefasste Kategorie anzeigen
        if (categoryKey === 'hauptspeise') {
            return speiseplanTag.hauptspeise || false;
        }
        
        // Für andere Kategorien: Standard-Kategorien IMMER anzeigen
        const standardKategorien = ['suppe', 'dessert', 'hauptspeise'];
        
        if (standardKategorien.includes(categoryKey)) {
            // Sowohl Desktop als auch Mobile: alle Standard-Kategorien anzeigen
            // Mobile filtert leere Kategorien später im Handler aus
            return true;
        }
        
        // Für spezielle Kategorien: nur anzeigen wenn im Speiseplan verfügbar
        const kategorieMapping = {
            'suppe': 'suppe',
            'dessert': 'dessert'
        };
        
        const speiseplanKategorie = kategorieMapping[categoryKey];
        return speiseplanKategorie ? (speiseplanTag[speiseplanKategorie] || false) : false;
    }
    
    // Für andere externe Einrichtungen: Standard-Kategorien IMMER anzeigen
    const standardKategorien = ['suppe', 'menu1', 'menu2', 'dessert'];
    
    if (standardKategorien.includes(categoryKey)) {
        // Sowohl Desktop als auch Mobile: alle Standard-Kategorien anzeigen
        // Mobile filtert leere Kategorien später im Handler aus
        return true;
    }
    
    // Für spezielle Kategorien: nur anzeigen wenn im Speiseplan verfügbar
    const kategorieMapping = {
        'suppe': 'suppe',
        'menu1': 'hauptspeise',
        'menu2': 'hauptspeise', 
        'dessert': 'dessert'
    };
    
    const speiseplanKategorie = kategorieMapping[categoryKey];
    const istImSpeiseplan = speiseplanTag[speiseplanKategorie] || false;
    
    return istImSpeiseplan;
}

/**
 * Extrahiert sichtbare Kategorien basierend auf Portal-Stammdaten in korrekter Reihenfolge
 * @param {object} portalStammdaten - Portal-Stammdaten
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @returns {object} Sichtbare Kategorien in der richtigen Reihenfolge
 */
export function extractVisibleCategories(portalStammdaten, currentEinrichtung) {
    if (!portalStammdaten || !portalStammdaten.kategorien) {
        // Fallback wenn keine Portal-Stammdaten verfügbar - in korrekter Reihenfolge
        const categories = {};
        const reihenfolge = ['suppe', 'menu1', 'menu2', 'dessert'];
        const fallbackData = {
            'suppe': { name: 'Suppe', icon: '🍲' },
            'menu1': { name: 'Menü 1', icon: '🍽️' },
            'menu2': { name: 'Menü 2', icon: '🥘' },
            'dessert': { name: 'Dessert', icon: '🍰' }
        };
        
        reihenfolge.forEach(key => {
            if (fallbackData[key]) {
                categories[key] = fallbackData[key];
            }
        });
        
        return categories;
    }
    
    const categories = {};
    
    // Spezielle Behandlung für Kindergarten und Schule
    const istKindergartenOderSchule = currentEinrichtung && 
        ['Kindergartenkinder', 'Schüler'].includes(currentEinrichtung.personengruppe);
    
    if (istKindergartenOderSchule) {
        // Reihenfolge für Kindergarten/Schule: suppe, hauptspeise, dessert
        const reihenfolge = ['suppe', 'hauptspeise', 'dessert'];
        
        reihenfolge.forEach(key => {
            if (key === 'hauptspeise') {
                // Zusammengefasste "hauptspeise" Kategorie hinzufügen
                categories['hauptspeise'] = {
                    name: 'Hauptspeise',
                    icon: '🍽️',
                    isZusammengefasst: true,
                    quellKategorien: ['menu1', 'menu2']
                };
            } else if (portalStammdaten.kategorien[key]) {
                // Normale Kategorien aus Stammdaten
                const info = portalStammdaten.kategorien[key];
                categories[key] = {
                    name: info.name || key,
                    icon: info.icon || getCategoryIcon(key),
                    ...info
                };
            }
        });
    } else {
        // Reihenfolge für andere: suppe, menu1, menu2, dessert
        const reihenfolge = ['suppe', 'menu1', 'menu2', 'dessert'];
        
        reihenfolge.forEach(key => {
            if (portalStammdaten.kategorien[key]) {
                const info = portalStammdaten.kategorien[key];
                categories[key] = {
                    name: info.name || key,
                    icon: info.icon || getCategoryIcon(key),
                    ...info
                };
            }
        });
    }
    
    return categories;
} 