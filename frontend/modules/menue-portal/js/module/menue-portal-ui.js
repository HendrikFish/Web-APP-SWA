// menue-portal-ui.js - UI-Funktionen für das Menü-Portal
// Verwaltet die Darstellung von Menüplänen (Mobile Accordion + Desktop Grid)

import { showToast } from '@shared/components/toast-notification/toast-notification.js';
import { 
    loadMenuplan, 
    loadRezepte, 
    extractRecipeIds,
    getMondayOfWeek,
    formatDate,
    getDayName,
    getCategoryName,
    getCategoryIcon,
    loadPortalStammdaten
} from './menue-portal-api.js';
import { getAllEinrichtungen, getDefaultEinrichtung } from './menue-portal-auth.js';
import { initBewertungModal, openBewertungModal } from './bewertung-modal.js';
import { istDatumBewertbar } from './bewertung-api.js';

// Globale UI-State
let currentEinrichtung = null;
let currentUser = null;
let currentYear = new Date().getFullYear();
let currentWeek = getWeekNumber(new Date());
let currentMenuplan = null;
let rezepteCache = {};
let isMobile = false;
let portalStammdaten = null;

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
        
        // Portal-Stammdaten laden
        const stammdatenResult = await loadPortalStammdaten();
        if (stammdatenResult.success) {
            portalStammdaten = stammdatenResult.stammdaten;
        }
        
        // Mobile Detection
        updateMobileDetection();
        
        // Loading ausblenden
        hideLoading();
        
        // Einrichtungs-Selector setup
        setupEinrichtungsSelector(einrichtungen);
        
        // Controls setup
        setupControls();
        
        // Layout Event-Listener
        setupLayoutEventListeners();
        
        // Standard-Einrichtung wählen und Menüplan laden
        currentEinrichtung = getDefaultEinrichtung();
        if (currentEinrichtung) {
            await loadAndDisplayMenuplan();
            // Bewertungs-Modal nach dem Laden des Menüplans initialisieren
            initBewertungModal(currentUser, currentEinrichtung);
        }
        
        console.log('✅ Menü-Portal UI initialisiert');
        
    } catch (error) {
        console.error('❌ Fehler bei UI-Initialisierung:', error);
        showToast('Fehler beim Initialisieren der Benutzeroberfläche', 'error');
    }
}

/**
 * Setup der Einrichtungs-Auswahl
 * @param {object[]} einrichtungen - Verfügbare Einrichtungen
 */
function setupEinrichtungsSelector(einrichtungen) {
    const container = document.getElementById('einrichtungs-selector');
    const infoElement = document.getElementById('einrichtungs-info');
    
    if (!container) return;
    
    // Einrichtungs-Info im Controls-Bereich aktualisieren
    if (infoElement && currentEinrichtung) {
        infoElement.innerHTML = `
            <i class="bi bi-building"></i>
            <strong>${currentEinrichtung.name}</strong>
            <span class="badge bg-secondary ms-2">${currentEinrichtung.kuerzel}</span>
        `;
    }
    
    // Wenn nur eine Einrichtung: Selector ausblenden
    if (einrichtungen.length <= 1) {
        container.style.display = 'none';
        return;
    }
    
    // Buttons für jede Einrichtung erstellen
    const buttonsHtml = einrichtungen.map(einrichtung => `
        <button 
            type="button" 
            class="btn btn-outline-primary einrichtung-btn" 
            data-einrichtung-id="${einrichtung.id}"
        >
            ${einrichtung.name}
            <span class="badge bg-light text-dark ms-1">${einrichtung.kuerzel}</span>
        </button>
    `).join('');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h6 class="card-title mb-3">
                    <i class="bi bi-building"></i> Einrichtung wählen:
                </h6>
                <div class="btn-group-sm d-flex flex-wrap gap-2" role="group">
                    ${buttonsHtml}
                </div>
            </div>
        </div>
    `;
    
    // Selector anzeigen
    container.style.display = 'block';
    
    // Event-Listener für Einrichtungsauswahl
    container.addEventListener('click', async (e) => {
        if (e.target.classList.contains('einrichtung-btn')) {
            const einrichtungId = e.target.dataset.einrichtungId;
            await switchEinrichtung(einrichtungId);
        }
    });
    
    // Aktuelle Einrichtung als aktiv markieren
    if (currentEinrichtung) {
        const activeBtn = container.querySelector(`[data-einrichtung-id="${currentEinrichtung.id}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

/**
 * Setup der Steuerelemente (Wochennavigation)
 */
function setupControls() {
    // Wochennavigation
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const currentWeekBtn = document.getElementById('current-week');
    const currentWeekDisplay = document.getElementById('week-display');
    
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => navigateWeek(-1));
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => navigateWeek(1));
    }
    
    if (currentWeekBtn) {
        currentWeekBtn.addEventListener('click', () => navigateToCurrentWeek());
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
        refreshBtn.addEventListener('click', () => loadAndDisplayMenuplan());
    }
    
    // Aktuelle Woche anzeigen
    updateWeekDisplay();
}

