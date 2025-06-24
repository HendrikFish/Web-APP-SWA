const fs = require('fs').promises;
const path = require('path');

const getMenueplan = async (req, res) => {
    const { year, week } = req.params;
    const filePath = path.join(__dirname, `../../../../shared/data/menueplaene/${year}/${week}.json`);

    try {
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Datei nicht gefunden, was in Ordnung ist. Ein neuer Plan kann erstellt werden.
            // Frontend erwartet: { year, week, days: {} } - nicht { jahr, kw, plan: {} }
            res.status(200).json({
                year: parseInt(year, 10),
                week: parseInt(week, 10),
                days: {} // Leeres Plan-Objekt mit korrekter Struktur
            });
        } else {
            console.error("Fehler beim Lesen der Menüplan-Datei:", error);
            res.status(500).send('Serverfehler beim Lesen des Menüplans.');
        }
    }
};

module.exports = { getMenueplan }; 