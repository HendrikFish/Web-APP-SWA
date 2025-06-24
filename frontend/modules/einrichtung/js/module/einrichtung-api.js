//
// API-Handler für Einrichtungen
// Verantwortlich für alle HTTP-Anfragen (GET, POST, PUT, DELETE)
// an das Backend für die Einrichtungsdaten.
//

/**
 * Holt die Stammdaten für das Einrichtungsformular vom Backend.
 * @returns {Promise<object>} - Ein Objekt mit den Stammdaten (z.B. Touren, Personengruppen).
 */
export async function getStammdaten() {
    try {
        const response = await fetch('/api/einrichtungen/stammdaten');
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht erfolgreich.');
        }
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Abrufen der Einrichtungs-Stammdaten:', error);
        // Hier könnte man eine Nutzer-freundliche Fehlermeldung via Toast anzeigen
        throw error;
    }
}

/**
 * Sendet die Daten einer neuen Einrichtung an das Backend, um sie zu speichern.
 * @param {object} einrichtungData - Das Objekt mit den Formulardaten.
 * @returns {Promise<object>} - Die vom Server erstellte Einrichtung mit ID.
 */
export async function createEinrichtung(einrichtungData) {
    try {
        const response = await fetch('/api/einrichtungen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Falls benötigt
            },
            body: JSON.stringify(einrichtungData)
        });

        if (!response.ok) {
            // Versuchen, die Fehlermeldung vom Server zu parsen
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Speichern der Einrichtung.');
        }
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Erstellen der Einrichtung:', error);
        // Hier könnte man eine Nutzer-freundliche Fehlermeldung via Toast anzeigen
        throw error;
    }
}

/**
 * Ruft die Liste aller Einrichtungen vom Backend ab.
 * @returns {Promise<Array>} - Ein Array mit den Einrichtungsobjekten.
 */
export async function getEinrichtungen() {
    try {
        const response = await fetch('/api/einrichtungen');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Einrichtungen.');
        }
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Abrufen der Einrichtungen:', error);
        throw error;
    }
}

/**
 * Sendet eine Anfrage zum Löschen einer Einrichtung an das Backend.
 * @param {string} id - Die ID der zu löschenden Einrichtung.
 * @returns {Promise<object>} - Die Erfolgs- oder Fehlermeldung vom Server.
 */
export async function deleteEinrichtung(id) {
    try {
        const response = await fetch(`/api/einrichtungen/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Falls benötigt
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Löschen der Einrichtung.');
        }
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Löschen der Einrichtung:', error);
        throw error;
    }
}

/**
 * Holt die Daten einer einzelnen Einrichtung vom Backend.
 * @param {string} id - Die ID der Einrichtung.
 * @returns {Promise<object>} - Das Einrichtungsobjekt.
 */
export async function getEinrichtung(id) {
    try {
        const response = await fetch(`/api/einrichtungen/${id}`);
        if (!response.ok) {
            throw new Error('Einrichtung konnte nicht geladen werden.');
        }
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Abrufen der Einrichtung:', error);
        throw error;
    }
}

/**
 * Sendet aktualisierte Einrichtungsdaten an das Backend.
 * @param {string} id - Die ID der zu aktualisierenden Einrichtung.
 * @param {object} einrichtungData - Das Objekt mit den aktualisierten Daten.
 * @returns {Promise<object>} - Das aktualisierte Objekt vom Server.
 */
export async function updateEinrichtung(id, einrichtungData) {
    try {
        const response = await fetch(`/api/einrichtungen/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(einrichtungData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Aktualisieren der Einrichtung.');
        }
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Einrichtung:', error);
        throw error;
    }
} 