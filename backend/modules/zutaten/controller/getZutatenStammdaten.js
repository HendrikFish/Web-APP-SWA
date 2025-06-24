const fs = require('fs').promises;
const path = require('path');

// Robuster Pfad zur zutaten-stammdaten.json-Datei
const stammdatenPath = path.resolve(process.cwd(), '../shared/data/zutaten/zutaten-stammdaten.json');

/**
 * Liest die Stammdaten (Kategorien, Lieferanten etc.) für die Zutatenerfassung.
 * @param {object} req - Das Express-Request-Objekt.
 * @param {object} res - Das Express-Response-Objekt.
 */
async function getZutatenStammdaten(req, res) {
    try {
        const data = await fs.readFile(stammdatenPath, 'utf-8');
        const stammdaten = JSON.parse(data);
        res.status(200).json(stammdaten);
    } catch (error) {
        console.error('Fehler beim Lesen der Zutaten-Stammdaten:', error);
        res.status(500).json({ message: 'Serverfehler beim Lesen der Stammdaten.' });
    }
}

module.exports = getZutatenStammdaten; 