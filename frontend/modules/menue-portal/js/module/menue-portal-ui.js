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

// Globale UI-State
let currentEinrichtung = null;
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
    const container = document.getElementById('mobile-accordion');
    if (!container) return;
    
    const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    // Verwende die sichtbaren Kategorien aus dem Menüplan
    const categories = currentMenuplan.sichtbare_kategorien || ['suppe', 'menu1', 'menu2', 'dessert', 'abend'];
    
    let html = '<div class="mobile-accordion">';
    
    days.forEach((dayKey, index) => {
        const dayData = currentMenuplan.days[dayKey] || {};
        const dayName = getDayName(dayKey);
        const monday = getMondayOfWeek(currentYear, currentWeek);
        const dayDate = new Date(monday.getTime() + index * 24 * 60 * 60 * 1000);
        const formattedDate = formatDate(dayDate);
        
        // Rezepte für diesen Tag zählen
        const recipeCount = categories.reduce((count, cat) => {
            return count + (dayData[cat] || []).length;
        }, 0);
        
        html += `
            <div class="day-accordion-section">
                <div class="day-header" data-day="${dayKey}">
                    <div class="day-title">
                        <span>${dayName}</span>
                        <small class="text-light">${formattedDate}</small>
                        <span class="day-counter">${recipeCount} Rezept${recipeCount !== 1 ? 'e' : ''}</span>
                    </div>
                    <i class="bi bi-chevron-down day-toggle-icon"></i>
                </div>
                
                <div class="day-content" data-day="${dayKey}">
                    ${renderMobileDayContent(dayData, categories)}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Event-Listener für Accordion
    setupMobileAccordionEvents();
}

/**
 * Rendert den Inhalt eines Tages für die mobile Ansicht
 * @param {object} dayData - Daten für den Tag
 * @param {string[]} categories - Kategorien
 * @returns {string} HTML für Tag-Inhalt
 */
function renderMobileDayContent(dayData, categories) {
    let html = '';
    
    categories.forEach(categoryKey => {
        const recipes = dayData[categoryKey] || [];
        const categoryName = getCategoryName(categoryKey, portalStammdaten);
        const categoryIcon = getCategoryIcon(categoryKey, portalStammdaten);
        
        html += `
            <div class="category-section">
                <div class="category-title">
                    <span class="category-icon">${categoryIcon}</span>
                    ${categoryName}
                </div>
                <div class="recipe-list">
                    ${renderRecipeList(recipes)}
                </div>
            </div>
        `;
    });
    
    return html;
}

/**
 * Rendert die Desktop-Grid-Ansicht
 */
function renderDesktopGrid() {
    const container = document.getElementById('desktop-grid');
    if (!container) return;
    
    const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    // Verwende die sichtbaren Kategorien aus dem Menüplan
    const categories = currentMenuplan.sichtbare_kategorien || ['suppe', 'menu1', 'menu2', 'dessert', 'abend'];
    
    let html = '<div class="desktop-grid">';
    
    // Header-Zeile
    html += '<div class="grid-header-cell grid-corner-cell">Kategorie</div>';
    days.forEach((dayKey, index) => {
        const dayName = getDayName(dayKey);
        const monday = getMondayOfWeek(currentYear, currentWeek);
        const dayDate = new Date(monday.getTime() + index * 24 * 60 * 60 * 1000);
        const formattedDate = formatDate(dayDate);
        
        html += `
            <div class="grid-header-cell">
                <div>${dayName}</div>
                <small class="text-muted">${formattedDate}</small>
            </div>
        `;
    });
    
    // Content-Zeilen
    categories.forEach(categoryKey => {
        const categoryName = getCategoryName(categoryKey, portalStammdaten);
        const categoryIcon = getCategoryIcon(categoryKey, portalStammdaten);
        
        // Kategorie-Spalte
        html += `
            <div class="grid-kategorie-cell">
                <span style="margin-right: 8px;">${categoryIcon}</span>
                ${categoryName}
            </div>
        `;
        
        // Tag-Spalten
        days.forEach(dayKey => {
            const dayData = currentMenuplan.days[dayKey] || {};
            const recipes = dayData[categoryKey] || [];
            
            html += `
                <div class="grid-content-cell">
                    <div class="recipe-list">
                        ${renderRecipeList(recipes)}
                    </div>
                </div>
            `;
        });
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Rendert eine Liste von Rezepten
 * @param {object[]} recipes - Array von Rezepten
 * @returns {string} HTML für Rezepte
 */
function renderRecipeList(recipes) {
    if (!recipes || recipes.length === 0) {
        return '<div class="empty-category">Keine Rezepte</div>';
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