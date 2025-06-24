const fs = require('fs/promises');
const path = require('path');

const einrichtungenPath = path.join(__dirname, '../../../../shared/data/einrichtungen/einrichtungen.json');

/**
 * Liest alle Einrichtungen aus der JSON-Datei.
 * @param {*} req - Das Request-Objekt von Express.
 * @param {*} res - Das Response-Objekt von Express.
 */
async function getEinrichtungen(req, res) {
    try {
        const data = await fs.readFile(einrichtungenPath, 'utf8');
        const einrichtungen = JSON.parse(data);
        // Optional: Sortieren, Paginieren, etc. könnte hier hinzugefügt werden.
        res.status(200).json(einrichtungen);
    } catch (error) {
        console.error('Fehler beim Lesen der Einrichtungen:', error);
        res.status(500).json({ message: 'Serverfehler beim Laden der Einrichtungen.' });
    }
}

module.exports = { getEinrichtungen }; 