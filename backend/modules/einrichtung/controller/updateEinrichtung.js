const fs = require('fs/promises');
const path = require('path');
const { einrichtungSchema } = require('../../../../shared/einrichtungen/einrichtung.validation');

const einrichtungenPath = path.join(__dirname, '../../../../shared/data/einrichtungen/einrichtungen.json');

/**
 * Aktualisiert eine bestehende Einrichtung.
 * @param {*} req - Das Request-Objekt von Express.
 * @param {*} res - Das Response-Objekt von Express.
 */
async function updateEinrichtung(req, res) {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Zod-Validierung
        const validationResult = einrichtungSchema.safeParse(updatedData);
        if (!validationResult.success) {
            return res.status(400).json({ 
                message: 'Validierungsfehler.',
                errors: validationResult.error.flatten().fieldErrors 
            });
        }

        const data = await fs.readFile(einrichtungenPath, 'utf8');
        let einrichtungen = JSON.parse(data);

        const index = einrichtungen.findIndex(e => e.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Einrichtung mit dieser ID nicht gefunden.' });
        }

        einrichtungen[index] = { ...validationResult.data, id: id };

        await fs.writeFile(einrichtungenPath, JSON.stringify(einrichtungen, null, 2));

        res.status(200).json(einrichtungen[index]);

    } catch (error) {
        console.error('Fehler beim Aktualisieren der Einrichtung:', error);
        res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Einrichtung.' });
    }
}

module.exports = { updateEinrichtung }; 