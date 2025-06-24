import headerHtml from '@shared/components/header/header.html?raw';
// CSS wird nicht mehr benötigt, da wir Bootstrap verwenden.

/**
 * Holt die Daten des aktuellen Benutzers vom Backend.
 * @param {string} token - Der JWT-Token des Benutzers.
 * @returns {Promise<object>} - Die Benutzerdaten.
 */
async function fetchCurrentUser(token) {
    const response = await fetch('/api/user/current', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        // Wenn der Token ungültig ist, wird der Benutzer zum Login weitergeleitet.
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/core/login/index.html';
        }
        throw new Error('Fehler beim Abrufen der Benutzerdaten.');
    }
    return await response.json();
}

/**
 * Initialisiert den Header: Holt Benutzerdaten, rendert den Header und richtet Event-Listener ein.
 * Dies ist die zentrale Funktion zur Autorisierung auf jeder geschützten Seite.
 * @returns {Promise<object>} - Das Objekt des angemeldeten Benutzers.
 */
export async function initializeHeader() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Wenn kein Token vorhanden ist, sofort zum Login umleiten.
        window.location.href = '/core/login/index.html';
        throw new Error('Kein Authentifizierungstoken gefunden.');
    }

    try {
        // Die CSS-Datei wird nicht mehr separat geladen.
        const user = await fetchCurrentUser(token);
        
        // Header-CSS wird nicht mehr eingefügt.

        // Header-HTML in das Platzhalter-Element einfügen
        const headerElement = document.getElementById('main-header');
        if (headerElement) {
            headerElement.innerHTML = headerHtml;
            document.getElementById('header-username').textContent = user.firstName;

            // Event-Listener für den Logout-Button
            document.getElementById('logout-btn').addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = '/core/login/index.html';
            });
        }

        // Das Benutzerobjekt für weitere Verwendung auf der Seite zurückgeben
        return user;

    } catch (error) {
        console.error('Initialisierungsfehler im Header:', error);
        // Bei einem Fehler (z.B. ungültiger Token) zum Login umleiten.
        localStorage.removeItem('token');
        window.location.href = '/core/login/index.html';
        throw error; // Den Fehler weiterwerfen, damit das aufrufende Skript ihn behandeln kann.
    }
} 