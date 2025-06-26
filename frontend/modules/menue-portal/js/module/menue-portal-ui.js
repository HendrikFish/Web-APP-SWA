// menue-portal-ui.js - REFAKTORIERTE UI-Funktionen für das Menü-Portal
// Orchestriert Mobile Accordion, Desktop Calendar und Bestellfunktionalität

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
import { renderMobileAccordion } from './mobile-accordion-handler.js';
import { renderDesktopCalendar } from './desktop-calendar-handler.js';
import { 
    handleBestellungChange, 
    loadBestellungenFromStorage, 
    loadBestellungenIntoUI,
    exportBestellungen,
    clearBestellungen,
    validateBestellungen 
} from './bestellung-handler.js';

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
        window.currentUser = user; // Global verfügbar für Module
        
        // Portal-Stammdaten laden
        const stammdatenResult = await loadPortalStammdaten();
        if (stammdatenResult.success) {
            portalStammdaten = stammdatenResult.stammdaten;
            console.log('✅ Portal-Stammdaten geladen:', portalStammdaten);
        } else {
            console.warn('⚠️ Portal-Stammdaten konnten nicht geladen werden, verwende Fallback');
            // Fallback-Stammdaten
            portalStammdaten = {
                kategorien: {
                    'suppe': { name: 'Suppe', icon: 'bowl-hot' },
                    'menu1': { name: 'Menü 1', icon: 'egg-fried' }, 
                    'menu2': { name: 'Menü 2', icon: 'fish' },
                    'menu': { name: 'Hauptspeise', icon: 'egg-fried' },
                    'dessert': { name: 'Dessert', icon: 'cake' },
                    'abend': { name: 'Abendessen', icon: 'moon-stars' }
                }
            };
        }
        
        // Mobile Detection
        updateMobileDetection();
        
        // Loading ausblenden
        hideLoading();
        
        // Bestellungen aus localStorage laden
        loadBestellungenFromStorage();
        
        // Einrichtungs-Selector setup
        setupEinrichtungsSelector(einrichtungen);
        
        // Controls setup
        setupControls();
        
        // Layout Event-Listener
        setupLayoutEventListeners();
        
        // Standard-Einrichtung wählen und Menüplan laden
        currentEinrichtung = getDefaultEinrichtung();
        if (currentEinrichtung) {
            window.currentEinrichtung = currentEinrichtung; // Global verfügbar
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
        const typeLabel = currentEinrichtung.isIntern ? 'Intern' : 'Extern';
        const typeColor = currentEinrichtung.isIntern ? 'bg-info' : 'bg-success';
        
        infoElement.innerHTML = `
            <i class="bi bi-building"></i>
            <strong>${currentEinrichtung.name}</strong>
            <span class="badge bg-secondary ms-2">${currentEinrichtung.kuerzel}</span>
            <span class="badge ${typeColor} ms-1">${typeLabel}</span>
        `;
    }
    
    // Wenn nur eine Einrichtung: Selector ausblenden
    if (einrichtungen.length <= 1) {
        container.style.display = 'none';
        return;
    }
    
    // Buttons für jede Einrichtung erstellen
    const buttonsHtml = einrichtungen.map(einrichtung => {
        const typeLabel = einrichtung.isIntern ? 'Intern' : 'Extern';
        const typeColor = einrichtung.isIntern ? 'info' : 'success';
        
        return `
            <button 
                type="button" 
                class="btn btn-outline-primary einrichtung-btn" 
                data-einrichtung-id="${einrichtung.id}"
            >
                ${einrichtung.name}
                <span class="badge bg-light text-dark ms-1">${einrichtung.kuerzel}</span>
                <span class="badge bg-${typeColor} ms-1">${typeLabel}</span>
            </button>
        `;
    }).join('');
    
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
 * Setup der Steuerelemente (Wochennavigation + Bestellaktionen)
 */
function setupControls() {
    // Wochennavigation
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const currentWeekBtn = document.getElementById('current-week');
    
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
    
    // Bestellaktionen für externe Einrichtungen
    setupBestellControls();
    
    // Aktuelle Woche anzeigen
    updateWeekDisplay();
}

/**
 * Setup für Bestellungs-Controls (nur bei externen Einrichtungen)
 */
