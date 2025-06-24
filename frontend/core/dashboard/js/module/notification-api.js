const API_BASE_URL = '/api/auth/notifications';

/**
 * Ruft die ungelesenen Benachrichtigungen für den aktuellen Benutzer ab.
 * @returns {Promise<Array>} Ein Array von ungelesenen Benachrichtigungs-Objekten.
 */
export async function getUnreadNotifications() {
    const token = localStorage.getItem('token');
    const response = await fetch(API_BASE_URL, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        // Bei einem Fehler (z.B. 401) keine Exception werfen, sondern leeres Array zurückgeben.
        // Das Dashboard soll deswegen nicht abstürzen.
        console.error('Fehler beim Abrufen der Benachrichtigungen.');
        return [];
    }
    return response.json();
}

/**
 * Markiert eine Benachrichtigung als gelesen.
 * @param {string} notificationId - Die ID der gelesenen Benachrichtigung.
 */
export async function markNotificationAsRead(notificationId) {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/read`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId }),
    });
    // Wir ignorieren hier bewusst Fehler. Wenn das Markieren fehlschlägt,
    // wird der Toast beim nächsten Login einfach erneut angezeigt.
} 