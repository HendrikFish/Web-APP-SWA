const User = require('../../../../models/User.js');

/**
 * Löscht einen Benutzer anhand seiner ID aus der Datenbank.
 * @param {object} req - Das Express-Request-Objekt. Enthält die User-ID in den Parametern.
 * @param {object} res - Das Express-Response-Objekt.
 */
async function deleteUser(req, res) {
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }

        res.status(200).json({ message: 'Benutzer erfolgreich gelöscht.' });
    } catch (error) {
        console.error('Fehler beim Löschen des Benutzers:', error);
        res.status(500).json({ message: 'Serverfehler beim Löschen des Benutzers.' });
    }
}

module.exports = deleteUser; 