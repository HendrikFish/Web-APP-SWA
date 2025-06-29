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
        
        // Alle Accordion-Items standardmäßig geschlossen
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
                        <div class="w-100 d-flex justify-content-between align-items-center accordion-header-content">
                            <div class="day-info">
                                <span class="day-name fw-bold">${dayNames[index]}</span>
                                <small class="day-date text-muted d-block">${dateStr}</small>
                            </div>
                            <div class="day-meta">
                                <span class="recipe-count badge bg-primary">
                                    ${Object.keys(kategorien).reduce((count, categoryKey) => {
                                        let recipes = [];
                                        
                                        // Spezialbehandlung für Kindergarten/Schule hauptspeise
                                        const istKindergartenOderSchule = currentEinrichtung && 
                                            ['Kindergartenkinder', 'Schüler'].includes(currentEinrichtung.personengruppe);
                                        
                                        if (istKindergartenOderSchule && categoryKey === 'hauptspeise') {
                                            // Debug-Ausgabe
                                            console.log(`🔍 Mobile Debug - ${dayKey} hauptspeise:`, {
                                                istKindergartenOderSchule,
                                                categoryKey,
                                                dayDataMenu: dayData['menu'],
                                                dayDataMahlzeitenMenu: dayData.Mahlzeiten ? dayData.Mahlzeiten['menu'] : 'keine Mahlzeiten',
                                                dayDataMahlzeitenMenu1: dayData.Mahlzeiten ? dayData.Mahlzeiten['menu1'] : 'keine Mahlzeiten',
                                                dayDataMahlzeitenMenu2: dayData.Mahlzeiten ? dayData.Mahlzeiten['menu2'] : 'keine Mahlzeiten'
                                            });
                                            
                                            // Für Kindergarten/Schule: Prüfe 'menu' Kategorie oder zugewiesene menu1/menu2
                                            if (dayData['menu'] && dayData['menu'].length > 0) {
                                                recipes = dayData['menu']; // Neue Struktur
                                                console.log(`✅ Mobile: Verwende dayData['menu']:`, recipes);
                                            } else {
                                                // Fallback: Prüfe Zuweisungen für alte Struktur
                                                const istMenu1Zugewiesen = window.istKategorieZugewiesen ? window.istKategorieZugewiesen('menu1', dayKey, currentEinrichtung.id) : false;
                                                const istMenu2Zugewiesen = window.istKategorieZugewiesen ? window.istKategorieZugewiesen('menu2', dayKey, currentEinrichtung.id) : false;
                                                
                                                console.log(`🔍 Mobile Zuweisungs-Check:`, {
                                                    istMenu1Zugewiesen,
                                                    istMenu2Zugewiesen,
                                                    einrichtungId: currentEinrichtung.id
                                                });
                                                
                                                if (istMenu1Zugewiesen) {
                                                    recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten['menu1'] || []) : (dayData['menu1'] || []);
                                                    console.log(`✅ Mobile: Verwende menu1:`, recipes);
                                                } else if (istMenu2Zugewiesen) {
                                                    recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten['menu2'] || []) : (dayData['menu2'] || []);
                                                    console.log(`✅ Mobile: Verwende menu2:`, recipes);
                                                } else {
                                                    // Keine Zuweisung: leeres Array für Platzhalter "Noch nicht erzeugt"
                                                    recipes = [];
                                                    console.log(`❌ Mobile: Keine Zuweisungen gefunden`);
                                                }
                                            }
                                        } else if (categoryKey === 'hauptspeise' && kategorien[categoryKey].isZusammengefasst) {
                                            // Für andere Einrichtungen: menu1 + menu2 kombinieren
                                            const menu1Recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten['menu1'] || []) : (dayData['menu1'] || []);
                                            const menu2Recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten['menu2'] || []) : (dayData['menu2'] || []);
                                            recipes = [...menu1Recipes, ...menu2Recipes];
                                        } else {
                                            // Normale Kategorien
                                            recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten[categoryKey] || []) : (dayData[categoryKey] || []);
                                        }
                                        
                                        const istRelevant = istKategorieRelevantFuerEinrichtung(categoryKey, dayKey, false);
                                        return count + (istRelevant ? recipes.length : 0);
                                    }, 0)} Komponente/n
                                </span>
                            </div>
                        </div>
                    </button>
                </h2>
                <div 
                    id="collapse-${dayKey}" 
                    class="accordion-collapse collapse"
                    aria-labelledby="heading-${dayKey}"
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
    
    // Einfache, robuste Accordion-Funktionalität ohne Bootstrap-Konflikte
    setTimeout(() => {
        const accordionButtons = container.querySelectorAll('.accordion-button');
        
        accordionButtons.forEach(button => {
            // Entferne alle Bootstrap-Event-Listener
            button.removeAttribute('data-bs-toggle');
            button.removeAttribute('data-bs-target');
            
            // Stelle sicher, dass alle Buttons initial collapsed sind
            button.classList.add('collapsed');
            button.setAttribute('aria-expanded', 'false');
            
            const targetId = button.getAttribute('aria-controls');
            const targetCollapse = container.querySelector(`#${targetId}`);
            
            if (targetCollapse) {
                // Stelle sicher, dass alle Collapses initial geschlossen sind
                targetCollapse.classList.remove('show');
                
                // Eigener Click-Handler
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const isExpanded = button.getAttribute('aria-expanded') === 'true';
                    
                    if (isExpanded) {
                        // Schließen
                        button.classList.add('collapsed');
                        button.setAttribute('aria-expanded', 'false');
                        targetCollapse.classList.remove('show');
                    } else {
                        // Öffnen
                        button.classList.remove('collapsed');
                        button.setAttribute('aria-expanded', 'true');
                        targetCollapse.classList.add('show');
                    }
                });
            }
        });
    }, 0);
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
        
        // Mobile: Kategorien anzeigen wenn im Speiseplan auf true (unabhängig von Zuweisungen)
        // Für Kindergarten/Schule: Nur die tatsächlich zugewiesene Kategorie als "Hauptspeise" anzeigen
        const istKindergartenOderSchule = currentEinrichtung && 
            ['Kindergartenkinder', 'Schüler'].includes(currentEinrichtung.personengruppe);
        
        if (istKindergartenOderSchule && categoryKey === 'hauptspeise') {
            // Debug-Ausgabe
            console.log(`🔍 Mobile Debug - ${dayKey} hauptspeise:`, {
                istKindergartenOderSchule,
                categoryKey,
                dayDataMenu: dayData['menu'],
                dayDataMahlzeitenMenu: dayData.Mahlzeiten ? dayData.Mahlzeiten['menu'] : 'keine Mahlzeiten',
                dayDataMahlzeitenMenu1: dayData.Mahlzeiten ? dayData.Mahlzeiten['menu1'] : 'keine Mahlzeiten',
                dayDataMahlzeitenMenu2: dayData.Mahlzeiten ? dayData.Mahlzeiten['menu2'] : 'keine Mahlzeiten'
            });
            
            // Für Kindergarten/Schule: Prüfe 'menu' Kategorie oder zugewiesene menu1/menu2
            if (dayData['menu'] && dayData['menu'].length > 0) {
                recipes = dayData['menu']; // Neue Struktur
                console.log(`✅ Mobile: Verwende dayData['menu']:`, recipes);
            } else {
                // Fallback: Prüfe Zuweisungen für alte Struktur
                const istMenu1Zugewiesen = window.istKategorieZugewiesen ? window.istKategorieZugewiesen('menu1', dayKey, currentEinrichtung.id) : false;
                const istMenu2Zugewiesen = window.istKategorieZugewiesen ? window.istKategorieZugewiesen('menu2', dayKey, currentEinrichtung.id) : false;
                
                console.log(`🔍 Mobile Zuweisungs-Check:`, {
                    istMenu1Zugewiesen,
                    istMenu2Zugewiesen,
                    einrichtungId: currentEinrichtung.id
                });
                
                if (istMenu1Zugewiesen) {
                    recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten['menu1'] || []) : (dayData['menu1'] || []);
                    console.log(`✅ Mobile: Verwende menu1:`, recipes);
                } else if (istMenu2Zugewiesen) {
                    recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten['menu2'] || []) : (dayData['menu2'] || []);
                    console.log(`✅ Mobile: Verwende menu2:`, recipes);
                } else {
                    // Keine Zuweisung: leeres Array für Platzhalter "Noch nicht erzeugt"
                    recipes = [];
                    console.log(`❌ Mobile: Keine Zuweisungen gefunden`);
                }
            }
        } else {
            // Normale Kategorien
            recipes = dayData.Mahlzeiten ? (dayData.Mahlzeiten[categoryKey] || []) : (dayData[categoryKey] || []);
        }
        
        // Prüfe ob diese Kategorie für die Einrichtung relevant ist (Mobile = false, da wir alle Standard-Kategorien wollen)
        const istKategorieRelevant = istKategorieRelevantFuerEinrichtung(categoryKey, dayKey, false);
        
        if (!istKategorieRelevant) return;
        
        html += `
            <div class="category-section mb-4" data-day="${dayKey}" data-category="${categoryKey}">
                <div class="category-header d-flex justify-content-between align-items-center mb-3">
                    <div class="category-info">
                        <h6 class="category-title mb-0">
                            <span class="category-icon me-2">${categoryInfo.icon}</span>
                            ${categoryInfo.name}
                        </h6>
                    </div>
                    <div class="category-actions">
                        ${renderMobileInformationButton(dayKey, categoryKey, dayDate, currentEinrichtung, window.currentInformationenData || {})}
                        ${recipes.length > 0 ? renderBewertungButton(dayKey, categoryKey, recipes, dayDate, currentEinrichtung, rezepteCache) : ''}
                    </div>
                </div>
                
                <div class="recipe-content">
                    ${recipes.length > 0 ? renderRecipeList(recipes, rezepteCache) : '<div class="no-recipes-info"><i class="bi bi-info-circle me-2"></i>Noch nicht erzeugt</div>'}
                </div>
                
                ${renderBestellungFields(dayKey, categoryKey, recipes, currentEinrichtung)}
            </div>
            
            ${categoryKey === 'dessert' ? renderMobileInfoGelesenCard(dayKey, dayDate, currentEinrichtung, window.currentInformationenData || {}) : ''}
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
    
    // Prüfen ob Datum bewertbar ist - wenn nicht, Button komplett ausblenden
    const isDateRatable = istDatumBewertbar(dayDate);
    if (!isDateRatable) {
        return '';
    }
    
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
            onclick="handleBewertungClick('${dayKey}', '${categoryKey}', ${JSON.stringify(rezeptNamen).replace(/"/g, '&quot;')}, '${dayDate.toISOString()}')"
        >
            <i class="bi bi-star-fill"></i>
        </button>
    `;
}

