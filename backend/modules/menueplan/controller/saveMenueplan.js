const fs = require('fs').promises;
const path = require('path');

const saveMenueplan = async (req, res) => {
    const { year, week } = req.params;
    const planData = req.body;

    // Anreichern der Daten mit Server-Informationen
    planData.updatedAt = new Date().toISOString();
    planData.updatedBy = {
        userId: req.user.id,
        name: req.user.name
    };

    const dirPath = path.join(__dirname, `../../../../shared/data/menueplaene/${year}`);
    const filePath = path.join(dirPath, `${week}.json`);

    try {
        // Sicherstellen, dass das Verzeichnis existiert
        await fs.mkdir(dirPath, { recursive: true });
        
        // Daten in die Datei schreiben
        await fs.writeFile(filePath, JSON.stringify(planData, null, 2), 'utf8');
        
        res.status(200).json({ message: 'Menüplan erfolgreich gespeichert.', data: planData });
    } catch (error) {
        console.error("Fehler beim Speichern der Menüplan-Datei:", error);
        res.status(500).send('Serverfehler beim Speichern des Menüplans.');
    }
};

module.exports = { saveMenueplan }; 