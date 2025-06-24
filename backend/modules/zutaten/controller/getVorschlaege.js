const fs = require('fs').promises;
const path = require('path');

// Robuster Pfad zur vorschlaege.json-Datei, basierend auf __dirname
const vorschlaegePath = path.resolve(__dirname, '../../../../shared/data/zutaten/vorschläge.json');

/**
 * Liest die Zutat-Vorschläge aus der JSON-Datei.
 * @param {object} req - Das Express-Request-Objekt.
 * @param {object} res - Das Express-Response-Objekt.
 */
async function getVorschlaege(req, res) {
    try {
        const data = await fs.readFile(vorschlaegePath, 'utf-8');
        const vorschlaegeArray = JSON.parse(data);

        // Intelligente Umwandlung, die mit Strings und Objekten umgehen kann
        const vorschlaegeObjekte = vorschlaegeArray.map(item => {
            if (typeof item === 'string') {
                return { name: item };
            }
            // Wenn es schon ein Objekt ist (z.B. {name: "..."}), wird es unverändert gelassen
            return item;
        }).filter(item => item && typeof item.name === 'string'); // Sicherstellen, dass nur valide Objekte durchkommen

        res.status(200).json(vorschlaegeObjekte);
    } catch (error) {
        console.error('Fehler beim Lesen der Vorschläge-Datei:', error);
        res.status(500).json({ message: 'Serverfehler beim Lesen der Vorschläge.' });
    }
}

module.exports = getVorschlaege; 