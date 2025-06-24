// menueplan-ui.js
// Dieses Modul orchestriert das gesamte Menüplan-Modul.
// Es initialisiert alle Sub-Module und steuert den Datenfluss.

import { api } from './menueplan-api.js';
import {
    setState,
    setOnStateChange,
    setPlan,
    getCurrentDate,
    getWeekNumber,
    triggerAutosave,
} from './menueplan-state.js';
import { initControls, updateTitle } from './menueplan-controls.js';
import { initGrid, render as renderGrid } from './menueplan-grid.js';
import { initDragAndDrop } from './menueplan-dragdrop.js';

const appContainer = document.getElementById('app');

function handleAutosaveWithIndicator() {
    const indicator = document.getElementById('autosave-indicator');
    const icon = indicator.querySelector('.indicator-icon');
    const text = indicator.querySelector('.indicator-text');
    let hideTimeout;

    const showIndicator = (state, message) => {
        clearTimeout(hideTimeout);
        indicator.className = `text-muted visible ${state}`;
        icon.className = `indicator-icon bi bi-arrow-repeat`;
        text.textContent = message;

        if (state === 'success' || state === 'error') {
            const finalIcon = state === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
            icon.className = `indicator-icon bi ${finalIcon}`;
            hideTimeout = setTimeout(() => {
                indicator.classList.remove('visible');
            }, 2000);
        }
    };

    triggerAutosave({
        onSaving: () => showIndicator('saving', 'Speichert...'),
        onSuccess: () => showIndicator('success', 'Gespeichert'),
        onError: () => showIndicator('error', 'Speicherfehler'),
    });
}

/**
 * Lädt den Plan für eine gegebene Woche, setzt den State und löst das Rerendering aus.
 * @param {number} year 
 * @param {number} week 
 */
async function loadAndRenderPlan(year, week) {
    try {
        const plan = await api.getMenueplan(year, week);
        setPlan(plan);
    } catch (error) {
        console.error(`Fehler beim Laden des Plans für KW ${week}/${year}:`, error);
        setPlan(null);
    }
}

/**
 * Die Haupt-Initialisierungsfunktion.
 * @param {Object} user - Der authentifizierte Benutzer (vom Header übertragen)
 */
export async function initMenueplanUI(user) {
    if (!appContainer) return;

    try {
        // 1. Alle Stammdaten laden
        const [stammdatenData, einrichtungen, rezepte] = await Promise.all([
            api.getStammdaten(),
            api.getEinrichtungen(),
            api.getRezepte()
        ]);
        
        const stammdaten = { stammdaten: stammdatenData, einrichtungen, rezepte };
        setState({ stammdaten });

        // 2. Den "Renderer" an den State binden.
        setOnStateChange(() => {
            renderGrid();
            updateTitle();
            handleAutosaveWithIndicator();
        });
        
        // 3. Sub-Module initialisieren
        initControls(loadAndRenderPlan);
        initGrid(); 

        // 4. Initialen Plan laden und UI erstmalig aufbauen
        const [year, week] = getWeekNumber(getCurrentDate());
        await loadAndRenderPlan(year, week);

        // 5. Drag & Drop EINMALIG nach dem ersten Rendern initialisieren
        initDragAndDrop();

    } catch (error) {
        console.error("Schwerwiegender Fehler bei der Initialisierung des Menüplans:", error);
        appContainer.innerHTML = '<div class="alert alert-danger">Das Menüplan-Modul konnte nicht geladen werden.</div>';
    }
}