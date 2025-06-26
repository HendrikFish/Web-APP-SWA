const User = require('../../../models/User');
const jwt = require('jsonwebtoken');

// Hilfsfunktion zum Erstellen eines JWT
const generateToken = (id) => {
    // Stellen Sie sicher, dass eine JWT_SECRET in Ihrer .env-Datei definiert ist
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * Authentifiziert einen Benutzer anhand von E-Mail und Passwort.
 * GARANTIERT success-Feld in jeder Response für CI/CD-Kompatibilität.
 */
async function loginUser(req, res) {
    // Force success field in every response
    const sendResponse = (status, success, message, data = {}) => {
        return res.status(status).json({
            success,
            message,
            ...data
        });
    };

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse(400, false, 'Bitte geben Sie E-Mail und Passwort an.');
        }

        // Finde den Benutzer anhand der E-Mail
        const user = await User.findOne({ email });

        // Überprüfe, ob der Benutzer existiert UND das Passwort übereinstimmt
        if (user && (await user.matchPassword(password))) {
            // Zusätzliche Prüfung: Ist der Benutzer genehmigt?
            if (!user.isApproved) {
                return sendResponse(401, false, 'Ihr Account wurde noch nicht genehmigt.');
            }

            return sendResponse(200, true, 'Login erfolgreich.', {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                },
                token: generateToken(user._id)
            });
        } else {
            // Aus Sicherheitsgründen eine generische Fehlermeldung
            return sendResponse(401, false, 'Ungültige Anmeldedaten.');
        }
    } catch (error) {
        console.error("Fehler beim Login:", error);
        return sendResponse(500, false, "Serverfehler beim Login.");
    }
}

module.exports = loginUser; 