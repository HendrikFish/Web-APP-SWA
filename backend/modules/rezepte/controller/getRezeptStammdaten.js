const fs = require('fs/promises');
const path = require('path');

const dataPath = path.resolve(__dirname, '../../../../shared/data/rezepte/rezept-stammdaten.json');

/**
 * Lädt und sendet die Stammdaten für Rezepte (z.B. Kategorien).
 * @param {*} req Das Anfrage-Objekt.
 * @param {*} res Das Antwort-Objekt.
 */
const getRezeptStammdaten = async (req, res) => {
    try {
        const stammdatenJSON = await fs.readFile(dataPath, 'utf-8');
        const stammdaten = JSON.parse(stammdatenJSON);
        res.status(200).json(stammdaten);
    } catch (error) {
        console.error('Fehler beim Lesen der Rezept-Stammdaten:', error);
        res.status(500).json({ message: 'Fehler beim Laden der Stammdaten für Rezepte.' });
    }
};

module.exports = { getRezeptStammdaten };