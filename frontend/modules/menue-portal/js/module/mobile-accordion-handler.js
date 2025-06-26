// mobile-accordion-handler.js - Mobile Accordion-Funktionalität
// Verwaltet die mobile Ansicht mit Accordion-Layout

import { 
    getMondayOfWeek, 
    formatDate,
    getCategoryName,
    getCategoryIcon
} from './menue-portal-api.js';
import { istDatumBewertbar } from './bewertung-api.js';

/**
 * Rendert die mobile Accordion-Ansicht
 * @param {object} currentMenuplan - Aktueller Menüplan
 * @param {object} portalStammdaten - Portal-Stammdaten
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {number} currentYear - Aktuelles Jahr
 * @param {number} currentWeek - Aktuelle Woche
 * @param {object} rezepteCache - Rezepte-Cache
 * @param {function} istKategorieRelevantFuerEinrichtung - Relevanz-Prüfung
 * @param {function} extractVisibleCategories - Kategorien extrahieren
 * @returns {void}
 */
export function renderMobileAccordion(
    currentMenuplan, 
    portalStammdaten, 
    currentEinrichtung, 
    currentYear, 
    currentWeek, 
    rezepteCache,
    istKategorieRelevantFuerEinrichtung,
    extractVisibleCategories
) {
    if (!currentMenuplan || !portalStammdaten) return;
    
    const container = document.getElementById('mobile-accordion');
    if (!container) return;
    
    const kategorien = extractVisibleCategories();
    const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    
    let accordionHtml = '<div class="accordion" id="mobile-menu-accordion">';
    
    days.forEach((dayKey, index) => {
        const dayData = currentMenuplan.days[dayKey];
        if (!dayData) return;
        
        // Prüfe ob die Einrichtung an diesem Tag Essen bekommt
        const hatEssenAmTag = currentEinrichtung && currentEinrichtung.speiseplan && 
                             currentEinrichtung.speiseplan[dayKey] &&
                             (currentEinrichtung.speiseplan[dayKey].suppe || 
                              currentEinrichtung.speiseplan[dayKey].hauptspeise || 
                              currentEinrichtung.speiseplan[dayKey].dessert);
        
        // Mobile: Tage ohne Essen gar nicht anzeigen
        if (!hatEssenAmTag) {
            return;
        }
        
        const monday = getMondayOfWeek(currentYear, currentWeek);
        const dayDate = new Date(monday.getTime() + index * 24 * 60 * 60 * 1000);
        const dateStr = formatDate(dayDate);
        
        // Alle Tage standardmäßig geschlossen
        accordionHtml += `
            <div class="accordion-item menu-day-accordion">
                <h2 class="accordion-header" id="heading-${dayKey}">
                    <button 
                        class="accordion-button collapsed" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#collapse-${dayKey}"
                        aria-expanded="false" 
                        aria-controls="collapse-${dayKey}"
                    >
                        <div class="w-100 d-flex justify-content-between align-items-center">
                            <div class="day-info">
                                <span class="day-name fw-bold">${dayNames[index]}</span>
                                <small class="day-date text-muted d-block">${dateStr}</small>
                            </div>
                            <div class="day-meta">
                                <span class="recipe-count badge bg-primary">
                                    ${Object.keys(kategorien).reduce((count, categoryKey) => {
                                        // Für zusammengefasste "hauptspeise": menu1 + menu2 kombinieren
                                        let recipes = [];
                                        if (categoryKey === 'hauptspeise' && kategorien[categoryKey].isZusammengefasst) {
                                            const menu1Recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten['menu1'] || []) : (dayData['menu1'] || []);
                                            const menu2Recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten['menu2'] || []) : (dayData['menu2'] || []);
                                            recipes = [...menu1Recipes, ...menu2Recipes];
                                        } else {
                                            recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten[categoryKey] || []) : (dayData[categoryKey] || []);
                                        }
                                        
                                        const istRelevant = istKategorieRelevantFuerEinrichtung(categoryKey, dayKey, false); // Mobile = false, da wir alle Standard-Kategorien wollen
                                        const istZugewiesen = window.istKategorieZugewiesen ? window.istKategorieZugewiesen(categoryKey, dayKey, currentEinrichtung.id) : true;
                                        // Mobile: nur zugewiesene Kategorien zählen
                                        return count + (istRelevant && istZugewiesen ? recipes.length : 0);
                                    }, 0)} Gerichte
                                </span>
                            </div>
                        </div>
                    </button>
                </h2>
                <div 
                    id="collapse-${dayKey}" 
                    class="accordion-collapse collapse"
                    aria-labelledby="heading-${dayKey}"
                    data-bs-parent="#mobile-menu-accordion"
                >
                    <div class="accordion-body">
                        ${renderMobileDayContent(dayData.Mahlzeiten || dayData, kategorien, dayKey, currentEinrichtung, currentYear, currentWeek, rezepteCache, istKategorieRelevantFuerEinrichtung, index)}
                    </div>
                </div>
            </div>
        `;
    });
    
    accordionHtml += '</div>';
    container.innerHTML = accordionHtml;
}

