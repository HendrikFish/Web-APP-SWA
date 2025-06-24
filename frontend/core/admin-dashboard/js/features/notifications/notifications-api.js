const API_BASE_URL = '/api/notifications';

/**
 * Ruft alle Benachrichtigungen vom Server ab.
 * @returns {Promise<Array>} Ein Array von Benachrichtigungs-Objekten.
 */
export async function getAllNotifications() {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Benachrichtigungen.');
    }
    return response.json();
}

/**
 * Erstellt eine neue Benachrichtigung auf dem Server.
 * @param {object} notificationData - Die Daten für die neue Benachrichtigung.
 * @returns {Promise<object>} Das erstellte Benachrichtigungs-Objekt.
 */
export async function createNotification(notificationData) {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
    });
    if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Benachrichtigung.');
    }
    return response.json();
}

/**
 * Aktualisiert eine bestehende Benachrichtigung.
 * @param {string} id - Die ID der zu aktualisierenden Benachrichtigung.
 * @param {object} notificationData - Die neuen Daten.
 * @returns {Promise<object>} Das aktualisierte Benachrichtigungs-Objekt.
 */
export async function updateNotification(id, notificationData) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
    });
    if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Benachrichtigung.');
    }
    return response.json();
}

/**
 * Löscht eine Benachrichtigung vom Server.
 * @param {string} id - Die ID der zu löschenden Benachrichtigung.
 * @returns {Promise<object>} Eine Erfolgsmeldung.
 */
export async function deleteNotification(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Fehler beim Löschen der Benachrichtigung.');
    }
    return response.json();
} 