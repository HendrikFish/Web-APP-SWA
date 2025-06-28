// desktop-calendar-handler.js - Desktop Kalender-Funktionalität
// Verwaltet die Desktop-Ansicht mit Kalender-Layout

import { 
    getMondayOfWeek, 
    formatDate,
    getCategoryName,
    getCategoryIcon
} from './menue-portal-api.js';
import { istDatumBewertbar } from './bewertung-api.js';

/**
 * Rendert die Desktop Kalender-Ansicht
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
export function renderDesktopCalendar(
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
    
    const container = document.getElementById('desktop-calendar');
    if (!container) return;
    
    const kategorien = extractVisibleCategories();
    const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    
    let calendarHtml = '<div class="desktop-calendar-grid">';
    
    days.forEach((dayKey, index) => {
        const dayData = currentMenuplan.days[dayKey];
        if (!dayData) return;
        
        const monday = getMondayOfWeek(currentYear, currentWeek);
        const dayDate = new Date(monday.getTime() + index * 24 * 60 * 60 * 1000);
        const dateStr = formatDate(dayDate);
        
        // Prüfe ob die Einrichtung an diesem Tag Essen bekommt
        const hatEssenAmTag = currentEinrichtung && currentEinrichtung.speiseplan && 
                             currentEinrichtung.speiseplan[dayKey] &&
                             (currentEinrichtung.speiseplan[dayKey].suppe || 
                              currentEinrichtung.speiseplan[dayKey].hauptspeise || 
                              currentEinrichtung.speiseplan[dayKey].dessert);
        
        const dayClass = hatEssenAmTag ? 'day-card' : 'day-card day-disabled';
        
        calendarHtml += `
            <div class="${dayClass}" data-day="${dayKey}">
                <div class="day-header">
                    <h5 class="day-name">${dayNames[index]}</h5>
                    <small class="day-date">${dateStr}</small>
                    ${!hatEssenAmTag ? '<small class="no-food-indicator text-muted">Kein Essen</small>' : ''}
                </div>
                
                <div class="day-content">
                    ${hatEssenAmTag ? renderDesktopDayContent(dayData.Mahlzeiten || dayData, kategorien, dayKey, currentEinrichtung, dayDate, rezepteCache, istKategorieRelevantFuerEinrichtung) : renderNoFoodContent()}
                </div>
            </div>
        `;
    });
    
    calendarHtml += '</div>';
    container.innerHTML = calendarHtml;
}

/**
 * Rendert den Inhalt eines Tages für die Desktop-Ansicht
 * @param {object} dayData - Daten für den Tag
 * @param {object} categories - Kategorien
 * @param {string} dayKey - Tag-Schlüssel
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {Date} dayDate - Datum des Tages
 * @param {object} rezepteCache - Rezepte-Cache
 * @param {function} istKategorieRelevantFuerEinrichtung - Relevanz-Prüfung
 * @returns {string} HTML für Tag-Inhalt
 */
