const fs = require('fs/promises');
const path = require('path');

const stammdatenPath = path.join(__dirname, '../../../../shared/data/einrichtungen/einrichtungen-stammdaten.json');

/**
 * Liest die Stammdaten für das Einrichtungsformular.
 * @param {*} req - Das Request-Objekt von Express.
 * @param {*} res - Das Response-Objekt von Express.
 */
async function getEinrichtungStammdaten(req, res) {
    try {
        const data = await fs.readFile(stammdatenPath, 'utf8');
        res.status(200).json(JSON.parse(data));
    } catch (error) {
        console.error('Fehler beim Lesen der Einrichtungs-Stammdaten:', error);
        res.status(500).json({ message: 'Serverfehler beim Laden der Stammdaten.' });
    }
}

module.exports = { getEinrichtungStammdaten }; 