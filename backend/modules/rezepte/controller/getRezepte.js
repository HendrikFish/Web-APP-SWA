const fs = require('fs/promises');
const path = require('path');

const dataPath = path.resolve(__dirname, '../../../../shared/data/rezepte/rezepte.json');

/**
 * Liest alle Rezepte aus der JSON-Datei und gibt nur die aktiven zurück.
 * @param {*} req Das Anfrage-Objekt.
 * @param {*} res Das Antwort-Objekt.
 */
const getRezepte = async (req, res) => {
    try {
        const rezepteJSON = await fs.readFile(dataPath, 'utf-8');
        const rezepte = JSON.parse(rezepteJSON);

        // Gemäß "Soft Delete"-Muster nur aktive Rezepte senden
        const aktiveRezepte = rezepte.filter(rezept => rezept.isActive !== false);

        res.status(200).json(aktiveRezepte);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Wenn die Datei nicht existiert, eine leere Liste zurückgeben
            return res.status(200).json([]);
        }
        console.error('Fehler beim Lesen der Rezepte:', error);
        res.status(500).json({ message: 'Fehler beim Laden der Rezepte.' });
    }
};

module.exports = { getRezepte }; 