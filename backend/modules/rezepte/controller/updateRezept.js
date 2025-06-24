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
 * Aktualisiert ein bestehendes Rezept.
 * @param {*} req Das Anfrage-Objekt.
 * @param {*} res Das Antwort-Objekt.
 */
const updateRezept = async (req, res) => {
    try {
        const rezepte = await readRezepte();
        const { id } = req.params;
        const updatedRezeptDaten = req.body;

        const rezeptIndex = rezepte.findIndex(r => r.id === id);

        if (rezeptIndex === -1) {
            return res.status(404).json({ message: 'Rezept nicht gefunden.' });
        }

        // Stelle sicher, dass die ID und der Aktiv-Status nicht überschrieben werden
        const finalRezept = { 
            ...rezepte[rezeptIndex], 
            ...updatedRezeptDaten, 
            id: rezepte[rezeptIndex].id,
            createdAt: rezepte[rezeptIndex].createdAt || new Date().toISOString(),
            isActive: rezepte[rezeptIndex].isActive,
            updatedAt: new Date().toISOString(),
            updatedBy: {
                userId: req.user.id,
                name: req.user.name || 'Unbekannt'
            }
        };

        rezepte[rezeptIndex] = finalRezept;

        await fs.writeFile(dataPath, JSON.stringify(rezepte, null, 2), 'utf-8');

        res.status(200).json(finalRezept);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Rezepts:', error);
        res.status(500).json({ message: 'Fehler beim Speichern des Rezepts.' });
    }
};

module.exports = { updateRezept }; 