/**
 * Layout Event-Listener setup
 */
function setupLayoutEventListeners() {
    // Resize-Handler
    window.addEventListener('menue-portal:layout-change', () => {
        updateMobileDetection();
        renderMenuplan();
    });
    
    // Initial Mobile Detection
    window.addEventListener('resize', () => {
        setTimeout(updateMobileDetection, 100);
    });
}

/**
 * Wechselt zu einer anderen Einrichtung
 * @param {string} einrichtungId - ID der neuen Einrichtung
 */
async function switchEinrichtung(einrichtungId) {
    try {
        const einrichtungen = getAllEinrichtungen();
        const einrichtung = einrichtungen.find(e => e.id === einrichtungId);
        
        if (!einrichtung) {
            showToast('Einrichtung nicht gefunden', 'error');
            return;
        }
        
        // UI State aktualisieren
        currentEinrichtung = einrichtung;
        
        // Einrichtungs-Info aktualisieren
        const infoElement = document.getElementById('einrichtungs-info');
        if (infoElement) {
            infoElement.innerHTML = `
                <i class="bi bi-building"></i>
                <strong>${einrichtung.name}</strong>
                <span class="badge bg-secondary ms-2">${einrichtung.kuerzel}</span>
            `;
        }
        
        // Button-Styling aktualisieren
        document.querySelectorAll('.einrichtung-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-einrichtung-id="${einrichtungId}"]`)?.classList.add('active');
        
        // Neuen Menüplan laden
        await loadAndDisplayMenuplan();
        
        // Bewertungs-Modal mit neuer Einrichtung neu initialisieren
        if (currentUser) {
            initBewertungModal(currentUser, currentEinrichtung);
        }
        
        showToast(`Einrichtung gewechselt: ${einrichtung.name}`, 'success');
        
    } catch (error) {
        console.error('Fehler beim Wechseln der Einrichtung:', error);
        showToast('Fehler beim Wechseln der Einrichtung', 'error');
    }
}

/**
 * Navigiert zu einer anderen Kalenderwoche
 * @param {number} direction - Richtung (-1 für vorherige, +1 für nächste Woche)
 */
async function navigateWeek(direction) {
    const newWeek = currentWeek + direction;
    let newYear = currentYear;
    
    // Jahr-Wechsel berücksichtigen
    if (newWeek < 1) {
        newYear = currentYear - 1;
        currentWeek = getWeeksInYear(newYear);
    } else if (newWeek > getWeeksInYear(currentYear)) {
        newYear = currentYear + 1;
        currentWeek = 1;
    } else {
        currentWeek = newWeek;
    }
    
    currentYear = newYear;
    
    // UI aktualisieren
    updateWeekDisplay();
    await loadAndDisplayMenuplan();
}

/**
 * Navigiert zur aktuellen Kalenderwoche
 */
async function navigateToCurrentWeek() {
    const today = new Date();
    currentYear = today.getFullYear();
    currentWeek = getWeekNumber(today);
    
    // UI aktualisieren
    updateWeekDisplay();
    await loadAndDisplayMenuplan();
}

/**
 * Lädt und zeigt den aktuellen Menüplan an
 */
async function loadAndDisplayMenuplan() {
    if (!currentEinrichtung) {
        showError('Keine Einrichtung ausgewählt');
        return;
    }
    
    try {
        showLoading();
        
        // Menüplan von API laden
        const result = await loadMenuplan(currentEinrichtung.id, currentYear, currentWeek);
        
        if (!result.success) {
            showError(result.message);
            return;
        }
        
        currentMenuplan = result.menuplan;
        window.currentMenuPlan = currentMenuplan;
        
        // Rezept-Details laden
        await loadMenuplanRecipes();
        
        // Menüplan rendern
        renderMenuplan();
        
        hideLoading();
        
    } catch (error) {
        console.error('Fehler beim Laden des Menüplans:', error);
        showError('Fehler beim Laden des Menüplans');
    }
}

/**
 * Lädt die Rezept-Details für den aktuellen Menüplan
 */
async function loadMenuplanRecipes() {
    if (!currentMenuplan) return;
    
    try {
        const recipeIds = extractRecipeIds(currentMenuplan);
        
        if (recipeIds.length === 0) {
            console.log('Keine Rezepte im Menüplan gefunden');
            return;
        }
        
        const result = await loadRezepte(recipeIds);
        
        if (result.success) {
            // Rezepte in Cache speichern
            result.rezepte.forEach(rezept => {
                rezepteCache[rezept.id] = rezept;
            });
            console.log(`📋 ${result.rezepte.length} Rezepte in Cache geladen`);
        }
        
    } catch (error) {
        console.error('Fehler beim Laden der Rezepte:', error);
        // Nicht kritisch - weitermachen ohne Details
    }
}

/**
 * Rendert den Menüplan basierend auf Bildschirmgröße
 */
function renderMenuplan() {
    if (!currentMenuplan) return;
    
    if (isMobile) {
        renderMobileAccordion();
    } else {
        renderDesktopGrid();
    }
}

/**
 * Rendert die mobile Accordion-Ansicht
 */
function renderMobileAccordion() {
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
        
        const isExpanded = index === 0; // Ersten Tag standardmäßig öffnen
        
        accordionHtml += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-${dayKey}">
                    <button 
                        class="accordion-button ${isExpanded ? '' : 'collapsed'}" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#collapse-${dayKey}"
                        aria-expanded="${isExpanded}" 
                        aria-controls="collapse-${dayKey}"
                    >
                        <div class="w-100 d-flex justify-content-between align-items-center">
                            <span class="fw-bold">${dayNames[index]}</span>
                            <small class="text-muted">${dateStr}</small>
                        </div>
                    </button>
                </h2>
                <div 
                    id="collapse-${dayKey}" 
                    class="accordion-collapse collapse ${isExpanded ? 'show' : ''}"
                    aria-labelledby="heading-${dayKey}"
                    data-bs-parent="#mobile-menu-accordion"
                >
                    <div class="accordion-body">
                        ${renderMobileDayContent(dayData.Mahlzeiten || dayData, kategorien, dayKey)}
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
 * @param {string[]} categories - Kategorien
 * @returns {string} HTML für Tag-Inhalt
 */
function renderMobileDayContent(dayData, categories, dayKey) {
    if (!dayData || !categories) return '';
    
    const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const dayIndex = days.indexOf(dayKey);
    const monday = getMondayOfWeek(currentYear, currentWeek);
    const dayDate = new Date(monday.getTime() + dayIndex * 24 * 60 * 60 * 1000);
    
    // Prüfe ob die aktuelle Einrichtung an diesem Tag Essen bekommt
    const hatEssenAmTag = currentEinrichtung && currentEinrichtung.speiseplan && 
                         currentEinrichtung.speiseplan[dayKey] &&
                         (currentEinrichtung.speiseplan[dayKey].suppe || 
                          currentEinrichtung.speiseplan[dayKey].hauptspeise || 
                          currentEinrichtung.speiseplan[dayKey].dessert);
    
    // Für mobile: Tage ohne Essen gar nicht anzeigen
    if (!hatEssenAmTag) {
        return '';
    }
    
    let html = '';
    
    // Kategorien durchgehen
    Object.entries(categories).forEach(([categoryKey, categoryInfo]) => {
        const recipes = dayData[categoryKey] || [];
        const hasRecipes = recipes && recipes.length > 0;
        
        // Prüfe ob diese Kategorie für die Einrichtung relevant ist
        const istKategorieRelevant = istKategorieRelevantFuerEinrichtung(categoryKey, dayKey);
        if (!istKategorieRelevant) return;
        
        html += `
            <div class="category-section mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="category-title mb-0">
                        <i class="${categoryInfo.icon} me-2"></i>
                        ${categoryInfo.name}
                    </h6>
                    ${renderBewertungButton(dayKey, categoryKey, recipes, dayDate)}
                </div>
                
                <div class="recipe-content">
                    ${renderRecipeList(recipes)}
                </div>
                
                ${renderBestellungFields(dayKey, categoryKey, recipes)}
            </div>
        `;
    });
    
    return html;
}

/**
 * Rendert die Desktop-Grid-Ansicht
 */
function renderDesktopGrid() {
    if (!currentMenuplan || !portalStammdaten) return;
    
    const container = document.getElementById('desktop-grid');
    if (!container) return;
    
    const kategorien = extractVisibleCategories();
    const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    
    let gridHtml = `
        <div class="grid-container">
            <div class="grid-header">
                <div class="grid-header-cell time-cell">Kategorie</div>
    `;
    
    // Tages-Header mit Datum
    days.forEach((dayKey, index) => {
        const monday = getMondayOfWeek(currentYear, currentWeek);
        const dayDate = new Date(monday.getTime() + index * 24 * 60 * 60 * 1000);
        const dateStr = formatDate(dayDate);
        
        // Prüfe ob die Einrichtung an diesem Tag Essen bekommt
        const hatEssenAmTag = currentEinrichtung && currentEinrichtung.speiseplan && 
                             currentEinrichtung.speiseplan[dayKey] &&
                             (currentEinrichtung.speiseplan[dayKey].suppe || 
                              currentEinrichtung.speiseplan[dayKey].hauptspeise || 
                              currentEinrichtung.speiseplan[dayKey].dessert);
        
        const dayClass = hatEssenAmTag ? '' : 'no-food-day';
        
        gridHtml += `
            <div class="grid-header-cell day-header ${dayClass}">
                <div class="day-name">${dayNames[index]}</div>
                <div class="day-date">${dateStr}</div>
                ${!hatEssenAmTag ? '<div class="no-food-label">Kein Essen</div>' : ''}
            </div>
        `;
    });
    
    gridHtml += '</div>';
    
    // Kategorien-Zeilen
    Object.entries(kategorien).forEach(([categoryKey, categoryInfo]) => {
        gridHtml += `
            <div class="grid-row" data-kategorie="${categoryKey}">
                <div class="grid-category-cell">
                    <i class="${categoryInfo.icon} me-2"></i>
                    ${categoryInfo.name}
                </div>
        `;
        
        days.forEach((dayKey, dayIndex) => {
            const dayData = currentMenuplan.days[dayKey];
            const recipes = dayData ? (dayData.Mahlzeiten ? dayData.Mahlzeiten[categoryKey] : dayData[categoryKey]) || [] : [];
            
            const monday = getMondayOfWeek(currentYear, currentWeek);
            const dayDate = new Date(monday.getTime() + dayIndex * 24 * 60 * 60 * 1000);
            
            // Prüfe ob die Einrichtung an diesem Tag Essen bekommt
            const hatEssenAmTag = currentEinrichtung && currentEinrichtung.speiseplan && 
                                 currentEinrichtung.speiseplan[dayKey] &&
                                 (currentEinrichtung.speiseplan[dayKey].suppe || 
                                  currentEinrichtung.speiseplan[dayKey].hauptspeise || 
                                  currentEinrichtung.speiseplan[dayKey].dessert);
            
            // Prüfe ob diese Kategorie für die Einrichtung relevant ist
            const istKategorieRelevant = istKategorieRelevantFuerEinrichtung(categoryKey, dayKey);
            
            const cellClass = `grid-content-cell ${!hatEssenAmTag ? 'no-food-day' : ''} ${!istKategorieRelevant ? 'category-not-relevant' : ''}`;
            const showBewertungButton = hatEssenAmTag && istKategorieRelevant && recipes.length > 0;
            
            gridHtml += `
                <div class="${cellClass}" data-day="${dayKey}" data-kategorie="${categoryKey}">
                    <div class="recipe-content">
                        ${renderRecipeList(recipes)}
                    </div>
                    ${showBewertungButton ? renderBewertungButton(dayKey, categoryKey, recipes, dayDate) : ''}
                    ${renderBestellungFields(dayKey, categoryKey, recipes)}
                </div>
            `;
        });
        
        gridHtml += '</div>';
    });
    
    gridHtml += '</div>';
    container.innerHTML = gridHtml;
}

/**
 * Rendert eine Liste von Rezepten
 * @param {object[]} recipes - Array von Rezepten
 * @returns {string} HTML für Rezepte
 */
function renderRecipeList(recipes) {
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
 * Setup Event-Listener für mobile Accordion
 */
function setupMobileAccordionEvents() {
    document.querySelectorAll('.day-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const dayKey = header.dataset.day;
            const content = document.querySelector(`.day-content[data-day="${dayKey}"]`);
            const isExpanded = header.classList.contains('expanded');
            
            if (isExpanded) {
                // Schließen
                header.classList.remove('expanded');
                content.classList.remove('expanded');
            } else {
                // Öffnen
                header.classList.add('expanded');
                content.classList.add('expanded');
            }
        });
    });
}