/**
 * Rendert den Inhalt eines Tages für die mobile Ansicht
 * @param {object} dayData - Daten für den Tag
 * @param {object} categories - Kategorien
 * @param {string} dayKey - Tag-Schlüssel
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {number} currentYear - Aktuelles Jahr
 * @param {number} currentWeek - Aktuelle Woche
 * @param {object} rezepteCache - Rezepte-Cache
 * @param {function} istKategorieRelevantFuerEinrichtung - Relevanz-Prüfung
 * @param {number} dayIndex - Tag-Index
 * @returns {string} HTML für Tag-Inhalt
 */
function renderMobileDayContent(dayData, categories, dayKey, currentEinrichtung, currentYear, currentWeek, rezepteCache, istKategorieRelevantFuerEinrichtung, dayIndex) {
    if (!dayData || !categories) return '';
    
    const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const monday = getMondayOfWeek(currentYear, currentWeek);
    const dayDate = new Date(monday.getTime() + dayIndex * 24 * 60 * 60 * 1000);
    
    // Prüfe ob die aktuelle Einrichtung an diesem Tag Essen bekommt
    const hatEssenAmTag = currentEinrichtung && currentEinrichtung.speiseplan && 
                         currentEinrichtung.speiseplan[dayKey] &&
                         (currentEinrichtung.speiseplan[dayKey].suppe || 
                          currentEinrichtung.speiseplan[dayKey].hauptspeise || 
                          currentEinrichtung.speiseplan[dayKey].dessert);
    
    // Für mobile: Tage ohne Essen gar nicht anzeigen
    if (!hatEssenAmTag) return '';
    
    let html = '';
    
    // Kategorien durchgehen
    Object.entries(categories).forEach(([categoryKey, categoryInfo]) => {
        // Rezepte aus dayData holen - unterstütze beide Strukturen (mit/ohne Mahlzeiten)
        let recipes = [];
        
        if (categoryKey === 'hauptspeise' && categoryInfo.isZusammengefasst) {
            // Für zusammengefasste "hauptspeise": Daten aus menu1 und menu2 kombinieren
            const menu1Recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten['menu1'] || []) : (dayData['menu1'] || []);
            const menu2Recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten['menu2'] || []) : (dayData['menu2'] || []);
            recipes = [...menu1Recipes, ...menu2Recipes];
        } else {
            // Normale Kategorien
            recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten[categoryKey] || []) : (dayData[categoryKey] || []);
        }
        
        // Prüfe ob diese Kategorie für die Einrichtung relevant ist (Mobile = false, da wir alle Standard-Kategorien wollen)
        const istKategorieRelevant = istKategorieRelevantFuerEinrichtung(categoryKey, dayKey, false);
        
        if (!istKategorieRelevant) return;
        
        // Prüfe ob Einrichtung diese Kategorie zugewiesen bekommen hat
        const istZugewiesen = window.istKategorieZugewiesen ? window.istKategorieZugewiesen(categoryKey, dayKey, currentEinrichtung.id) : true;
        
        // Mobile: Nicht zugewiesene Kategorien ausblenden
        if (!istZugewiesen) return;
        
        html += `
            <div class="category-section mb-4">
                <div class="category-header d-flex justify-content-between align-items-center mb-3">
                    <h6 class="category-title mb-0">
                            <span class="category-icon me-2">${categoryInfo.icon}</span>
                            ${categoryInfo.name}
                        </h6>
                    ${recipes.length > 0 ? renderBewertungButton(dayKey, categoryKey, recipes, dayDate, currentEinrichtung, rezepteCache) : ''}
                </div>
                
                <div class="recipe-content">
                    ${recipes.length > 0 ? renderRecipeList(recipes, rezepteCache) : '<div class="no-recipes-info"><i class="bi bi-info-circle me-2"></i>Noch nicht gewählt</div>'}
                </div>
                
                ${renderBestellungFields(dayKey, categoryKey, recipes, currentEinrichtung)}
            </div>
        `;
    });
    
    if (html.trim() === '') {
        return '<div class="text-muted text-center p-3">Keine relevanten Kategorien für heute</div>';
    }
    
    return html;
}

