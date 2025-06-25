// In dieser Datei wird die API-Kommunikation für den Menüplaner gekapselt.
import { menueplanPaths } from '../../path/paths.js';

async function fetchData(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            throw new Error(`Netzwerk-Antwort war nicht ok: ${response.statusText}`);
        }
        return response.status === 204 ? null : await response.json();
    } catch (error) {
        console.error(`Fehler beim Abrufen der Daten von ${url}:`, error);
        throw error;
    }
}

export const api = {
    getStammdaten: () => fetchData(menueplanPaths.data.stammdaten),
    getEinrichtungen: () => fetchData('/shared/data/einrichtungen/einrichtungen.json'),
    getRezepte: () => fetchData('/shared/data/rezepte/rezepte.json'),
    getModalMessages: () => fetchData('/shared/config/modal-messages.json'),

    /**
     * Lädt den Menüplan für ein gegebenes Jahr und eine Woche vom Server.
     * @param {number} year 
     * @param {number} week 
     * @returns {Promise<object>}
     */
    getMenueplan: (year, week) => {
        const path = menueplanPaths.api.getPlan(year, week);
        return fetchData(path);
    },

    /**
     * Speichert den Menüplan für ein gegebenes Jahr und eine Woche auf dem Server.
     * @param {number} year 
     * @param {number} week 
     * @param {object} planData - Das zu speichernde Plan-Objekt.
     * @returns {Promise<object>}
     */
    saveMenueplan: (year, week, planData) => {
        const path = menueplanPaths.api.savePlan(year, week);
        return fetchData(path, {
            method: 'POST',
            body: JSON.stringify(planData)
        });
    },

    /**
     * Aktualisiert den Einrichtungs-Snapshot eines bestehenden Menüplans
     * @param {number} year 
     * @param {number} week 
     * @returns {Promise<object>}
     */
    updateEinrichtungsSnapshot: (year, week) => {
        const path = menueplanPaths.api.updateSnapshot(year, week);
        return fetchData(path, {
            method: 'PUT'
        });
    }
};
