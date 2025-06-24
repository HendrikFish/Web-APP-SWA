// menueplan-state.js
// Dieses Modul ist das "Gehirn" der Menüplan-Anwendung. Es verwaltet den gesamten Zustand,
// einschließlich des aktuellen Menüplans, der Stammdaten und des UI-Status.
// Es bietet saubere Schnittstellen zur Zustandsänderung und löst bei Bedarf
// automatische Speicherungen aus. Es manipuliert niemals direkt das DOM.

import { api } from './menueplan-api.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';
import debounce from 'lodash.debounce';

const state = {
    currentDate: new Date(),
    currentPlan: null,
    stammdaten: {
        rezepte: [],
        einrichtungen: [],
        stammdaten: { kategorien: [] }
    },
    modalMessages: {},
    currentDragData: null, // Hält Infos über das gezogene Element
    onStateChange: () => {}, // Callback, der bei State-Änderung aufgerufen wird
};

// --- Autosave ---
// Nimmt Callbacks entgegen, um die UI über den Speicherstatus zu informieren.
const debouncedSave = debounce(async (plan, callbacks) => {
    callbacks.onSaving(); // "Wird gespeichert..." anzeigen
    try {
        const { year, week } = plan;
        
        // GESCHÄFTSLOGIK: Snapshot der Einrichtungs-Anrechte hinzufügen
        const planWithSnapshot = {
            ...plan,
            einrichtungsSnapshot: createEinrichtungsSnapshot()
        };
        
        await api.saveMenueplan(year, week, planWithSnapshot);
        callbacks.onSuccess(); // "Gespeichert!" anzeigen
    } catch (error) {
        console.error('Fehler beim automatischen Speichern:', error);
        callbacks.onError(); // "Fehler" anzeigen
    }
}, 1500);

export function triggerAutosave(callbacks) {
    if (!state.currentPlan) return;
    debouncedSave(state.currentPlan, callbacks);
}


// --- Hilfsfunktionen ---
export function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
}

// --- Getter ---
export const getState = () => state;
export const getCurrentDate = () => state.currentDate;
export const getCurrentPlan = () => state.currentPlan;


// --- Setter & Notifier ---
export function setState(newState) {
    Object.assign(state, newState);
    // Bei kritischen Änderungen wie dem Laden eines neuen Plans, den State Change benachrichtigen
    if (newState.currentPlan || newState.stammdaten) {
        state.onStateChange();
    }
}

export function setOnStateChange(callback) {
    state.onStateChange = callback;
}

export function setCurrentDate(date) {
    state.currentDate = date;
}

export function setCurrentDragData(data) {
    state.currentDragData = data;
}

function initializeEmptyPlan(year, week) {
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const plan = {
        year,
        week,
        days: {},
    };

    wochentage.forEach(tag => {
        plan.days[tag] = {
            Mahlzeiten: {},
            Zuweisungen: {
                menu1: [],
                menu2: []
            }
        };
        state.stammdaten.stammdaten.kategorien.forEach(kat => {
            plan.days[tag].Mahlzeiten[kat.id] = [];
        });
    });
    return plan;
}

/**
 * Stellt sicher, dass ein vom Server geladener (potenziell unvollständiger) Plan
 * die vollständige Struktur aller Tage und Kategorien besitzt.
 * @param {object} planData - Die rohen Plandaten von der API.
 * @param {number} year 
 * @param {number} week 
 * @returns {object} Ein vollständiger, normalisierter Plan.
 */
function normalizePlan(planData, year, week) {
    const fullPlan = initializeEmptyPlan(year, week);

    if (!planData || !planData.days) {
        return fullPlan;
    }

    fullPlan.year = planData.year || year;
    fullPlan.week = planData.week || week;

    for (const dayTag in fullPlan.days) {
        if (planData.days[dayTag]) {
            if (planData.days[dayTag].Mahlzeiten) {
                for (const kategorieId in fullPlan.days[dayTag].Mahlzeiten) {
                    if (planData.days[dayTag].Mahlzeiten[kategorieId]) {
                        fullPlan.days[dayTag].Mahlzeiten[kategorieId] = planData.days[dayTag].Mahlzeiten[kategorieId];
                    }
                }
            }
            if (planData.days[dayTag].Zuweisungen) {
                fullPlan.days[dayTag].Zuweisungen = planData.days[dayTag].Zuweisungen;
            }
        }
    }
    return fullPlan;
}

export function setPlan(planData) {
    const [year, week] = getWeekNumber(state.currentDate);
    state.currentPlan = normalizePlan(planData, year, week);
    state.onStateChange();
}

/**
 * Erstellt einen Snapshot der aktuellen Einrichtungs-Anrechte für historische Genauigkeit.
 * GESCHÄFTSLOGIK: Beim Speichern werden die zu diesem Zeitpunkt gültigen "Abonnements" 
 * aus den Einrichtungs-Stammdaten kopiert und direkt in die Menüplan-Datei geschrieben.
 */