/**
 * Rendert eine Liste von Rezepten
 * @param {object[]} recipes - Array von Rezepten
 * @param {object} rezepteCache - Rezepte-Cache
 * @returns {string} HTML für Rezepte
 */
function renderRecipeList(recipes, rezepteCache) {
    if (!recipes || recipes.length === 0) {
        return ''; // Keine Anzeige bei leeren Kategorien
    }
    
    return recipes.map(recipe => {
        const recipeData = rezepteCache[recipe.id] || recipe;
        const name = recipeData.name || 'Unbekanntes Rezept';
        const allergene = recipeData.allergene || [];
        
        return `
            <div class="recipe-item">
                <div class="recipe-content">
                    <div class="recipe-name">${name}</div>
                    ${allergene.length > 0 ? `
                        <div class="allergen-icons">
                            ${allergene.slice(0, 5).map(allergen => `
                                <span class="allergen-icon" title="${allergen}">${allergen.charAt(0).toUpperCase()}</span>
                            `).join('')}
                            ${allergene.length > 5 ? '<span class="allergen-icon">+</span>' : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Rendert einen Bewertungs-Button für eine Kategorie
 * @param {string} dayKey - Wochentag-Key
 * @param {string} categoryKey - Kategorie-Key
 * @param {object[]} recipes - Rezepte der Kategorie
 * @param {Date} dayDate - Datum des Tages
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {object} rezepteCache - Rezepte-Cache
 * @returns {string} HTML für Bewertungs-Button
 */
function renderBewertungButton(dayKey, categoryKey, recipes, dayDate, currentEinrichtung, rezepteCache) {
    // Import wird von der Haupt-UI-Datei gehandhabt
    const currentUser = window.currentUser; // Globale Variable
    
    if (!currentUser || !recipes || recipes.length === 0) {
        return '';
    }
    
    // Prüfen ob Datum bewertbar ist
    const isDateRatable = istDatumBewertbar(dayDate);
    const rezeptNamen = recipes.map(r => (rezepteCache[r.id] || r).name || 'Unbekanntes Rezept');
    
    const buttonId = `bewertung-btn-${dayKey}-${categoryKey}`;
    
    return `
        <button 
            type="button" 
            class="bewertung-btn" 
            id="${buttonId}"
            data-day="${dayKey}"
            data-kategorie="${categoryKey}"
            data-datum="${dayDate.toISOString().split('T')[0]}"
            data-rezepte='${JSON.stringify(rezeptNamen)}'
            title="Kategorie bewerten"
            ${!isDateRatable ? 'disabled' : ''}
            onclick="handleBewertungClick('${dayKey}', '${categoryKey}', ${JSON.stringify(rezeptNamen).replace(/"/g, '&quot;')}, '${dayDate.toISOString()}')"
        >
            <i class="bi bi-star-fill"></i>
        </button>
    `;
}

/**
 * Rendert Bestellfelder für externe Einrichtungen
 * @param {string} dayKey - Wochentag-Schlüssel
 * @param {string} categoryKey - Kategorie-Schlüssel  
 * @param {object[]} recipes - Rezepte der Kategorie
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @returns {string} HTML für Bestellfelder
 */
function renderBestellungFields(dayKey, categoryKey, recipes, currentEinrichtung) {
    // Nur für externe Einrichtungen
    if (!currentEinrichtung || currentEinrichtung.isIntern || !recipes || recipes.length === 0) {
        return '';
    }
    
    // Nur für Hauptspeisen (menu1, menu2, menu) Bestellfelder anzeigen
    if (!['menu1', 'menu2', 'menu'].includes(categoryKey)) {
        return '';
    }
    
    const gruppen = currentEinrichtung.gruppen || [];
    if (gruppen.length === 0) return '';
    
    let html = `
        <div class="bestellung-container mt-3">
            <h6 class="bestellung-title">
                <i class="bi bi-cart3 me-2"></i>
                Bestellung für ${formatDate(new Date())}
            </h6>
    `;
    
    gruppen.forEach(gruppe => {
        html += `
            <div class="gruppe-bestellung mb-2">
                <label class="form-label small">
                    ${gruppe.name} (${gruppe.anzahl} Personen)
                </label>
                <div class="input-group input-group-sm">
                    <input 
                        type="number" 
                        class="form-control bestellung-input" 
                        data-day="${dayKey}"
                        data-kategorie="${categoryKey}"
                        data-gruppe="${gruppe.name}"
                        min="0" 
                        max="${gruppe.anzahl}"
                        placeholder="Anzahl"
                        onchange="handleBestellungChange(this)"
                    >
                    <span class="input-group-text">von ${gruppe.anzahl}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
} 