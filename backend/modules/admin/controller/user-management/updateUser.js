const User = require('../../../../models/User.js');

/**
 * Aktualisiert die Daten eines Benutzers in der Datenbank.
 * @param {object} req - Das Express-Request-Objekt. Enthält die User-ID und die neuen Daten.
 * @param {object} res - Das Express-Response-Objekt.
 */
async function updateUser(req, res) {
    try {
        const { firstName, lastName, email, role, customFields } = req.body;
        const updatedData = { firstName, lastName, email, role, customFields };

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true } // Gibt das aktualisierte Dokument zurück und führt Validierungen aus
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }

        res.status(200).json({ message: 'Benutzer erfolgreich aktualisiert.', user });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Benutzers:', error);
        res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Benutzers.' });
    }
}

module.exports = updateUser; 