function createEinrichtungsSnapshot() {
    const { einrichtungen, stammdaten } = state.stammdaten;
    const snapshot = {
        einrichtungen: [],
        generatedAt: new Date().toISOString(),
        categories: stammdaten.kategorien.map(kat => ({ id: kat.id, name: kat.name }))
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


// --- Logik zur Plan-Manipulation ---

export function updatePlanWithDraggedRezept(targetTag, targetKategorie, rezeptId, rezeptName, sourceTag, sourceKategorie) {
    if (!state.currentPlan) state.currentPlan = {};
    if (!state.currentPlan.days) state.currentPlan.days = {};

    const { days } = state.currentPlan;

    // AKTION: VERSCHIEBEN (innerhalb des Plans)
    if (sourceTag && sourceKategorie && sourceTag !== 'null' && sourceKategorie !== 'null') {
        const sourceList = days[sourceTag]?.Mahlzeiten?.[sourceKategorie];
        const targetList = days[targetTag]?.Mahlzeiten?.[targetKategorie];
        
        if (!sourceList || !targetList) return; 

        const rezeptIndex = sourceList.findIndex(r => r.id === rezeptId);
        
        if (rezeptIndex > -1) {
            const [rezept] = sourceList.splice(rezeptIndex, 1);
            if (!targetList.some(r => r.id === rezeptId)) {
                targetList.push(rezept);
            }
        }
    } 
    // AKTION: HINZUFÜGEN (von Suchliste)
    else {
        if (!days[targetTag]) {
            days[targetTag] = { Mahlzeiten: {}, Zuweisungen: {} };
        }
        if (!days[targetTag].Mahlzeiten[targetKategorie]) {
            days[targetTag].Mahlzeiten[targetKategorie] = [];
        }
        const targetList = days[targetTag].Mahlzeiten[targetKategorie];

        if (!targetList.some(r => r.id === rezeptId)) {
            targetList.push({ id: rezeptId, name: rezeptName });
        }
    }
    
    state.onStateChange();
}

export function updatePlanWithDraggedZone(targetTag, targetKategorie, sourceTag, sourceKategorie) {
    if (!state.currentPlan?.days || (targetTag === sourceTag && targetKategorie === sourceKategorie)) {
        return; // Guard Clause & gleiches Ziel wie Quelle
    }
    const { days } = state.currentPlan;

    const sourceList = days[sourceTag]?.Mahlzeiten?.[sourceKategorie];
    const targetList = days[targetTag]?.Mahlzeiten?.[targetKategorie];

    if (!sourceList || !targetList) return; // Ungültiger Vorgang

    // LOGIK: Inhalte austauschen (Swap)
    const temp = [...targetList]; // Kopie der Ziel-Liste
    days[targetTag].Mahlzeiten[targetKategorie] = [...sourceList];
    days[sourceTag].Mahlzeiten[sourceKategorie] = temp;
    
    state.onStateChange();
    // Das UI-Modul wird triggerAutosave mit den korrekten Callbacks aufrufen
}

export function removeRezeptFromPlan(tag, kategorie, rezeptId) {
    const list = state.currentPlan.days[tag].Mahlzeiten[kategorie];
    const index = list.findIndex(r => r.id === rezeptId);
    if (index > -1) {
        list.splice(index, 1);
        state.onStateChange();
        // Das UI-Modul wird triggerAutosave mit den korrekten Callbacks aufrufen
    }
}

// Category Zone Drag entfernt (unnötig)

export function clearCurrentPlan() {
    if (!state.currentPlan?.days) return;
    
    const { days } = state.currentPlan;
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    
    // Lösche alle Rezepte und Zuweisungen für alle Tage
    wochentage.forEach(tag => {
        if (days[tag]) {
            // Alle Mahlzeiten-Kategorien leeren
            if (days[tag].Mahlzeiten) {
                Object.keys(days[tag].Mahlzeiten).forEach(kategorie => {
                    days[tag].Mahlzeiten[kategorie] = [];
                });
            }
            // Alle Einrichtungs-Zuweisungen leeren
            if (days[tag].Zuweisungen) {
                days[tag].Zuweisungen = {};
            }
        }
    });
    
    state.onStateChange();
}

export function toggleEinrichtungsZuweisung(tag, menuKategorie, einrichtungId) {
    if (!state.currentPlan?.days?.[tag]?.Zuweisungen) {
        console.error('Zuweisungen nicht initialisiert für', tag);
        return;
    }
    
    const zuweisungen = state.currentPlan.days[tag].Zuweisungen;
    const andereMenuKategorie = menuKategorie === 'menu1' ? 'menu2' : 'menu1';

    // Sicherstellen, dass die Arrays existieren
    if (!zuweisungen[menuKategorie]) {
        zuweisungen[menuKategorie] = [];
    }
    if (!zuweisungen[andereMenuKategorie]) {
        zuweisungen[andereMenuKategorie] = [];
    }

    const index = zuweisungen[menuKategorie].indexOf(einrichtungId);

    if (index > -1) {
        // Einrichtung ist bereits zugewiesen -> entfernen
        zuweisungen[menuKategorie].splice(index, 1);
    } else {
        // Einrichtung zuweisen -> erst von anderem Menü entfernen falls vorhanden
        zuweisungen[menuKategorie].push(einrichtungId);
        const andererIndex = zuweisungen[andereMenuKategorie].indexOf(einrichtungId);
        if (andererIndex > -1) {
            zuweisungen[andereMenuKategorie].splice(andererIndex, 1);
        }
    }
    
    state.onStateChange();
} 