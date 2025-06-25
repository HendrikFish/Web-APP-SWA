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
 */
async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bitte geben Sie E-Mail und Passwort an.' 
            });
        }

        // Finde den Benutzer anhand der E-Mail
        const user = await User.findOne({ email });

        // Überprüfe, ob der Benutzer existiert UND das Passwort übereinstimmt
        if (user && (await user.matchPassword(password))) {
            // Zusätzliche Prüfung: Ist der Benutzer genehmigt?
            if (!user.isApproved) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Ihr Account wurde noch nicht genehmigt.' 
                });
            }

            return res.status(200).json({
                success: true,
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                },
                token: generateToken(user._id),
            });
        } else {
            // Aus Sicherheitsgründen eine generische Fehlermeldung
            return res.status(401).json({ 
                success: false, 
                message: 'Ungültige Anmeldedaten.' 
            });
        }
    } catch (error) {
        console.error("Fehler beim Login:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Serverfehler beim Login." 
        });
    }
}

module.exports = loginUser; 