/**
 * Aktualisiert die Mobile-Detection
 */
function updateMobileDetection() {
    isMobile = window.innerWidth <= 768;
}

/**
 * Aktualisiert die Wochen-Anzeige
 */
function updateWeekDisplay() {
    const display = document.getElementById('week-display');
    if (display) {
        const monday = getMondayOfWeek(currentYear, currentWeek);
        const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        display.innerHTML = `
            <strong>KW ${currentWeek}/${currentYear}</strong><br>
            <small class="text-muted">${formatDate(monday)} - ${formatDate(sunday)}</small>
        `;
    }
}

/**
 * Druckfunktion für den Menüplan
 */
function printMenuplan() {
    if (!currentMenuplan || !currentEinrichtung) {
        showToast('Kein Menüplan zum Drucken verfügbar', 'error');
        return;
    }
    
    // Zusätzliche Informationen in den Titel
    const originalTitle = document.title;
    document.title = `Menüplan KW ${currentWeek}/${currentYear} - ${currentEinrichtung.name}`;
    
    window.print();
    
    // Titel zurücksetzen
    setTimeout(() => {
        document.title = originalTitle;
    }, 100);
}

/**
 * PDF-Export (vereinfacht)
 */
function exportToPDF() {
    if (!currentMenuplan || !currentEinrichtung) {
        showToast('Kein Menüplan zum Exportieren verfügbar', 'error');
        return;
    }
    
    // Vereinfachter PDF-Export über Browser-Druckfunktion
    showToast('PDF-Export: Bitte "Als PDF speichern" im Druckdialog wählen', 'info');
    printMenuplan();
}

