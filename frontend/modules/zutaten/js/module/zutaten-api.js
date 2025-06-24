import { zutatenPaths } from '../../path/paths.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';

// Gemeinsame Fehlerbehandlung
async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || 'Ein unbekannter Fehler ist aufgetreten.';
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
    }
    return response.json();
}

/**
 * Ruft die Liste aller Zutaten vom Backend ab.
 * @returns {Promise<Array>} Ein Promise, das zu einem Array von Zutat-Objekten auflöst.
 */
export async function getZutaten() {
    const response = await fetch(zutatenPaths.api.zutaten);
    return handleResponse(response);
}

/**
 * Ruft die Stammdaten (Kategorien, Lieferanten etc.) vom Backend ab.
 * @returns {Promise<object>} Ein Promise, das zum Stammdaten-Objekt auflöst.
 */
export async function getZutatenStammdaten() {
    const response = await fetch(zutatenPaths.api.stammdaten);
    return handleResponse(response);
}

/**
 * Ruft die Namensvorschläge für die Zutatenerfassung ab.
 * @returns {Promise<Array>} Ein Promise, das zu einem Array von Vorschlag-Strings auflöst.
 */
export async function getVorschlaege() {
    const response = await fetch(zutatenPaths.api.vorschlaege);
    if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Vorschläge');
    }
    return response.json();
}

/**
 * Sendet eine neue Zutat zum Speichern an das Backend.
 * @param {object} zutatData - Das Zutat-Objekt, das gespeichert werden soll.
 * @returns {Promise<object>} Das vom Server zurückgegebene, gespeicherte Zutat-Objekt.
 */
export async function saveZutat(zutatData) {
    const response = await fetch(zutatenPaths.api.zutaten, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(zutatData)
    });
    return handleResponse(response);
}

/**
 * Sendet die Daten einer neuen Zutat an das Backend, um sie zu erstellen.
 * @param {object} zutatData - Die Daten der neuen Zutat.
 * @returns {Promise<object>} - Die vom Server zurückgegebene neue Zutat.
 */
export async function createZutat(zutatData) {
    const response = await fetch(zutatenPaths.api.zutaten, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Ggf. Authorization-Header hinzufügen, falls erforderlich
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(zutatData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Erstellen der Zutat');
    }

    return response.json();
}

export async function updateZutat(zutat) {
    try {
        const response = await fetch(`/api/zutaten/${zutat.zutatennummer}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(zutat),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Aktualisieren der Zutat');
        }

        return await response.json();
    } catch (error) {
        console.error('API-Fehler beim Aktualisieren der Zutat:', error);
        throw error;
    }
}

export async function deleteZutat(id) {
    try {
        const response = await fetch(`/api/zutaten/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Löschen der Zutat');
        }

        // Bei DELETE-Anfragen gibt es oft keinen Body, daher prüfen wir den Status.
        if (response.status === 204) {
            return { message: 'Zutat erfolgreich gelöscht' };
        }

        return await response.json();
    } catch (error) {
        console.error('API-Fehler beim Löschen der Zutat:', error);
        throw error;
    }
}

/**
 * Löst den Download aller aktiven Zutaten als JSON-Datei aus.
 */
export async function exportZutaten() {
    const response = await fetch(zutatenPaths.api.exportZutaten);
    if (!response.ok) {
        throw new Error('Fehler beim Exportieren der Zutaten.');
    }

    // Triggert den Browser-Download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zutaten-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

/**
 * Sendet eine JSON-Datei mit Zutaten an das Backend zum Import.
 * @param {File} file Die zu importierende JSON-Datei.
 * @returns {Promise<object>} Das Ergebnis des Imports vom Server.
 */
export async function importZutaten(file) {
    const fileContent = await file.text();
    const data = JSON.parse(fileContent);

    const response = await fetch(zutatenPaths.api.importZutaten, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Importieren der Zutaten.');
    }
    return result;
} 