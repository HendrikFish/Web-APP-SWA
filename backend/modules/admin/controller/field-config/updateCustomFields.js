const fs = require('fs').promises;
const path = require('path');

// Robuster Pfad, ausgehend vom Ausführungsverzeichnis des Backend-Prozesses
const fieldsConfigPath = path.resolve(process.cwd(), '../shared/config/custom-fields.json');

/**
 * Aktualisiert die Konfiguration für die benutzerdefinierten Registrierungsfelder.
 * @param {object} req - Das Express-Request-Objekt. Enthält die neue Konfiguration im Body.
 * @param {object} res - Das Express-Response-Objekt.
 */
async function updateCustomFields(req, res) {
    try {
        const newFields = req.body;

        // Validierung: Sicherstellen, dass wir ein Array erhalten
        if (!Array.isArray(newFields)) {
            return res.status(400).json({ message: 'Ungültiges Datenformat. Ein Array von Feld-Objekten wird erwartet.' });
        }

        // Die neue Konfiguration schön formatiert (mit Einrückung) in die Datei schreiben
        await fs.writeFile(fieldsConfigPath, JSON.stringify(newFields, null, 4), 'utf-8');

        res.status(200).json({ message: 'Konfiguration erfolgreich aktualisiert.', fields: newFields });
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Konfigurationsdatei:', error);
        res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Konfiguration.' });
    }
}

module.exports = updateCustomFields; 