const path = require('path');
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

// Zod-Schema zur Validierung der importierten Zutat-Objekte
// Wir sind hier liberal und verlangen nur den Namen.
const zutatImportSchema = z.object({
  name: z.string().min(1, 'Der Name der Zutat darf nicht leer sein.'),
  // Andere Felder sind optional, da sie ggf. nicht in der Importdatei vorhanden sind
}).passthrough(); // Erlaubt andere Felder, die nicht im Schema definiert sind

/**
 * @description Importiert neue Zutaten aus einer JSON-Datei.
 * Überspringt Duplikate basierend auf dem normalisierten Namen.
 */
const importZutaten = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: 'Keine Daten im Request Body gefunden.' });
    }

    try {
        const importData = req.body;

        // Validieren, dass die Importdaten ein Array sind
        const validationResult = z.array(zutatImportSchema).safeParse(importData);
        if (!validationResult.success) {
            return res.status(400).json({ 
                message: 'Ungültiges Datenformat. Es wird ein Array von Zutaten-Objekten erwartet.',
                errors: validationResult.error.flatten().fieldErrors 
            });
        }
        
        const validatedImportData = validationResult.data;
        const dataPath = path.resolve(__dirname, '../../../../shared/data/zutaten/zutaten.json');
        
        let existingZutaten = [];
        try {
            const fileContent = await fs.readFile(dataPath, 'utf-8');
            existingZutaten = JSON.parse(fileContent);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        const existingNames = new Set(existingZutaten.map(z => (z.name || '').trim().toLowerCase()));
        const newZutaten = [];
        let skippedCount = 0;

        for (const zutat of validatedImportData) {
            const normalizedName = (zutat.name || '').trim().toLowerCase();
            if (normalizedName && !existingNames.has(normalizedName)) {
                const newZutat = {
                    ...zutat,
                    id: uuidv4(),
                    isActive: true,
                    // Stelle sicher, dass der Name getrimmt ist
                    name: zutat.name.trim() 
                };
                newZutaten.push(newZutat);
                existingNames.add(normalizedName); // Verhindert Duplikate innerhalb der Importdatei
            } else {
                skippedCount++;
            }
        }

        if (newZutaten.length > 0) {
            const updatedZutaten = [...existingZutaten, ...newZutaten];
            await fs.writeFile(dataPath, JSON.stringify(updatedZutaten, null, 2), 'utf-8');
        }

        res.status(200).json({
            message: `Import abgeschlossen.`,
            importedCount: newZutaten.length,
            skippedCount: skippedCount
        });

    } catch (error) {
        console.error('Fehler beim Importieren der Zutaten:', error);
        res.status(500).json({ message: 'Serverfehler beim Importieren der Zutaten.' });
    }
};

module.exports = importZutaten; 