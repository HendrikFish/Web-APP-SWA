const User = require('../../../models/User');

/**
 * Registriert einen neuen Benutzer mit dem Status "nicht genehmigt".
 */
async function registerUser(req, res) {
    const { firstName, lastName, email, password, customFields } = req.body;

    // Einfache Validierung
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Bitte füllen Sie alle Felder aus.' });
    }

    try {
        // Prüfen, ob der Benutzer bereits existiert
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.' });
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
            res.status(201).json({
                message: 'Registrierungsanfrage erfolgreich gesendet. Sie wird nun von einem Administrator geprüft.'
            });
        } else {
            res.status(400).json({ message: 'Ungültige Benutzerdaten.' });
        }
    } catch (error) {
        console.error("Fehler bei der Registrierung:", error);
        res.status(500).json({ message: "Serverfehler bei der Registrierung." });
    }
}

module.exports = registerUser; 