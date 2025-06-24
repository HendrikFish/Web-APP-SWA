const User = require('../../../../models/User.js');

/**
 * Genehmigt einen Benutzer, indem der `isApproved`-Status auf `true` gesetzt wird.
 * @param {object} req - Das Express-Request-Objekt.
 * @param {object} res - Das Express-Response-Objekt.
 */
async function approveUser(req, res) {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true } // Gibt das aktualisierte Dokument zurück
        );

        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }

        res.status(200).json({ message: 'Benutzer erfolgreich genehmigt.', user });
    } catch (error) {
        console.error('Fehler beim Genehmigen des Benutzers:', error);
        res.status(500).json({ message: 'Serverfehler beim Genehmigen des Benutzers.' });
    }
}

module.exports = approveUser; 