const fs = require('fs').promises;
const path = require('path');

const dataFilePath = path.resolve(__dirname, '../../../../shared/data/zutaten/zutaten.json');

async function readData() {
    try {
        const data = await fs.readFile(dataFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeData(data) {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

const deleteZutat = async (req, res) => {
    try {
        let zutaten = await readData();
        const zutatId = parseInt(req.params.id, 10);

        const zutatIndex = zutaten.findIndex(z => z.zutatennummer === zutatId);

        if (zutatIndex === -1) {
            return res.status(404).json({ message: 'Zutat nicht gefunden' });
        }
        
        // Soft-Delete: Zutat als inaktiv markieren
        zutaten[zutatIndex].isActive = false;

        await writeData(zutaten);

        res.status(204).send();

    } catch (error) {
        console.error('Fehler beim Deaktivieren der Zutat:', error);
        res.status(500).json({ message: 'Serverfehler beim Deaktivieren der Zutat' });
    }
};

module.exports = { deleteZutat }; 