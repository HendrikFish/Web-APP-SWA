const path = require('path');
const fs = require('fs/promises');

/**
 * @description Exportiert alle aktiven Zutaten als JSON-Datei.
 * Liest die zentrale `zutaten.json`-Datei, filtert alle Zutaten heraus,
 * die als inaktiv (`isActive: false`) markiert sind, und sendet
 * das Ergebnis als JSON-Datei-Download an den Client.
 */
const exportZutaten = async (req, res) => {
    try {
        const dataPath = path.resolve(__dirname, '../../../../shared/data/zutaten/zutaten.json');
        
        let zutaten = [];
        try {
            const fileContent = await fs.readFile(dataPath, 'utf-8');
            zutaten = JSON.parse(fileContent);
        } catch (error) {
            // Wenn die Datei nicht existiert, einfach ein leeres Array zurückgeben
            if (error.code === 'ENOENT') {
                console.log('zutaten.json nicht gefunden. Exportiere leere Liste.');
            } else {
                throw error; // Andere Lesefehler weiterwerfen
            }
        }

        // Filtere nur die aktiven Zutaten
        const aktiveZutaten = zutaten.filter(z => z.isActive !== false);

        // Setze Header für den Dateidownload
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=zutaten-export.json');
        
        // Sende die Daten als formattierten String, nicht als minified JSON
        res.status(200).send(JSON.stringify(aktiveZutaten, null, 2));

    } catch (error) {
        console.error('Fehler beim Exportieren der Zutaten:', error);
        res.status(500).json({ message: 'Serverfehler beim Exportieren der Zutaten.' });
    }
};

module.exports = exportZutaten; 