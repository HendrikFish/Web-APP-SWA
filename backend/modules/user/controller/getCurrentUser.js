const User = require('../../../models/User');
const jwt = require('jsonwebtoken');

/**
 * Sendet die Daten des aktuell angemeldeten Benutzers zurück.
 * @param {object} req - Das Express-Request-Objekt. Enthält den Authorization-Header.
 * @param {object} res - Das Express-Response-Objekt.
 */
async function getCurrentUser(req, res) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }
        res.json(user);
    } catch (error) {
        res.status(401).json({ message: 'Nicht autorisiert, Token ungültig.' });
    }
}

module.exports = getCurrentUser; 