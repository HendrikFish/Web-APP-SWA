const fs = require('fs/promises');
const path = require('path');

const dataPath = path.resolve(__dirname, '../../../../shared/data/rezepte/rezepte.json');

async function readRezepte() {
    try {
        const data = await fs.readFile(dataPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

/**
 * Führt einen Soft-Delete für ein Rezept durch (setzt isActive auf false).
 * @param {*} req Das Anfrage-Objekt.
 * @param {*} res Das Antwort-Objekt.
 */
const deleteRezept = async (req, res) => {
    try {
        const rezepte = await readRezepte();
        const { id } = req.params;

        const rezeptIndex = rezepte.findIndex(r => r.id === id);

        if (rezeptIndex === -1) {
            // Selbst wenn nicht gefunden, einen Erfolg zurückgeben, da das Ziel (gelöscht) erreicht ist
            return res.status(204).send();
        }

        rezepte[rezeptIndex].isActive = false;

        await fs.writeFile(dataPath, JSON.stringify(rezepte, null, 2), 'utf-8');

        res.status(204).send(); // 204 No Content ist passend für ein erfolgreiches Löschen
    } catch (error) {
        console.error('Fehler beim Löschen des Rezepts:', error);
        res.status(500).json({ message: 'Fehler beim Löschen des Rezepts.' });
    }
};

module.exports = { deleteRezept };