/**
 * Loading-Spinner anzeigen
 */
function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    const wrapper = document.getElementById('menue-portal-wrapper');
    
    if (spinner) spinner.style.display = 'flex';
    if (wrapper) wrapper.style.display = 'none';
}

/**
 * Loading-Spinner ausblenden
 */
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    const wrapper = document.getElementById('menue-portal-wrapper');
    
    if (spinner) spinner.style.display = 'none';
    if (wrapper) wrapper.style.display = 'block';
}

/**
 * Fehlermeldung anzeigen
 * @param {string} message - Fehlermeldung
 */
function showError(message) {
    hideLoading();
    
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    showToast(message, 'error');
}

/**
 * Hilfsfunktion: Kalenderwoche berechnen
 * @param {Date} date - Datum
 * @returns {number} Kalenderwoche
 */
function getWeekNumber(date) {
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstJan) / 86400000;
    return Math.ceil((pastDaysOfYear + firstJan.getDay() + 1) / 7);
}

/**
 * Hilfsfunktion: Anzahl Wochen im Jahr
 * @param {number} year - Jahr
 * @returns {number} Anzahl Wochen
 */
function getWeeksInYear(year) {
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    return getWeekNumber(dec31);
}

/**
 * Rendert einen Bewertungs-Button für eine Kategorie
 * @param {string} dayKey - Wochentag-Key
 * @param {string} categoryKey - Kategorie-Key
 * @param {object[]} recipes - Rezepte der Kategorie
 * @param {Date} dayDate - Datum des Tages (optional, wird berechnet falls nicht gegeben)
 * @returns {string} HTML für Bewertungs-Button
 */
