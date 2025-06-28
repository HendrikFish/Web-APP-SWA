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
import { initInformationModal, openNewInformationModal, openInformationManagementModal } from './informationen-modal.js';
import { getInformationen } from './informationen-api.js';
import { renderMobileAccordion } from './mobile-accordion-handler.js';
import { renderDesktopCalendar } from './desktop-calendar-handler.js';
import { 
    handleBestellungChange, 
    loadBestellungenFromAPI, 
    loadBestellungenIntoUI,
    exportBestellungen,
    clearBestellungen,
    validateBestellungen 
} from './bestellung-handler.js';

// Globale UI-State
let currentEinrichtung = null;
let currentUser = null;

// ISO 8601-konforme Initialisierung
const currentISOWeek = (() => {
    const now = new Date();
    const d = new Date(now.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 1);
    const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return { year: d.getFullYear(), week: weekNumber };
})();

let currentYear = currentISOWeek.year;
let currentWeek = currentISOWeek.week;
let currentMenuplan = null;
let rezepteCache = {};
let isMobile = false;
let portalStammdaten = null;
let eventListenersInitialized = false; // Flag um mehrfache Event-Listener zu verhindern
let loadMenuplanTimeout = null; // Debouncing für loadAndDisplayMenuplan
let bestellControlsInitialized = false; // Flag für Bestellkontrollen Event-Listener
let currentInformationenData = {}; // Informationsdaten für aktuelle Woche
window.currentInformationenData = currentInformationenData; // Global verfügbar

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
        
        // Einrichtungs-Selector setup
        setupEinrichtungsSelector(einrichtungen);
        
        // Controls setup
        setupControls();
        
        // Layout Event-Listener
        setupLayoutEventListeners();
        
        // Informations Event-Listener
        setupInformationEventListeners();
        
        // Standard-Einrichtung wählen und Menüplan laden
        currentEinrichtung = getDefaultEinrichtung();
        console.log('🏢 Standard-Einrichtung ermittelt:', currentEinrichtung ? 
            `${currentEinrichtung.name} (ID: ${currentEinrichtung.id})` : 
            'KEINE EINRICHTUNG GEFUNDEN');
            
        if (currentEinrichtung) {
            window.currentEinrichtung = currentEinrichtung; // Global verfügbar
            
            // Bestellungen für die gewählte Einrichtung laden
            await loadBestellungenFromAPI();
            
            await loadAndDisplayMenuplan();
            // Bewertungs-Modal nach dem Laden des Menüplans initialisieren
            initBewertungModal(currentUser, currentEinrichtung);
            // Informations-Modal initialisieren
            initInformationModal(currentUser, currentEinrichtung);
        } else {
            console.error('❌ Keine Standard-Einrichtung verfügbar!');
            showError('Keine Einrichtung verfügbar');
        }
        
        console.log('✅ Menü-Portal UI initialisiert');
        
    } catch (error) {
        console.error('❌ Fehler bei UI-Initialisierung:', error);
        showToast('Fehler beim Initialisieren der Benutzeroberfläche', 'error');
    }
}

/**
 * Setup der Einrichtungs-Auswahl (nur einmal aufrufen)
 * @param {object[]} einrichtungen - Verfügbare Einrichtungen
 */
