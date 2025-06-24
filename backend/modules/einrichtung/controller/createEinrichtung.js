const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { einrichtungSchema } = require('../../../../shared/einrichtungen/einrichtung.validation');

const einrichtungenPath = path.join(__dirname, '../../../../shared/data/einrichtungen/einrichtungen.json');

/**
 * Erstellt eine neue Einrichtung und speichert sie.
 * @param {*} req - Das Request-Objekt von Express.
 * @param {*} res - Das Response-Objekt von Express.
 */
async function createEinrichtung(req, res) {
    try {
        const neueEinrichtungData = req.body;
        
        // Zod-Validierung
        const validationResult = einrichtungSchema.safeParse(neueEinrichtungData);
        if (!validationResult.success) {
            return res.status(400).json({ 
                message: 'Validierungsfehler.',
                errors: validationResult.error.flatten().fieldErrors 
            });
        }
        
        const data = await fs.readFile(einrichtungenPath, 'utf8');
        const einrichtungen = JSON.parse(data);

        const neueEinrichtung = { ...validationResult.data, id: uuidv4() };
        einrichtungen.push(neueEinrichtung);

        await fs.writeFile(einrichtungenPath, JSON.stringify(einrichtungen, null, 2));

        res.status(201).json(neueEinrichtung);

    } catch (error) {
        console.error('Fehler beim Erstellen der Einrichtung:', error);
        res.status(500).json({ message: 'Serverfehler beim Erstellen der Einrichtung.' });
    }
}

module.exports = { createEinrichtung }; 