function setupBestellControls() {
    if (!currentEinrichtung || currentEinrichtung.isIntern) {
        // Bestellkontrollen ausblenden
        const bestellContainer = document.getElementById('bestellung-controls');
        if (bestellContainer) bestellContainer.style.display = 'none';
        return;
    }
    
    const bestellContainer = document.getElementById('bestellung-controls');
    if (!bestellContainer) return;
    
    bestellContainer.style.display = 'block';
    bestellContainer.innerHTML = `
        <div class="card border-success">
            <div class="card-body">
                <h6 class="card-title text-success">
                    <i class="bi bi-cart-check-fill me-2"></i>
                    Bestellungen für KW ${currentWeek}/${currentYear}
                </h6>
                <div class="btn-group-sm d-flex gap-2" role="group">
                    <button type="button" class="btn btn-outline-success" id="export-bestellungen">
                        <i class="bi bi-download me-1"></i>
                        Exportieren
                    </button>
                    <button type="button" class="btn btn-outline-warning" id="clear-bestellungen">
                        <i class="bi bi-trash me-1"></i>
                        Löschen
                    </button>
                    <button type="button" class="btn btn-outline-info" id="validate-bestellungen">
                        <i class="bi bi-check-circle me-1"></i>
                        Prüfen
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Event-Listener für Bestellaktionen
    document.getElementById('export-bestellungen')?.addEventListener('click', exportCurrentBestellungen);
    document.getElementById('clear-bestellungen')?.addEventListener('click', clearCurrentBestellungen);
    document.getElementById('validate-bestellungen')?.addEventListener('click', validateCurrentBestellungen);
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
    
    // Window Resize
    window.addEventListener('resize', () => {
        updateMobileDetection();
        renderMenuplan();
    });
}

/**
 * Wechselt zu einer anderen Einrichtung
 * @param {string} einrichtungId - ID der neuen Einrichtung
 */
async function switchEinrichtung(einrichtungId) {
    try {
        showLoading();
        
        // Neue Einrichtung aus allen verfügbaren holen
        const alleEinrichtungen = await getAllEinrichtungen();
        const neueEinrichtung = alleEinrichtungen.find(e => e.id === einrichtungId);
        
        if (!neueEinrichtung) {
            throw new Error('Einrichtung nicht gefunden');
        }
        
        currentEinrichtung = neueEinrichtung;
        window.currentEinrichtung = neueEinrichtung; // Global verfügbar
        
        // UI-Buttons aktualisieren
        document.querySelectorAll('.einrichtung-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-einrichtung-id="${einrichtungId}"]`)?.classList.add('active');
        
        // Einrichtungs-Info aktualisieren
        setupEinrichtungsSelector(await getAllEinrichtungen());
        
        // Bestellkontrollen aktualisieren
        setupBestellControls();
        
        // Menüplan neu laden
        await loadAndDisplayMenuplan();
        
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
 */
async function navigateWeek(direction) {
    try {
        showLoading();
        
        currentWeek += direction;
        
        // Jahr-Grenze prüfen
        if (currentWeek < 1) {
            currentYear--;
            currentWeek = getWeeksInYear(currentYear);
        } else if (currentWeek > getWeeksInYear(currentYear)) {
            currentYear++;
            currentWeek = 1;
        }
        
        // Globale Variablen aktualisieren
        window.currentWeek = currentWeek;
        window.currentYear = currentYear;
        
        updateWeekDisplay();
        setupBestellControls(); // Bestellkontrollen aktualisieren
        await loadAndDisplayMenuplan();
        
    } catch (error) {
        console.error('Fehler bei Wochennavigation:', error);
        showToast('Fehler beim Laden der Woche', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Springt zur aktuellen Woche
 */
async function navigateToCurrentWeek() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentWeek = getWeekNumber(now);
    
    window.currentWeek = currentWeek;
    window.currentYear = currentYear;
    
    updateWeekDisplay();
    setupBestellControls();
    await loadAndDisplayMenuplan();
}

/**
 * Lädt und zeigt den Menüplan an
 */
async function loadAndDisplayMenuplan() {
    try {
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
        
        // Rezepte laden
        await loadMenuplanRecipes();
        
        // UI rendern
        renderMenuplan();
        
        // Bestellungen laden (falls externe Einrichtung)
        if (!currentEinrichtung.isIntern) {
            const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
            loadBestellungenIntoUI(wochenschluessel);
        }
        
        console.log('✅ Menüplan geladen und dargestellt');
        
    } catch (error) {
        console.error('❌ Fehler beim Laden des Menüplans:', error);
        showError(error.message);
    }
}

/**
 * Lädt alle Rezepte für den aktuellen Menüplan
 */
async function loadMenuplanRecipes() {
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
            console.log(`✅ ${Object.keys(rezepteCache).length} Rezepte geladen`);
        } else {
            console.warn('⚠️ Fehler beim Laden der Rezepte:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Rezepte:', error);
    }
}

/**
 * Rendert den Menüplan basierend auf Bildschirmgröße
 */
function renderMenuplan() {
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
            istKategorieRelevantFuerEinrichtung,
            extractVisibleCategories
        );
    } else {
        renderDesktopCalendar(
            currentMenuplan, 
            portalStammdaten, 
            currentEinrichtung, 
            currentYear, 
            currentWeek, 
            rezepteCache,
            istKategorieRelevantFuerEinrichtung,
            extractVisibleCategories
        );
    }
}

