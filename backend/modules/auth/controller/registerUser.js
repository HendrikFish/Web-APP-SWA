const User = require('../../../models/User');

/**
 * Registriert einen neuen Benutzer mit dem Status "nicht genehmigt".
 * GARANTIERT success-Feld in jeder Response für CI/CD-Kompatibilität.
 */
async function registerUser(req, res) {
    // Force success field in every response
    const sendResponse = (status, success, message, data = {}) => {
        return res.status(status).json({
            success,
            message,
            ...data
        });
    };

    try {
        const { firstName, lastName, email, password, customFields } = req.body;

        // Einfache Validierung
        if (!firstName || !lastName || !email || !password) {
            return sendResponse(400, false, 'Bitte füllen Sie alle Felder aus.');
        }

        // Prüfen, ob der Benutzer bereits existiert
        const userExists = await User.findOne({ email });

        if (userExists) {
            return sendResponse(400, false, 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.');
        }

        // Neuen Benutzer erstellen (Passwort wird durch Mongoose-Middleware automatisch gehasht)
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            isApproved: false, // WICHTIG: Standardmäßig nicht genehmigt
            customFields
        });

        if (user) {
            return sendResponse(201, true, 'Registrierungsanfrage erfolgreich gesendet. Sie wird nun von einem Administrator geprüft.');
        } else {
            return sendResponse(400, false, 'Ungültige Benutzerdaten.');
        }
    } catch (error) {
        console.error("Fehler bei der Registrierung:", error);
        return sendResponse(500, false, "Serverfehler bei der Registrierung.");
    }
}

module.exports = registerUser; 