/**
 * Rendert einen Informations-Button für Mobile
 * @param {string} dayKey - Wochentag-Key
 * @param {string} categoryKey - Kategorie-Key
 * @param {Date} dayDate - Datum des Tages
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {object} informationenData - Informationen-Daten
 * @returns {string} HTML für Informations-Button
 */
function renderMobileInformationButton(dayKey, categoryKey, dayDate, currentEinrichtung, informationenData) {
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
    
    const buttonId = `information-btn-mobile-${dayKey}-${categoryKey}`;
    const buttonClass = hasInfo ? 'information-btn has-info' : 'information-btn';
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
 * Rendert Bestellfelder für externe Einrichtungen
 * @param {string} dayKey - Wochentag-Schlüssel
 * @param {string} categoryKey - Kategorie-Schlüssel  
 * @param {object[]} recipes - Rezepte der Kategorie
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @returns {string} HTML für Bestellfelder
 */
function renderBestellungFields(dayKey, categoryKey, recipes, currentEinrichtung) {
    console.log('🛒 Debug renderBestellungFields:', {
        dayKey,
        categoryKey,
        hasRecipes: !!recipes,
        recipesLength: recipes ? recipes.length : 0,
        hasEinrichtung: !!currentEinrichtung,
        einrichtungName: currentEinrichtung ? currentEinrichtung.name : 'KEINE',
        isIntern: currentEinrichtung ? currentEinrichtung.isIntern : 'UNBEKANNT',
        hasGruppen: currentEinrichtung ? !!(currentEinrichtung.gruppen) : false,
        gruppenCount: currentEinrichtung ? (currentEinrichtung.gruppen || []).length : 0,
        gruppen: currentEinrichtung ? currentEinrichtung.gruppen : 'KEINE'
    });
    
    // Nur für externe Einrichtungen
    if (!currentEinrichtung || currentEinrichtung.isIntern || !recipes || recipes.length === 0) {
        console.log('❌ Bestellfelder nicht gerendert: externe/rezepte check fehlgeschlagen');
        return '';
    }
    
    // Nur für Hauptspeisen (menu1, menu2, menu, hauptspeise) Bestellfelder anzeigen
    if (!['menu1', 'menu2', 'menu', 'hauptspeise'].includes(categoryKey)) {
        console.log('❌ Bestellfelder nicht gerendert: kategorie nicht relevant', categoryKey);
        return '';
    }
    
    const gruppen = currentEinrichtung.gruppen || [];
    if (gruppen.length === 0) {
        console.log('❌ Bestellfelder nicht gerendert: keine gruppen definiert', {
            einrichtungName: currentEinrichtung.name,
            gruppen: currentEinrichtung.gruppen
        });
        return '';
    }
    
    console.log('✅ Bestellfelder werden gerendert!', {
        dayKey,
        categoryKey,
        gruppenCount: gruppen.length
    });
    
    let html = `
        <div class="bestellung-container mt-3">
            <h6 class="bestellung-title">
                <i class="bi bi-cart3 me-2"></i>
                Bestellt am ${formatDate(new Date())}
            </h6>
    `;
    
    gruppen.forEach((gruppe, index) => {
        const inputId = `bestellung-${dayKey}-${categoryKey}-${gruppe.name.replace(/\s+/g, '-').toLowerCase()}`;
        html += `
            <div class="gruppe-bestellung mb-2">
                <label for="${inputId}" class="form-label small">
                    ${gruppe.name} (${gruppe.anzahl} Personen)
                </label>
                <div class="input-group input-group-sm">
                    <input 
                        type="number" 
                        id="${inputId}"
                        class="form-control bestellung-input bestellung-input-mobile" 
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
                        class="btn btn-outline-dark btn-sm bestellung-save-btn-mobile"
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
 * Rendert eine Info-Karte für Informationen (gelesen/ungelesen) - Mobile
 * @param {string} dayKey - Wochentag-Key
 * @param {Date} dayDate - Datum des Tages
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {object} informationenData - Informationen-Daten
 * @returns {string} HTML für Info-Karte oder leer
 */
function renderMobileInfoGelesenCard(dayKey, dayDate, currentEinrichtung, informationenData) {
    const currentUser = window.currentUser;
    
    if (!currentUser || !informationenData) {
        return '';
    }
    
    // Prüfen ob Informationen für diesen Tag existieren
    const tagInformationen = informationenData[dayKey] || [];
    const activeInformationen = tagInformationen.filter(info => !info.soft_deleted);
    
    if (activeInformationen.length === 0) {
        return ''; // Keine Informationen = keine Karte
    }
    
    // Kategorisiere Informationen
    const gelesenInformationen = activeInformationen.filter(info => info.read === true);
    const ungelesenInformationen = activeInformationen.filter(info => info.read !== true);
    
    // Bestimme den dominanten Status und Style
    let cardClass, iconClass, titel, cardStyle;
    
    if (ungelesenInformationen.length > 0) {
        // Ungelesene Informationen haben Priorität
        cardClass = 'info-ungelesen-card';
        iconClass = 'bi bi-exclamation-circle-fill';
        cardStyle = 'background: linear-gradient(135deg, #fff3cd, #ffeaa7); border: 1px solid #ffc107; color: #856404;';
        
        if (ungelesenInformationen.length === 1) {
            titel = 'Information ungelesen';
        } else {
            titel = `${ungelesenInformationen.length} Informationen ungelesen`;
        }
        
        // Zusätzlicher Hinweis wenn auch gelesene vorhanden sind
        if (gelesenInformationen.length > 0) {
            titel += ` (${gelesenInformationen.length} gelesen)`;
        }
    } else {
        // Alle Informationen gelesen
        cardClass = 'info-gelesen-card';
        iconClass = 'bi bi-check-circle-fill';
        cardStyle = 'background: linear-gradient(135deg, #e3f2fd, #bbdefb); border: 1px solid #2196f3; color: #1976d2;';
        
        if (gelesenInformationen.length === 1) {
            titel = 'Information gelesen';
        } else {
            titel = `${gelesenInformationen.length} Informationen gelesen`;
        }
    }
    
    return `
        <div class="${cardClass} mt-2" 
             style="${cardStyle} border-radius: 8px; padding: 0.75rem; text-align: center; cursor: pointer; transition: all 0.2s ease;"
             onclick="handleInformationClick('${dayKey}', '${dayDate.toISOString()}')"
             onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.15)';"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            <div class="card-title" style="font-weight: 600; font-size: 0.9rem; margin: 0;">
                <i class="${iconClass} me-1"></i>
                ${titel}
            </div>
        </div>
    `;
} 