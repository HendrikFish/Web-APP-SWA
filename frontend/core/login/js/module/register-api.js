/**
 * Sendet eine Registrierungsanfrage an das Backend.
 * @param {string} firstName - Der Vorname des Benutzers.
 * @param {string} lastName - Der Nachname des Benutzers.
 * @param {string} email - Die E-Mail-Adresse des Benutzers.
 * @param {string} password - Das gewählte Passwort.
 * @param {object} customFields - Ein Objekt mit den dynamischen Feldwerten.
 * @returns {Promise<object>} Die Antwort vom Server.
 * @throws {Error} Wenn die Anfrage fehlschlägt.
 */
export async function registerUser(firstName, lastName, email, password, customFields) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, lastName, email, password, customFields })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Ein unbekannter Fehler ist aufgetreten.');
        }

        return data;
    } catch (error) {
        console.error('Fehler bei der Registrierung:', error);
        throw error;
    }
} 