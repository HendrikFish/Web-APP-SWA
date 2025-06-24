const fs = require('fs').promises;
const path = require('path');

// Robuster Pfad, ausgehend vom Ausführungsverzeichnis des Backend-Prozesses
const fieldsConfigPath = path.resolve(process.cwd(), '../shared/config/custom-fields.json');

/**
 * Liest die Konfiguration für die benutzerdefinierten Registrierungsfelder.
 * @param {object} req - Das Express-Request-Objekt.
 * @param {object} res - Das Express-Response-Objekt.
 */
async function getCustomFields(req, res) {
    try {
        const data = await fs.readFile(fieldsConfigPath, 'utf-8');
        const fields = JSON.parse(data);
        res.status(200).json(fields);
    } catch (error) {
        console.error('Fehler beim Lesen der Konfigurationsdatei für benutzerdefinierte Felder:', error);
        res.status(500).json({ message: 'Serverfehler beim Lesen der Konfiguration.' });
    }
}

module.exports = getCustomFields; 