/**
 * Prüft ob eine Kategorie für die aktuelle Einrichtung relevant/sichtbar ist
 * @param {string} categoryKey - Kategorie-Schlüssel
 * @param {string} dayKey - Tag-Schlüssel
 * @returns {boolean} True wenn Kategorie angezeigt werden soll
 */
/**
 * Prüft ob eine Einrichtung eine Kategorie an einem Tag zugewiesen bekommen hat
 * @param {string} categoryKey - Kategorie-Schlüssel (z.B. 'menu1', 'dessert')
 * @param {string} dayKey - Tag-Schlüssel (z.B. 'montag', 'dienstag')
 * @param {string} einrichtungId - ID der Einrichtung
 * @returns {boolean} True wenn Einrichtung diese Kategorie zugewiesen bekommen hat
 */
function istKategorieZugewiesen(categoryKey, dayKey, einrichtungId) {
    if (!currentMenuplan || !currentMenuplan.days || !currentMenuplan.days[dayKey]) {
        return false;
    }
    
    const dayData = currentMenuplan.days[dayKey];
    const zuweisungen = dayData.Zuweisungen || {};
    
    // Für zusammengefasste "hauptspeise": prüfe menu1 ODER menu2
    if (categoryKey === 'hauptspeise') {
        const menu1Zuweisungen = zuweisungen['menu1'] || [];
        const menu2Zuweisungen = zuweisungen['menu2'] || [];
        return menu1Zuweisungen.includes(einrichtungId) || menu2Zuweisungen.includes(einrichtungId);
    }
    
    // Für normale Kategorien
    const kategorieZuweisungen = zuweisungen[categoryKey] || [];
    return kategorieZuweisungen.includes(einrichtungId);
}

function istKategorieRelevantFuerEinrichtung(categoryKey, dayKey, isMobile = false) {
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
 * @returns {object} Sichtbare Kategorien in der richtigen Reihenfolge
 */
function extractVisibleCategories() {
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

// === Bestellaktionen ===

function exportCurrentBestellungen() {
    const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
    const exportData = exportBestellungen(wochenschluessel);
    
    if (!exportData) {
        showToast('Keine Bestellungen zum Exportieren', 'warning');
        return;
    }
    
    // JSON-Download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bestellungen-${currentEinrichtung.kuerzel}-KW${currentWeek}-${currentYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Bestellungen exportiert', 'success');
}

function clearCurrentBestellungen() {
    if (!confirm('Alle Bestellungen für diese Woche löschen?')) return;
    
    const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
    clearBestellungen(wochenschluessel);
    
    // UI neu rendern
    renderMenuplan();
}

function validateCurrentBestellungen() {
    const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
    const validation = validateBestellungen(wochenschluessel);
    
    if (validation.valid) {
        showToast('Alle Bestellungen sind gültig', 'success');
    } else {
        let message = 'Bestellprobleme gefunden:\n';
        validation.errors.forEach(error => message += `- ${error}\n`);
        if (validation.warnings.length > 0) {
            message += '\nWarnungen:\n';
            validation.warnings.forEach(warning => message += `- ${warning}\n`);
        }
        alert(message);
    }
}

// === Layout & Event Listeners ===

function updateMobileDetection() {
    isMobile = window.innerWidth < 768;
    
    // Container sichtbarkeit umschalten
    const mobileContainer = document.getElementById('mobile-accordion');
    const desktopContainer = document.getElementById('desktop-calendar');
    
    if (mobileContainer) mobileContainer.style.display = isMobile ? 'block' : 'none';
    if (desktopContainer) desktopContainer.style.display = isMobile ? 'none' : 'block';
}

function updateWeekDisplay() {
    const weekDisplay = document.getElementById('week-display');
    if (weekDisplay) {
        const monday = getMondayOfWeek(currentYear, currentWeek);
        const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        weekDisplay.textContent = `KW ${currentWeek}/${currentYear} (${formatDate(monday)} - ${formatDate(sunday)})`;
    }
}

// === Hilfsfunktionen ===

function showLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = 'block';
}

function hideLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = 'none';
}

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        errorContainer.style.display = 'block';
    } else {
        showToast(message, 'error');
    }
}

function printMenuplan() {
    window.print();
}

function exportToPDF() {
    showToast('PDF-Export wird implementiert...', 'info');
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

function getWeeksInYear(year) {
    const dec31 = new Date(year, 11, 31);
    return getWeekNumber(dec31);
}

// Global verfügbar machen für Event-Handler
window.handleBewertungClick = function(dayKey, categoryKey, rezeptNamen, dateString) {
    const date = new Date(dateString);
    openBewertungModal(dayKey, categoryKey, rezeptNamen, date);
};

// Module als globale Variablen verfügbar machen
window.currentWeek = currentWeek;
window.currentYear = currentYear;
window.showToast = showToast;
window.istKategorieZugewiesen = istKategorieZugewiesen;