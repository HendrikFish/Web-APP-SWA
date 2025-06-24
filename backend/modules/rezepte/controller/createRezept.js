const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataPath = path.resolve(__dirname, '../../../../shared/data/rezepte/rezepte.json');

async function readRezepte() {
    try {
        const data = await fs.readFile(dataPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Wenn Datei nicht existiert, starte mit leerem Array
        }
        throw error;
    }
}

/**
 * Erstellt ein neues Rezept.
 * @param {*} req Das Anfrage-Objekt.
 * @param {*} res Das Antwort-Objekt.
 */
const createRezept = async (req, res) => {
    try {
        const rezepte = await readRezepte();
        const neuesRezept = {
            id: `rezept-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            ...req.body,
            createdAt: new Date().toISOString(),
            createdBy: {
                userId: req.user.id,
                name: req.user.name || 'Unbekannt'
            },
            updatedBy: {
                userId: req.user.id,
                name: req.user.name || 'Unbekannt'
            },
            isActive: true
        };

        // Validierung (einfach)
        if (!neuesRezept || !neuesRezept.name || !neuesRezept.zutaten) {
            return res.status(400).json({ message: 'Name und Zutaten sind erforderlich.' });
        }

        rezepte.push(neuesRezept);

        await fs.writeFile(dataPath, JSON.stringify(rezepte, null, 2), 'utf-8');

        res.status(201).json(neuesRezept);
    } catch (error) {
        console.error('Fehler beim Erstellen des Rezepts:', error);
        res.status(500).json({ message: 'Fehler beim Speichern des Rezepts.' });
    }
};

module.exports = { createRezept }; 