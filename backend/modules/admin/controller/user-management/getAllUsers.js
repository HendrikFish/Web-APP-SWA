const User = require('../../../../models/User.js');

/**
 * Ruft eine Liste aller Benutzer aus der Datenbank ab.
 * Das Passwortfeld wird aus Sicherheitsgründen explizit ausgeschlossen.
 */
async function getAllUsers(req, res) {
    try {
        // Finde alle Benutzer und schließe das Passwortfeld aus
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error("Fehler beim Abrufen der Benutzer:", error);
        res.status(500).json({ message: "Serverfehler beim Abrufen der Benutzer." });
    }
}

module.exports = getAllUsers; 