function setupEinrichtungsSelector(einrichtungen) {
    const container = document.getElementById('einrichtungs-selector');
    
    if (!container) return;
    
    // Wenn nur eine Einrichtung: Selector ausblenden
    if (einrichtungen.length <= 1) {
        container.style.display = 'none';
        updateEinrichtungsInfo(); // Info trotzdem aktualisieren
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
                <div class="d-flex align-items-center flex-wrap gap-3">
                    <h6 class="card-title mb-0">
                    <i class="bi bi-building"></i> Einrichtung wählen:
                </h6>
                <div class="btn-group-sm d-flex flex-wrap gap-2" role="group">
                    ${buttonsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Selector anzeigen
    container.style.display = 'block';
    
    // Event-Listener für Einrichtungsauswahl (nur einmal registrieren)
    container.addEventListener('click', async (e) => {
        if (e.target.classList.contains('einrichtung-btn')) {
            const einrichtungId = e.target.dataset.einrichtungId;
            await switchEinrichtung(einrichtungId);
        }
    });
    
    // Aktuelle Einrichtung als aktiv markieren
    updateActiveEinrichtungButton();
    // Einrichtungs-Info aktualisieren
    updateEinrichtungsInfo();
}

/**
 * Aktualisiert nur die Einrichtungs-Info ohne Event-Listener neu zu registrieren
 */
function updateEinrichtungsInfo() {
    const infoElement = document.getElementById('einrichtungs-info');
    
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
}

/**
 * Aktualisiert die aktiven Button-Klassen ohne Event-Listener neu zu registrieren
 */
function updateActiveEinrichtungButton() {
    if (currentEinrichtung) {
        // Alle Buttons deaktivieren
        document.querySelectorAll('.einrichtung-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Aktuellen Button aktivieren
        const activeBtn = document.querySelector(`[data-einrichtung-id="${currentEinrichtung.id}"]`);
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
    // Event-Listener nur einmal in action-buttons-container registrieren
    if (!bestellControlsInitialized) {
        const actionContainer = document.querySelector('.action-buttons-container');
        if (actionContainer) {
            actionContainer.addEventListener('click', (e) => {
            if (e.target.id === 'export-bestellungen') {
                exportCurrentBestellungen();
            } else if (e.target.id === 'clear-bestellungen') {
                clearCurrentBestellungen();
            } else if (e.target.id === 'validate-bestellungen') {
                validateCurrentBestellungen();
            }
        });
        }
        bestellControlsInitialized = true;
        console.log('✅ Bestellkontrollen Event-Listener initialisiert');
    }
    
    // HTML-Inhalt aktualisieren
    updateBestellControlsContent();
}

/**
 * Aktualisiert nur den Inhalt der Bestellkontrollen ohne Event-Listener neu zu registrieren
 */
function updateBestellControlsContent() {
    const actionContainer = document.querySelector('.action-buttons-container .d-flex');
    const bestellContainer = document.getElementById('bestellung-controls');
    
    // Alten bestellung-controls Container ausblenden
    if (bestellContainer) {
        bestellContainer.style.display = 'none';
    }
    
    if (!actionContainer) return;
    
    // Vorhandene Bestellungs-Buttons entfernen
    const existingBestellButtons = actionContainer.querySelectorAll('.bestellung-control-btn');
    existingBestellButtons.forEach(btn => btn.remove());
    
    // Für externe Einrichtungen: Bestellungs-Buttons hinzufügen
    if (currentEinrichtung && !currentEinrichtung.isIntern) {
        const bestellButtons = `
            <div class="d-flex gap-2 me-2 bestellung-control-btn">
                <span class="text-success fw-bold me-2" style="line-height: 2.25rem;">
                    <i class="bi bi-cart-check-fill me-1"></i>
                    KW ${currentWeek}/${currentYear}:
                </span>
                <button type="button" class="btn btn-outline-success btn-sm" id="export-bestellungen">
                        <i class="bi bi-download me-1"></i>
                    Export
                    </button>
                <button type="button" class="btn btn-outline-warning btn-sm" id="clear-bestellungen">
                        <i class="bi bi-trash me-1"></i>
                        Löschen
                    </button>
                <button type="button" class="btn btn-outline-info btn-sm" id="validate-bestellungen">
                        <i class="bi bi-check-circle me-1"></i>
                        Prüfen
                    </button>
        </div>
    `;
        actionContainer.insertAdjacentHTML('afterbegin', bestellButtons);
    }
}

/**
 * Setup der Layout Event-Listener (nur einmal)
 */
function setupLayoutEventListeners() {
    // Verhindere mehrfache Registrierung
    if (eventListenersInitialized) {
        return;
    }
    
    // Resize-Handler
    window.addEventListener('menue-portal:layout-change', () => {
        updateMobileDetection();
        renderMenuplan();
    });
    
    // Window Resize mit Debouncing um Toast-Spam zu verhindern
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateMobileDetection();
            renderMenuplan();
        }, 250); // 250ms Debounce
    });
    
    eventListenersInitialized = true;
    console.log('✅ Layout Event-Listener initialisiert');
}

