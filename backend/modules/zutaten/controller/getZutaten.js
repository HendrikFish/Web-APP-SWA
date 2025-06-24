const fs = require('fs').promises;
const path = require('path');

// Robuster Pfad zur zutaten.json-Datei
const zutatenDataPath = path.resolve(__dirname, '../../../../shared/data/zutaten/zutaten.json');

/**
 * Liest die Zutatenliste aus der JSON-Datei.
 * @param {object} req - Das Express-Request-Objekt.
 * @param {object} res - Das Express-Response-Objekt.
 */
async function getZutaten(req, res) {
    try {
        const data = await fs.readFile(zutatenDataPath, 'utf-8');
        let zutaten = JSON.parse(data);

        // Nur aktive Zutaten zurückgeben (oder solche ohne den Status, für Altdaten)
        let aktiveZutaten = zutaten.filter(zutat => zutat.isActive !== false);
        
        // WORKAROUND: Kopiere die 'verwendungseinheit' auf die oberste Ebene als 'einheit'
        // um das Frontend-Problem zu umgehen.
        aktiveZutaten = aktiveZutaten.map(zutat => {
            return {
                ...zutat,
                einheit: zutat.preis?.verwendungseinheit || 'Stk'
            };
        });

        res.status(200).json(aktiveZutaten);
    } catch (error) {
        console.error('Fehler beim Lesen der Zutaten-Datei:', error);
        res.status(500).json({ message: 'Serverfehler beim Lesen der Zutaten.' });
    }
}

module.exports = getZutaten;