function renderDesktopDayContent(dayData, categories, dayKey, currentEinrichtung, dayDate, rezepteCache, istKategorieRelevantFuerEinrichtung) {
    if (!dayData || !categories) return '';
    
    let html = '';
    
    // Kategorien durchgehen
    Object.entries(categories).forEach(([categoryKey, categoryInfo]) => {
        // Rezepte aus dayData holen - unterstütze beide Strukturen (mit/ohne Mahlzeiten)
        let recipes = [];
        
        if (categoryKey === 'hauptspeise' && categoryInfo.isZusammengefasst) {
            // Für Kindergarten/Schule: Unterstütze beide Datenstrukturen
            
            // Prüfe ob bereits zusammengefasste 'menu' Kategorie vorhanden ist
            if (dayData['menu'] && dayData['menu'].length > 0) {
                // Neue Struktur: Direkt aus 'menu' Kategorie
                recipes = dayData['menu'] || [];
            } else {
                // Alte Struktur: Aus menu1/menu2 basierend auf Zuweisungen
                const istMenu1Zugewiesen = window.istKategorieZugewiesen ? window.istKategorieZugewiesen('menu1', dayKey, currentEinrichtung.id) : false;
                const istMenu2Zugewiesen = window.istKategorieZugewiesen ? window.istKategorieZugewiesen('menu2', dayKey, currentEinrichtung.id) : false;
                
                if (istMenu1Zugewiesen) {
                    recipes = dayData['menu1'] || [];
                } else if (istMenu2Zugewiesen) {
                    recipes = dayData['menu2'] || [];
                } else {
                    recipes = []; // Keine Zuweisung
                }
            }
        } else {
            // Normale Kategorien - auch direkt aus dayData[categoryKey]
            recipes = dayData[categoryKey] || [];
        }
        
        // Prüfe ob diese Kategorie für die Einrichtung relevant ist (Desktop = false)
        const istKategorieRelevant = istKategorieRelevantFuerEinrichtung(categoryKey, dayKey, false);
        
        if (!istKategorieRelevant) return;
        
        // Prüfe ob Einrichtung diese Kategorie zugewiesen bekommen hat
        let istZugewiesen = true;
        if (categoryKey === 'hauptspeise' && categoryInfo.isZusammengefasst) {
            // Für Kindergarten/Schule: Verwende die direkte hauptspeise-Prüfung
            istZugewiesen = window.istKategorieZugewiesen ? window.istKategorieZugewiesen('hauptspeise', dayKey, currentEinrichtung.id) : false;
        } else {
            istZugewiesen = window.istKategorieZugewiesen ? window.istKategorieZugewiesen(categoryKey, dayKey, currentEinrichtung.id) : true;
        }
        
        // Platzhalter-Logik: "Noch nicht gewählt" nur wenn zugewiesen aber leer
        let recipeContent = '';
        if (recipes.length > 0) {
            recipeContent = renderDesktopRecipeList(recipes, rezepteCache);
        } else if (istZugewiesen) {
            recipeContent = '<small class="text-muted"><i class="bi bi-info-circle me-1"></i>Noch nicht gewählt</small>';
        } else {
            recipeContent = '<small class="text-muted">-</small>'; // Leere Karte
        }
        
        html += `
            <div class="category-section mb-3">
                <div class="category-header d-flex justify-content-between align-items-center mb-2">
                        <strong class="category-title">
                            <span class="category-icon me-1">${categoryInfo.icon}</span>
                            ${categoryInfo.name}
                        </strong>
                    <div class="category-actions">
                        ${renderDesktopInformationButton(dayKey, categoryKey, dayDate, currentEinrichtung, window.currentInformationenData || {})}
                        ${recipes.length > 0 ? renderDesktopBewertungButton(dayKey, categoryKey, recipes, dayDate, currentEinrichtung, rezepteCache) : ''}
                    </div>
                </div>
                
                <div class="recipe-content">
                    ${recipeContent}
                </div>
                
                ${istZugewiesen ? renderDesktopBestellungFields(dayKey, categoryKey, recipes, currentEinrichtung) : ''}
            </div>
            
            ${categoryKey === 'dessert' ? renderInfoGelesenCard(dayKey, dayDate, currentEinrichtung, window.currentInformationenData || {}) : ''}
        `;
    });
    
    if (html.trim() === '') {
        return '<div class="text-muted text-center p-2">Keine relevanten Kategorien</div>';
    }
    
    return html;
}

/**
 * Rendert eine kompakte Liste von Rezepten für Desktop
 * @param {object[]} recipes - Array von Rezepten
 * @param {object} rezepteCache - Rezepte-Cache
 * @returns {string} HTML für Rezepte
 */