function renderBewertungButton(dayKey, categoryKey, recipes, dayDate = null) {
    if (!currentUser || !recipes || recipes.length === 0) {
        return '';
    }
    
    // Datum berechnen falls nicht gegeben
    if (!dayDate) {
        const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
        const dayIndex = days.indexOf(dayKey);
        const monday = getMondayOfWeek(currentYear, currentWeek);
        dayDate = new Date(monday.getTime() + dayIndex * 24 * 60 * 60 * 1000);
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
 * Handler für Bewertungs-Button Clicks
 * @param {string} dayKey - Wochentag-Key
 * @param {string} categoryKey - Kategorie-Key
 * @param {string[]} rezeptNamen - Namen der Rezepte
 * @param {string} dateString - ISO-String des Datums
 */
function handleBewertungClick(dayKey, categoryKey, rezeptNamen, dateString) {
    const dayDate = new Date(dateString);
    
    console.log('🎯 Bewertungs-Button geklickt:', {
        tag: dayKey,
        kategorie: categoryKey,
        rezepte: rezeptNamen,
        datum: dayDate
    });
    
    // Modal öffnen
    openBewertungModal(dayKey, categoryKey, rezeptNamen, dayDate);
}

// Globale Handler-Funktion für onclick-Attribute verfügbar machen
window.handleBewertungClick = handleBewertungClick;

/**
 * Prüft ob eine Kategorie für die aktuelle Einrichtung relevant ist
 * @param {string} categoryKey - Kategorie-Schlüssel
 * @param {string} dayKey - Wochentag-Schlüssel
 * @returns {boolean} Ob die Kategorie relevant ist
 */
function istKategorieRelevantFuerEinrichtung(categoryKey, dayKey) {
    if (!currentEinrichtung || !currentMenuplan) {
        console.log(`❌ Keine Einrichtung oder Menüplan für ${categoryKey}/${dayKey}`);
        return false;
    }
    
    // Interne Einrichtungen sehen alle Kategorien
    if (currentEinrichtung.isIntern) {
        console.log(`✅ ${categoryKey}/${dayKey}: Interne Einrichtung - alle Kategorien sichtbar`);
        return true;
    }
    
    // Externe Einrichtungen: Prüfe Portal-Stammdaten
    const personengruppe = currentEinrichtung.personengruppe;
    let regelKey = 'extern'; // Standard für externe
    
    console.log(`🔍 ${categoryKey}/${dayKey}: Personengruppe = ${personengruppe}`);
    
    // Spezielle Regeln für Schulen und Kindergärten
    if (portalStammdaten?.personengruppen_mapping?.mapping) {
        const mapping = portalStammdaten.personengruppen_mapping.mapping;
        if (mapping[personengruppe]) {
            regelKey = mapping[personengruppe];
            console.log(`🎯 ${categoryKey}/${dayKey}: Spezielle Regel = ${regelKey}`);
        }
    }
    
    // Für Schulen und Kindergärten: Prüfe Zuweisungen in KW.json
    if (regelKey === 'schule' || regelKey === 'kindergarten') {
        const dayData = currentMenuplan.days[dayKey];
        if (dayData && dayData.Zuweisungen && dayData.Zuweisungen[categoryKey]) {
            const isAssigned = dayData.Zuweisungen[categoryKey].includes(currentEinrichtung.id);
            console.log(`📚 ${categoryKey}/${dayKey}: Zuweisungs-Check = ${isAssigned}`, dayData.Zuweisungen[categoryKey]);
            return isAssigned;
        }
        console.log(`❌ ${categoryKey}/${dayKey}: Keine Zuweisungen gefunden`);
        return false;
    }
    
    // Für andere externe: Prüfe sichtbare Kategorien
    const sichtbareKategorien = portalStammdaten?.einrichtungsregeln?.regeln?.[regelKey]?.sichtbare_kategorien || [];
    const isVisible = sichtbareKategorien.includes(categoryKey);
    console.log(`👁️ ${categoryKey}/${dayKey}: Sichtbare Kategorien Check = ${isVisible}`, sichtbareKategorien);
    
    return isVisible;
}

/**
 * Extrahiert die sichtbaren Kategorien für die aktuelle Einrichtung
 * @returns {object} Kategorien mit Namen und Icons
 */
function extractVisibleCategories() {
    if (!portalStammdaten || !currentMenuplan) return {};
    
    const kategorien = {};
    
    // Alle verfügbaren Kategorien aus dem Menüplan sammeln
    const allCategories = new Set();
    Object.values(currentMenuplan.days).forEach(dayData => {
        if (dayData.Mahlzeiten) {
            Object.keys(dayData.Mahlzeiten).forEach(cat => allCategories.add(cat));
        } else {
            Object.keys(dayData).forEach(cat => allCategories.add(cat));
        }
    });
    
    // Debug-Ausgabe
    console.log('🔍 Alle gefundenen Kategorien:', Array.from(allCategories));
    console.log('🏢 Aktuelle Einrichtung:', currentEinrichtung);
    
    // Nur relevante Kategorien für die Einrichtung zurückgeben
    allCategories.forEach(categoryKey => {
        // Prüfe für mindestens einen Tag ob die Kategorie relevant ist
        const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
        const istRelevant = days.some(dayKey => istKategorieRelevantFuerEinrichtung(categoryKey, dayKey));
        
        console.log(`📋 Kategorie ${categoryKey} relevant:`, istRelevant);
        
        if (istRelevant) {
            kategorien[categoryKey] = {
                name: getCategoryName(categoryKey, portalStammdaten),
                icon: getCategoryIcon(categoryKey, portalStammdaten)
            };
        }
    });
    
    console.log('✅ Finale Kategorien:', kategorien);
    return kategorien;
}

/**
 * Rendert Bestellfelder für externe Einrichtungen
 * @param {string} dayKey - Wochentag-Schlüssel
 * @param {string} categoryKey - Kategorie-Schlüssel  
 * @param {object[]} recipes - Rezepte der Kategorie
 * @returns {string} HTML für Bestellfelder
 */
function renderBestellungFields(dayKey, categoryKey, recipes) {
    // Nur für externe Einrichtungen
    if (!currentEinrichtung || currentEinrichtung.isIntern || !recipes || recipes.length === 0) {
        return '';
    }
    
    // Nur für Hauptspeisen (menu1, menu2) Bestellfelder anzeigen
    if (!['menu1', 'menu2'].includes(categoryKey)) {
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

/**
 * Handler für Bestellungs-Änderungen
 * @param {HTMLElement} input - Input-Element
 */
function handleBestellungChange(input) {
    const dayKey = input.dataset.day;
    const categoryKey = input.dataset.kategorie;
    const gruppe = input.dataset.gruppe;
    const anzahl = parseInt(input.value) || 0;
    
    console.log('🛒 Bestellung geändert:', {
        tag: dayKey,
        kategorie: categoryKey,
        gruppe: gruppe,
        anzahl: anzahl
    });
    
    // Automatische Suppe/Dessert-Berechnung triggern
    updateAutomaticBestellungen(dayKey, categoryKey, gruppe, anzahl);
    
    // TODO: Bestellung speichern/validieren
}

/**
 * Aktualisiert automatische Bestellungen für Suppe und Dessert
 * @param {string} dayKey - Wochentag-Schlüssel
 * @param {string} categoryKey - Hauptspeise-Kategorie
 * @param {string} gruppe - Gruppenname
 * @param {number} anzahl - Bestellte Anzahl
 */
function updateAutomaticBestellungen(dayKey, categoryKey, gruppe, anzahl) {
    if (!currentEinrichtung || !currentEinrichtung.speiseplan) return;
    
    const speiseplan = currentEinrichtung.speiseplan[dayKey];
    if (!speiseplan) return;
    
    // Automatische Suppe-Bestellung
    if (speiseplan.suppe) {
        const suppeInput = document.querySelector(
            `input[data-day="${dayKey}"][data-kategorie="suppe"][data-gruppe="${gruppe}"]`
        );
        if (suppeInput) {
            suppeInput.value = anzahl;
            console.log(`🥣 Automatische Suppe-Bestellung: ${anzahl} für ${gruppe}`);
        }
    }
    
    // Automatische Dessert-Bestellung  
    if (speiseplan.dessert) {
        const dessertInput = document.querySelector(
            `input[data-day="${dayKey}"][data-kategorie="dessert"][data-gruppe="${gruppe}"]`
        );
        if (dessertInput) {
            dessertInput.value = anzahl;
            console.log(`🍰 Automatische Dessert-Bestellung: ${anzahl} für ${gruppe}`);
        }
    }
}

// Globale Handler-Funktionen verfügbar machen
window.handleBestellungChange = handleBestellungChange;