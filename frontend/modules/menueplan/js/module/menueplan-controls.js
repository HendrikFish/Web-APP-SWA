// menueplan-controls.js
// Verwaltet die Interaktionen der oberen Kontrollleiste (Wochen-Navigation, Rezeptsuche, Aktionen).

import { api } from './menueplan-api.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';
import {
    getState,
    setCurrentDate,
    getCurrentDate,
    getWeekNumber,
    getCurrentPlan,
    setPlan,
    clearCurrentPlan
} from './menueplan-state.js';

let loadAndRenderPlanCallback = () => {};

// --- Rezeptsuche ---

function renderSearchResults(suchergebnisse) {
    const container = document.getElementById('menueplan-suche-ergebnisse');
    container.innerHTML = '';

    if (suchergebnisse.length === 0) {
        container.classList.remove('show');
        return;
    }

    // Zeige maximal 6 Ergebnisse für kompakte Darstellung
    suchergebnisse.slice(0, 2).forEach(rezept => {
        const pill = document.createElement('span');
        pill.className = 'badge bg-primary me-2 mb-2 rezept-pill';
        pill.draggable = true;
        pill.dataset.rezeptId = rezept.id;
        pill.dataset.rezeptName = rezept.name;
        pill.innerHTML = `<i class="bi bi-grip-vertical me-1"></i>${rezept.name}`;
        pill.style.cursor = 'grab';
        container.appendChild(pill);
    });

    container.classList.add('show');
}

function handleSearchInput(e) {
    const { stammdaten } = getState();
    const suchtext = e.target.value.toLowerCase();
    
    if (suchtext.length < 1) {
        renderSearchResults([]);
        return;
    }
    const ergebnisse = stammdaten.rezepte.filter(r => r.name.toLowerCase().includes(suchtext));
    renderSearchResults(ergebnisse);
}

function hideSearchResults() {
    const container = document.getElementById('menueplan-suche-ergebnisse');
    if (container) {
        container.classList.remove('show');
        container.innerHTML = '';
    }
}

function handleClickOutside(e) {
    const searchInput = document.getElementById('menueplan-suche');
    const searchResults = document.getElementById('menueplan-suche-ergebnisse');
    
    // Prüfe ob der Klick außerhalb des Suchbereichs war
    if (searchInput && searchResults && 
        !searchInput.contains(e.target) && 
        !searchResults.contains(e.target)) {
        hideSearchResults();
    }
}

// --- Haupt-Aktionen und Navigation ---

async function saveCurrentPlan() {
    const { year, week } = getWeekNumber(getCurrentDate());
    try {
        const currentPlan = getCurrentPlan();
        const { stammdaten } = getState();
        
        // GESCHÄFTSLOGIK: Snapshot der Einrichtungs-Anrechte hinzufügen
        const planWithSnapshot = {
            ...currentPlan,
            einrichtungsSnapshot: createEinrichtungsSnapshot(stammdaten)
        };
        
        await api.saveMenueplan(year, week, planWithSnapshot);
        showToast('Plan erfolgreich gespeichert.', 'success');
    } catch (error) {
        console.error('Fehler beim Speichern des Plans:', error);
        showToast('Fehler beim Speichern des Plans.', 'error');
    }
}

/**
 * Erstellt einen Snapshot der aktuellen Einrichtungs-Anrechte für historische Genauigkeit.
 * GESCHÄFTSLOGIK: Beim Speichern werden die zu diesem Zeitpunkt gültigen "Abonnements" 
 * aus den Einrichtungs-Stammdaten kopiert und direkt in die Menüplan-Datei geschrieben.
 */
function createEinrichtungsSnapshot(stammdaten) {
    const { einrichtungen, stammdaten: stammdatenCore } = stammdaten;
    const snapshot = {
        einrichtungen: [],
        generatedAt: new Date().toISOString(),
        categories: stammdatenCore.kategorien.map(kat => ({ id: kat.id, name: kat.name }))
    };

    einrichtungen.forEach(einrichtung => {
        const einrichtungSnapshot = {
            id: einrichtung.id,
            name: einrichtung.name,
            kuerzel: einrichtung.kuerzel,
            isIntern: einrichtung.isIntern || false,
            speiseplan: einrichtung.speiseplan || {},
            // Zusätzliche Metadaten für historische Nachvollziehbarkeit
            snapshotMetadata: {
                originalDataTimestamp: einrichtung.updatedAt || einrichtung.createdAt || null
            }
        };

        snapshot.einrichtungen.push(einrichtungSnapshot);
    });

    return snapshot;
}

/**
 * Löscht alle Rezepte und Zuweisungen der aktuellen Woche.
 * ACHTUNG: Überschreibt alle aktuellen Änderungen!
 */
