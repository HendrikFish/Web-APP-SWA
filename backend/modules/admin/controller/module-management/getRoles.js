const User = require('../../../../models/User.js'); 

/**
 * Ruft die Liste der verfügbaren Benutzerrollen direkt aus dem User-Schema ab.
 * Dies stellt sicher, dass die Rollenliste immer auf dem neuesten Stand ist.
 */
async function getRoles(req, res) {
    try {
        // Greife auf das Schema zu und hole die definierten enum-Werte für das 'role'-Feld.
        const roles = User.schema.path('role').enumValues;
        
        if (!roles) {
            return res.status(404).json({ message: 'Keine Rollen im Benutzermodell definiert.' });
        }

        res.status(200).json(roles);
    } catch (error) {
        console.error("Fehler beim Abrufen der Benutzerrollen:", error);
        res.status(500).json({ message: "Serverfehler beim Abrufen der Rollen." });
    }
}

module.exports = getRoles; 