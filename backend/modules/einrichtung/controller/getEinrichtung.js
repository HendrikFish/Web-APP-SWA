const fs = require('fs/promises');
const path = require('path');

const einrichtungenPath = path.join(__dirname, '../../../../shared/data/einrichtungen/einrichtungen.json');

/**
 * Holt eine einzelne Einrichtung anhand ihrer ID.
 * @param {*} req - Das Request-Objekt von Express.
 * @param {*} res - Das Response-Objekt von Express.
 */
async function getEinrichtung(req, res) {
    try {
        const { id } = req.params;
        const data = await fs.readFile(einrichtungenPath, 'utf8');
        const einrichtungen = JSON.parse(data);
        const einrichtung = einrichtungen.find(e => e.id === id);

        if (einrichtung) {
            res.status(200).json(einrichtung);
        } else {
            res.status(404).json({ message: 'Einrichtung mit dieser ID nicht gefunden.' });
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Einrichtung:', error);
        res.status(500).json({ message: 'Serverfehler beim Abrufen der Einrichtung.' });
    }
}

module.exports = { getEinrichtung }; 