async function clearCurrentWeekPlan() {
    const { showConfirmationModal } = await import('@shared/components/confirmation-modal/confirmation-modal.js');
    
    // Bestätigung vom Benutzer einholen
    const confirmed = await showConfirmationModal(
        'Plan leeren',
        'Möchten Sie alle Rezepte und Zuweisungen der aktuellen Woche löschen? ACHTUNG: Diese Aktion kann nicht rückgängig gemacht werden!'
    );
    
    if (!confirmed) return;

    try {
        clearCurrentPlan();
        showToast('Menüplan erfolgreich geleert!', 'success');
    } catch (error) {
        console.error('Fehler beim Leeren des Plans:', error);
        showToast('Fehler beim Leeren des Plans.', 'error');
    }
}

/**
 * Lädt den Plan von vor 7 Wochen als Vorlage für die aktuelle Woche.
 * ACHTUNG: Überschreibt alle aktuellen Änderungen!
 */
async function loadPlanTemplate() {
    const { showConfirmationModal } = await import('@shared/components/confirmation-modal/confirmation-modal.js');
    
    // Bestätigung vom Benutzer einholen
    const confirmed = await showConfirmationModal(
        'Vorlage laden',
        'Möchten Sie den Plan von vor 7 Wochen als Vorlage laden? ACHTUNG: Alle aktuellen Änderungen gehen verloren!'
    );
    
    if (!confirmed) return;

    try {
        const currentDate = getCurrentDate();
        const [currentYear, currentWeek] = getWeekNumber(currentDate);
        
        // Berechne das Datum von vor 7 Wochen
        const templateDate = new Date(currentDate);
        templateDate.setDate(templateDate.getDate() - (7 * 7)); // 7 Wochen zurück
        const [templateYear, templateWeek] = getWeekNumber(templateDate);
        
        console.log(`Lade Vorlage von KW ${templateWeek}/${templateYear} für KW ${currentWeek}/${currentYear}`);
        
        // Vorlage-Plan laden
        const templatePlan = await api.getMenueplan(templateYear, templateWeek);
        
        if (!templatePlan || !templatePlan.days) {
            showToast('Keine Vorlage für diese Woche gefunden.', 'warning');
            return;
        }
        
        // Neuen Plan basierend auf der Vorlage erstellen
        const newPlan = {
            year: currentYear,
            week: currentWeek,
            days: { ...templatePlan.days }, // Kopiere alle Tage
            // Entferne alte Metadaten
            templateSource: {
                year: templateYear,
                week: templateWeek,
                loadedAt: new Date().toISOString()
            }
        };
        
        // Entferne alte Update-Informationen und Snapshot (wird beim Speichern neu erstellt)
        delete newPlan.updatedAt;
        delete newPlan.updatedBy;
        delete newPlan.einrichtungsSnapshot;
        
        // Plan in den State laden (das löst automatisch das Rerendering aus)
        setPlan(newPlan);
        
        showToast(`Vorlage von KW ${templateWeek}/${templateYear} erfolgreich geladen!`, 'success');
        
    } catch (error) {
        console.error('Fehler beim Laden der Vorlage:', error);
        showToast('Fehler beim Laden der Vorlage.', 'error');
    }
}

function navigateWeeks(weekDelta) {
    const currentDate = getCurrentDate();
    currentDate.setDate(currentDate.getDate() + (7 * weekDelta));
    setCurrentDate(new Date(currentDate));
    const [year, week] = getWeekNumber(getCurrentDate());
    loadAndRenderPlanCallback(year, week);
    updateTitle();
}

function navigateToToday() {
    setCurrentDate(new Date());
    const [year, week] = getWeekNumber(getCurrentDate());
    loadAndRenderPlanCallback(year, week);
    updateTitle();
}

/**
 * Aktualisiert den Titel, der die aktuelle Kalenderwoche und das Datum anzeigt.
 */
function updateTitle() {
    const titleEl = document.getElementById('menueplan-title');
    if(!titleEl) return;

    const { currentDate } = getState();
    const [year, week] = getWeekNumber(currentDate);

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() + 6) % 7);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const formatDate = (d) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    titleEl.textContent = `KW ${week} / ${year} (${formatDate(startOfWeek)} - ${formatDate(endOfWeek)})`;
}


/**
 * Initialisiert die Event-Listener für die Steuerungselemente.
 * @param {function} loadPlanFn - Die Callback-Funktion zum Laden und Rendern des Plans.
 */
export function initControls(loadPlanFn) {
    loadAndRenderPlanCallback = loadPlanFn;

    document.getElementById('menueplan-prev-week')?.addEventListener('click', () => navigateWeeks(-1));
    document.getElementById('menueplan-next-week')?.addEventListener('click', () => navigateWeeks(1));
    document.getElementById('menueplan-today')?.addEventListener('click', navigateToToday);
    document.getElementById('menueplan-suche')?.addEventListener('input', handleSearchInput);
    document.getElementById('menueplan-clear')?.addEventListener('click', clearCurrentWeekPlan);
    document.getElementById('menueplan-load-7-weeks-ago')?.addEventListener('click', loadPlanTemplate);
    
    // Click-outside Handler für Suchvorschläge
    document.addEventListener('click', handleClickOutside);
    
    updateTitle();
}

// Wird vom Orchestrator aufgerufen, wenn sich das Datum ändert.
export { updateTitle };