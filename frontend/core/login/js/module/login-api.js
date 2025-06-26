import { loginPaths } from '../../path/paths.js';

/**
 * Sendet die Anmeldedaten des Benutzers an das Backend.
 * @param {string} email - Die E-Mail-Adresse des Benutzers.
 * @param {string} password - Das Passwort des Benutzers.
 * @returns {Promise<object>} Die Benutzerdaten und der Token bei Erfolg.
 * @throws {Error} Wenn die Anmeldung fehlschlägt.
 */
export async function loginUser(email, password) {
    // Korrektur: Das Backend erwartet 'email', nicht 'username'.
    const loginData = { email, password };

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        if (!response.ok) {
            // Wenn der Server einen Fehler meldet, versuchen wir, die Antwort als Text zu lesen.
            const errorText = await response.text();
            console.error('Antwort vom Server (Fehler):', errorText);
            // Wir versuchen, den Text als JSON zu parsen, für den Fall, dass der Server eine JSON-Fehlermeldung sendet.
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || `HTTP-Fehler! Status: ${response.status}`);
            } catch (e) {
                // Wenn die Antwort kein JSON ist, werfen wir den Text als Fehler.
                throw new Error(errorText || `HTTP-Fehler! Status: ${response.status}`);
            }
        }

        // Nur wenn die Antwort OK ist, versuchen wir, sie als JSON zu parsen.
        const data = await response.json();
        
        // KRITISCHE KORREKTUR: Speichere die Benutzerinformationen im localStorage.
        if (data && data.token) {
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token); // Auch Token separat speichern für Kompatibilität
        }

        return data;
    } catch (e) {
        console.error('Fehler beim Login:', e);
        throw e;
    }
} 