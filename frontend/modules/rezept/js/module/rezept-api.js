// In dieser Datei wird die gesamte API-Kommunikation für das Rezept-Modul gekapselt.
// z.B. fetchRezepte(), createRezept(daten), etc. 

import { rezeptPaths } from '../../path/paths.js';

/**
 * Ruft alle aktiven Rezepte vom Backend ab.
 * @returns {Promise<Array>} Ein Promise, das zu einem Array von Rezept-Objekten auflöst.
 */
export async function fetchRezepte() {
    const response = await fetch(rezeptPaths.api.getAlleRezepte);
    if (!response.ok) {
        throw new Error('Netzwerkfehler beim Abrufen der Rezepte.');
    }
    return await response.json();
}

/**
 * Ruft die Rezept-Stammdaten (z.B. Kategorien) vom Backend ab.
 * @returns {Promise<Object>} Ein Promise, das zu einem Objekt mit Stammdaten auflöst.
 */
export async function fetchRezeptStammdaten() {
    const response = await fetch(rezeptPaths.api.getStammdaten);
    if (!response.ok) {
        throw new Error('Netzwerkfehler beim Abrufen der Rezept-Stammdaten.');
    }
    return await response.json();
}

/**
 * Ruft ALLE Zutaten ab, die im System verfügbar sind.
 * Wird für die Zutatensuche im Rezeptformular benötigt.
 * @returns {Promise<Array>} Ein Promise, das zu einem Array von Zutat-Objekten auflöst.
 */
export async function fetchAlleZutaten() {
    const response = await fetch(rezeptPaths.shared.getAlleZutaten);
    if (!response.ok) {
        throw new Error('Netzwerkfehler beim Abrufen der Zutatenliste.');
    }
    return await response.json();
}

/**
 * Erstellt die Authentifizierungs-Header.
 * @returns {object} Ein Objekt mit dem Authorization-Header.
 */
function getAuthHeaders() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
        return {
            'Authorization': `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json',
        };
    }
    return {
        'Content-Type': 'application/json',
    };
}

/**
 * Sendet die Daten eines neuen Rezepts an das Backend, um es zu erstellen.
 * @param {object} rezeptDaten - Das zu erstellende Rezept-Objekt.
 * @returns {Promise<object>} Ein Promise, das zum neu erstellten Rezept-Objekt auflöst.
 */
export async function createRezept(rezeptDaten) {
    const response = await fetch(rezeptPaths.api.createRezept, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(rezeptDaten),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Erstellen des Rezepts.');
    }
    return await response.json();
}

/**
 * Sendet eine Anfrage zum Löschen eines Rezepts an das Backend.
 * @param {string} id - Die ID des zu löschenden Rezepts.
 * @returns {Promise<void>} Ein Promise, das auflöst, wenn der Vorgang abgeschlossen ist.
 */
export async function deleteRezept(id) {
    const response = await fetch(rezeptPaths.api.deleteRezept(id), {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Fehlerbody ist evtl. leer
        throw new Error(errorData.message || 'Fehler beim Löschen des Rezepts.');
    }
    // Bei DELETE-Anfragen gibt es oft keinen Body, daher wird response.json() nicht aufgerufen.
}

/**
 * Sendet die aktualisierten Rezeptdaten an das Backend.
 * @param {string} id - Die ID des zu aktualisierenden Rezepts.
 * @param {object} rezeptDaten - Das Objekt mit den neuen Rezeptdaten.
 * @returns {Promise<object>} Ein Promise, das zum aktualisierten Rezept-Objekt auflöst.
 */
export async function updateRezept(id, rezeptDaten) {
    const response = await fetch(rezeptPaths.api.updateRezept(id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(rezeptDaten),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Fehler beim Aktualisieren des Rezepts.');
    }
    return await response.json();
} 