/**
 * Informations-Event-Listener (nur einmal registrieren)
 */
function setupInformationEventListeners() {
    // Globale Funktion für Information-Click verfügbar machen
    window.handleInformationClick = handleInformationClick;
    
    // Event-Listener für Information-Updates
    window.addEventListener('informationCreated', (e) => {
        // UI neu laden um neue Information anzuzeigen
        loadInformationenData().then(() => {
            renderMenuplan();
        });
    });
    
    window.addEventListener('informationUpdated', (e) => {
        // UI neu laden um aktualisierte Information anzuzeigen
        loadInformationenData().then(() => {
            renderMenuplan();
        });
    });
    
    window.addEventListener('informationDeleted', (e) => {
        // UI neu laden um gelöschte Information zu verstecken
        loadInformationenData().then(() => {
            renderMenuplan();
        });
    });
    
    console.log('📋 Informations-Event-Listener erfolgreich registriert');
}

/**
 * Globale Funktion für Information-Click-Handler
 * @param {string} dayKey - Wochentag-Key
 * @param {string} isoDate - ISO-Datum-String
 */
function handleInformationClick(dayKey, isoDate) {
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
        
        // UI aktualisieren ohne Event-Listener neu zu registrieren
        updateActiveEinrichtungButton();
        updateEinrichtungsInfo();
        
        // Bestellkontrollen aktualisieren
        setupBestellControls();
        
        // Bestellungen für neue Einrichtung laden
        await loadBestellungenFromAPI();
        
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
        
        updateWeekDisplay();
        updateBestellControlsContent(); // Nur Inhalt aktualisieren, nicht Event-Listener
        
        // Bestellungen für neue Woche laden
        if (currentEinrichtung) {
            await loadBestellungenFromAPI();
        }
        
        await loadAndDisplayMenuplan();
        
    } catch (error) {
        console.error('Fehler bei Wochennavigation:', error);
        showToast('Fehler beim Laden der Woche', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Springt zur aktuellen Woche (ISO 8601-konform)
 */
async function navigateToCurrentWeek() {
    try {
        showLoading();
        
    const now = new Date();
        const isoWeek = getISOWeek(now);
        
        // ISO-Jahr und -Woche verwenden (kann vom Kalenderjahr abweichen)
        currentYear = isoWeek.year;
        currentWeek = isoWeek.week;
    
    window.currentWeek = currentWeek;
    window.currentYear = currentYear;
        
        console.log(`📅 Heutige Woche: KW ${currentWeek}/${currentYear}`);
    
    updateWeekDisplay();
    updateBestellControlsContent(); // Nur Inhalt aktualisieren, nicht Event-Listener
        
        // Bestellungen für neue Woche laden
        if (currentEinrichtung) {
            await loadBestellungenFromAPI();
        }
        
    await loadAndDisplayMenuplan();
        
    } catch (error) {
        console.error('Fehler beim Navigieren zur aktuellen Woche:', error);
        showToast('Fehler beim Laden der aktuellen Woche', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Lädt und zeigt den Menüplan an (mit Debouncing)
 */
async function loadAndDisplayMenuplan() {
    // Debouncing um mehrfache schnelle Aufrufe zu verhindern
    if (loadMenuplanTimeout) {
        clearTimeout(loadMenuplanTimeout);
    }
    
    loadMenuplanTimeout = setTimeout(async () => {
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
            
            // Informationen laden
            await loadInformationenData();
            
            // UI rendern
            renderMenuplan();
            
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
 * Lädt Informationen für die aktuelle Woche
 */
async function loadInformationenData() {
    if (!currentEinrichtung || !currentYear || !currentWeek) {
        console.warn('⚠️ Informationen können nicht geladen werden - fehlende Parameter:', {
            currentEinrichtung: !!currentEinrichtung,
            currentYear,
            currentWeek
        });
        currentInformationenData = {};
        window.currentInformationenData = {};
        return;
    }
    
    try {
        console.log(`📋 Lade Informationen für KW ${currentWeek}/${currentYear}, Einrichtung: ${currentEinrichtung.name} (${currentEinrichtung.id})...`);
        
        const result = await getInformationen(currentYear, currentWeek, currentEinrichtung.id);
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
    try {
        // Aktuelle Layout-Einstellungen speichern
        const originalIsMobile = isMobile;
        const mobileContainer = document.getElementById('mobile-accordion');
        const desktopContainer = document.getElementById('desktop-calendar');
        
        // Temporär Desktop-Layout erzwingen
        isMobile = false;
        
        // Desktop-Kalender sichtbar machen und Mobile verstecken
        if (mobileContainer) {
            mobileContainer.style.display = 'none';
        }
        if (desktopContainer) {
            desktopContainer.style.display = 'block';
            desktopContainer.classList.remove('d-none');
        }
        
        // Desktop-Menü rendern - DAS WAR DER FEHLENDE SCHRITT!
        renderMenuplan();
        
        // Kurz warten, damit Layout vollständig gerendert wird
        setTimeout(() => {
            // Drucken
    window.print();
            
            // Nach dem Drucken (oder wenn Druckdialog geschlossen wird) Original-Layout wiederherstellen
            setTimeout(() => {
                isMobile = originalIsMobile;
                updateMobileDetection();
                // Original-Layout auch neu rendern
                renderMenuplan();
            }, 1000);
        }, 200);
        
    } catch (error) {
        console.error('Fehler beim Drucken:', error);
        showToast('Fehler beim Drucken', 'error');
        
        // Bei Fehler sicherstellen, dass Layout wiederhergestellt wird
        updateMobileDetection();
        renderMenuplan();
    }
}

function exportToPDF() {
    try {
        // Aktuelle Layout-Einstellungen speichern
        const originalIsMobile = isMobile;
        const mobileContainer = document.getElementById('mobile-accordion');
        const desktopContainer = document.getElementById('desktop-calendar');
        
        // Desktop-Layout temporär erzwingen
        isMobile = false;
        if (mobileContainer) mobileContainer.style.display = 'none';
        if (desktopContainer) {
            desktopContainer.style.display = 'block';
            desktopContainer.classList.remove('d-none');
        }
        
        // Desktop-Menü rendern
        renderMenuplan();
        
        // Kurz warten für vollständiges Rendering
        setTimeout(() => {
            // CSS-Styles sammeln
            let allCSS = '';
            
            // Bootstrap und andere externe CSS über Links sammeln
            const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
            const linkPromises = Array.from(linkElements).map(link => {
                return fetch(link.href)
                    .then(response => response.text())
                    .catch(() => '');
            });
            
            Promise.all(linkPromises).then(cssTexts => {
                allCSS = cssTexts.join('\n');
                
                // Lokale Stylesheets hinzufügen
                Array.from(document.styleSheets).forEach(sheet => {
                    try {
                        if (sheet.cssRules) {
                            allCSS += Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
                        }
                    } catch (e) {
                        console.warn('Stylesheet nicht zugänglich:', e);
                    }
                });
                
                // HTML-Inhalt für PDF vorbereiten
                const printHTML = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menüplan KW ${currentWeek}/${currentYear} - ${currentEinrichtung?.name || 'Einrichtung'}</title>
    <style>
        ${allCSS}
        
        /* PDF-spezifische Optimierungen */
        @media print {
            body { margin: 0; padding: 20px; }
            * { 
                -webkit-print-color-adjust: exact !important; 
                color-adjust: exact !important; 
                print-color-adjust: exact !important;
            }
        }
        
        /* Inline-Styles für bessere Kompatibilität */
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .navbar { display: none !important; }
        #mobile-accordion { display: none !important; }
        #desktop-calendar { display: block !important; }
    </style>
</head>
<body>
    ${document.body.innerHTML}
    <script>
        // Direkt drucken wenn Seite geladen
        window.onload = function() {
            setTimeout(() => {
                window.print();
                // Fenster nach Druck schließen
                window.onafterprint = function() {
                    window.close();
                };
            }, 500);
        };
    </script>
</body>
</html>`;
                
                // Blob-URL erstellen (moderner Ansatz ohne document.write)
                const blob = new Blob([printHTML], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                
                // Neues Fenster mit Blob-URL öffnen
                const printWindow = window.open(url, '_blank');
                
                if (!printWindow) {
                    showToast('Pop-up wurde blockiert. Bitte erlauben Sie Pop-ups für PDF-Export.', 'warning');
                    URL.revokeObjectURL(url);
                } else {
                    showToast('PDF-Export wird vorbereitet...', 'info');
                    
                    // URL nach 30 Sekunden freigeben
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                    }, 30000);
                }
                
            }).catch(error => {
                console.error('Fehler beim Laden der CSS-Dateien:', error);
                showToast('Fallback: Verwenden Sie den Drucken-Button.', 'warning');
            });
            
            // Original-Layout nach PDF-Export wiederherstellen
            setTimeout(() => {
                isMobile = originalIsMobile;
                updateMobileDetection();
                renderMenuplan();
            }, 1000);
            
        }, 200);
        
    } catch (error) {
        console.error('Fehler beim PDF-Export:', error);
        showToast('Fehler beim PDF-Export. Verwenden Sie den Drucken-Button.', 'error');
        
        // Bei Fehler sicherstellen, dass Layout wiederhergestellt wird
        updateMobileDetection();
        renderMenuplan();
    }
}

/**
 * Berechnet die ISO 8601-konforme Kalenderwoche für ein Datum
 * @param {Date} date - Das Datum
 * @returns {object} Objekt mit { year, week } für korrektes Jahr/Woche-Mapping
 */
function getISOWeek(date) {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    
    // Donnerstag der gleichen Woche finden (ISO 8601: Woche gehört zum Jahr des Donnerstags)
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    
    // 1. Januar im Jahr des Donnerstags
    const week1 = new Date(d.getFullYear(), 0, 1);
    
    // Berechne die Wochennummer
    const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    
    return {
        year: d.getFullYear(),
        week: weekNumber
    };
}

/**
 * Legacy-Funktion für Kompatibilität - gibt nur die Wochennummer zurück
 * @param {Date} date - Das Datum
 * @returns {number} Die Kalenderwoche (1-53)
 */
function getWeekNumber(date) {
    return getISOWeek(date).week;
}

/**
 * Berechnet die Anzahl der Wochen in einem Jahr nach ISO 8601
 * @param {number} year - Das Jahr
 * @returns {number} Die Anzahl der Wochen (52 oder 53)
 */
function getWeeksInYear(year) {
    // Der 4. Januar liegt immer in der ersten Woche des Jahres (ISO 8601)
    const jan4 = new Date(year, 0, 4);
    
    // Der 28. Dezember liegt immer in der letzten Woche des Jahres
    const dec28 = new Date(year, 11, 28);
    
    // Berechne die Woche des 28. Dezember
    const lastWeek = getISOWeek(dec28);
    
    // Wenn das berechnete Jahr des 28.12. dem gewünschten Jahr entspricht,
    // dann ist das die Anzahl der Wochen
    if (lastWeek.year === year) {
        return lastWeek.week;
    }
    
    // Fallback: 52 Wochen (Standard)
    return 52;
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