function renderDesktopRecipeList(recipes, rezepteCache) {
    if (!recipes || recipes.length === 0) {
        return '';
    }
    
    return recipes.map(recipe => {
        const recipeData = rezepteCache[recipe.id] || recipe;
        const name = recipeData.name || 'Unbekanntes Rezept';
        const allergene = recipeData.allergene || [];
        
        return `
            <div class="recipe-item-desktop">
                <span class="recipe-name">${name}</span>
                ${allergene.length > 0 ? `
                    <div class="allergen-icons-compact">
                        ${allergene.slice(0, 3).map(allergen => `
                            <span class="allergen-icon-small" title="${allergen}">${allergen.charAt(0).toUpperCase()}</span>
                        `).join('')}
                        ${allergene.length > 3 ? '<span class="allergen-icon-small">+</span>' : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Rendert einen kompakten Bewertungs-Button für Desktop
 * @param {string} dayKey - Wochentag-Key
 * @param {string} categoryKey - Kategorie-Key
 * @param {object[]} recipes - Rezepte der Kategorie
 * @param {Date} dayDate - Datum des Tages
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {object} rezepteCache - Rezepte-Cache
 * @returns {string} HTML für Bewertungs-Button
 */
function renderDesktopBewertungButton(dayKey, categoryKey, recipes, dayDate, currentEinrichtung, rezepteCache) {
    const currentUser = window.currentUser; // Globale Variable
    
    if (!currentUser || !recipes || recipes.length === 0) {
        return '';
    }
    
    // Prüfen ob Datum bewertbar ist - wenn nicht, Button komplett ausblenden
    const isDateRatable = istDatumBewertbar(dayDate);
    if (!isDateRatable) {
        return '';
    }
    
    const rezeptNamen = recipes.map(r => (rezepteCache[r.id] || r).name || 'Unbekanntes Rezept');
    const buttonId = `bewertung-btn-desktop-${dayKey}-${categoryKey}`;
    
    return `
        <button 
            type="button" 
            class="bewertung-btn-desktop" 
            id="${buttonId}"
            data-day="${dayKey}"
            data-kategorie="${categoryKey}"
            data-datum="${dayDate.toISOString().split('T')[0]}"
            data-rezepte='${JSON.stringify(rezeptNamen)}'
            title="Kategorie bewerten"
            onclick="handleBewertungClick('${dayKey}', '${categoryKey}', ${JSON.stringify(rezeptNamen).replace(/"/g, '&quot;')}, '${dayDate.toISOString()}')"
        >
            <i class="bi bi-star"></i>
        </button>
    `;
}

/**
 * Rendert einen Informations-Button für Desktop
 * @param {string} dayKey - Wochentag-Key
 * @param {string} categoryKey - Kategorie-Key
 * @param {Date} dayDate - Datum des Tages
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {object} informationenData - Informationen-Daten
 * @returns {string} HTML für Informations-Button
 */
function renderDesktopInformationButton(dayKey, categoryKey, dayDate, currentEinrichtung, informationenData) {
    const currentUser = window.currentUser;
    
    if (!currentUser) {
        return '';
    }
    
    // Informations-Button nur bei Hauptspeisen anzeigen
    if (!['menu1', 'menu2', 'menu', 'hauptspeise'].includes(categoryKey)) {
        return '';
    }
    
    // Prüfen ob Informationen für diesen Tag existieren
    const tagInformationen = informationenData[dayKey] || [];
    const hasInfo = tagInformationen.filter(info => !info.soft_deleted).length > 0;
    
    const buttonId = `information-btn-desktop-${dayKey}-${categoryKey}`;
    const buttonClass = hasInfo ? 'information-btn-desktop has-info' : 'information-btn-desktop';
    const iconClass = hasInfo ? 'bi bi-info-circle-fill' : 'bi bi-info-circle';
    const title = hasInfo ? 'Information vorhanden - klicken zum Bearbeiten' : 'Neue Information erstellen';
    
    return `
        <button 
            type="button" 
            class="${buttonClass}" 
            id="${buttonId}"
            data-day="${dayKey}"
            data-datum="${dayDate.toISOString().split('T')[0]}"
            title="${title}"
            onclick="handleInformationClick('${dayKey}', '${dayDate.toISOString()}')"
        >
            <i class="${iconClass}"></i>
        </button>
    `;
}

/**
 * Rendert Bestellfelder für Desktop externe Einrichtungen (Mobile-Layout)
 * @param {string} dayKey - Wochentag-Schlüssel
 * @param {string} categoryKey - Kategorie-Schlüssel  
 * @param {object[]} recipes - Rezepte der Kategorie
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @returns {string} HTML für Bestellfelder
 */
function renderDesktopBestellungFields(dayKey, categoryKey, recipes, currentEinrichtung) {
    // Nur für externe Einrichtungen
    if (!currentEinrichtung || currentEinrichtung.isIntern || !recipes || recipes.length === 0) {
        return '';
    }
    
    // Nur für Hauptspeisen (menu1, menu2, menu, hauptspeise) Bestellfelder anzeigen
    if (!['menu1', 'menu2', 'menu', 'hauptspeise'].includes(categoryKey)) {
        return '';
    }
    
    const gruppen = currentEinrichtung.gruppen || [];
    if (gruppen.length === 0) return '';
    
    // Desktop mit Mobile-Layout-Stil
    let html = `
        <div class="bestellung-container bestellung-container-desktop mt-3">
            <h6 class="bestellung-title">
                <i class="bi bi-cart3 me-2"></i>
                Bestellt am ${formatDate(new Date())}
            </h6>
    `;
    
    gruppen.forEach((gruppe, index) => {
        const inputId = `bestellung-desktop-${dayKey}-${categoryKey}-${gruppe.name.replace(/\s+/g, '-').toLowerCase()}`;
        html += `
            <div class="gruppe-bestellung mb-2">
                <label for="${inputId}" class="form-label small">
                    ${gruppe.name} (${gruppe.anzahl} Personen)
                </label>
                <div class="input-group input-group-sm">
                    <input 
                        type="number" 
                        id="${inputId}"
                        class="form-control bestellung-input bestellung-input-desktop" 
                        data-day="${dayKey}"
                        data-kategorie="${categoryKey}"
                        data-gruppe="${gruppe.name}"
                        data-max-anzahl="${gruppe.anzahl}"
                        min="0" 
                        max="${gruppe.anzahl}"
                        placeholder="Anzahl"
                        onchange="handleBestellungChange(this)"
                        oninput="validateMaxInput(this)"
                        aria-describedby="${inputId}-hint"
                        style="max-width: 80px; font-size: 1.1rem; text-align: center;"
                    >
                    <span class="input-group-text bestellung-max-indicator" id="${inputId}-hint">von ${gruppe.anzahl}</span>
                    <button 
                        type="button" 
                        class="btn btn-outline-dark btn-sm bestellung-save-btn-desktop"
                        data-input-id="${inputId}"
                        onclick="manualSaveBestellungen()"
                        title="Bestellungen jetzt speichern"
                    >
                        <i class="bi bi-check-lg"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `
            <div class="bestellung-actions mt-2">
                <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    Änderungen werden automatisch nach 1 Sekunde gespeichert
                </small>
            </div>
        </div>
    `;
    return html;
}

/**
 * Rendert Inhalt für Tage ohne Essen
 * @returns {string} HTML für "Kein Essen"-Anzeige
 */
function renderNoFoodContent() {
    return `
        <div class="no-food-content text-center text-muted p-3">
            <i class="bi bi-x-circle mb-2 d-block" style="font-size: 1.5rem;"></i>
            <small>Kein Essen verfügbar</small>
        </div>
    `;
}

/**
 * Rendert eine grüne Info-Karte wenn Informationen gelesen wurden
 * @param {string} dayKey - Wochentag-Key
 * @param {Date} dayDate - Datum des Tages
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {object} informationenData - Informationen-Daten
 * @returns {string} HTML für Info-gelesen-Karte oder leer
 */
function renderInfoGelesenCard(dayKey, dayDate, currentEinrichtung, informationenData) {
    const currentUser = window.currentUser;
    
    if (!currentUser || !informationenData) {
        return '';
    }
    
    // Prüfen ob Informationen für diesen Tag existieren und gelesen wurden
    const tagInformationen = informationenData[dayKey] || [];
    const gelesenInformationen = tagInformationen.filter(info => 
        !info.soft_deleted && info.read === true
    );
    
    if (gelesenInformationen.length === 0) {
        return '';
    }
    
    const anzahlGelesen = gelesenInformationen.length;
    const mehrereInformationen = anzahlGelesen > 1;
    
    return `
        <div class="info-gelesen-card mt-2" onclick="handleInformationClick('${dayKey}', '${dayDate.toISOString()}')">
            <div class="card-title">
                <i class="bi bi-check-circle-fill me-1"></i>
                ${mehrereInformationen 
                    ? `${anzahlGelesen} Informationen gelesen` 
                    : 'Information gelesen'
                }
            </div>
        </div>
    `;
}

 