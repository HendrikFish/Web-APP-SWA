const fs = require('fs/promises');
const path = require('path');

const einrichtungenPath = path.join(__dirname, '../../../../shared/data/einrichtungen/einrichtungen.json');

/**
 * Löscht eine Einrichtung anhand ihrer ID.
 * @param {*} req - Das Request-Objekt von Express.
 * @param {*} res - Das Response-Objekt von Express.
 */
async function deleteEinrichtung(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Keine ID angegeben.' });
        }

        const data = await fs.readFile(einrichtungenPath, 'utf8');
        let einrichtungen = JSON.parse(data);

        const initialLength = einrichtungen.length;
        einrichtungen = einrichtungen.filter(e => e.id !== id);

        if (einrichtungen.length === initialLength) {
            return res.status(404).json({ message: 'Einrichtung mit dieser ID nicht gefunden.' });
        }

        await fs.writeFile(einrichtungenPath, JSON.stringify(einrichtungen, null, 2));

        res.status(200).json({ message: 'Einrichtung erfolgreich gelöscht.' });

    } catch (error) {
        console.error('Fehler beim Löschen der Einrichtung:', error);
        res.status(500).json({ message: 'Serverfehler beim Löschen der Einrichtung.' });
    }
}

module.exports = { deleteEinrichtung }; 