const fs = require('fs').promises;
const path = require('path');

const dataFilePath = path.resolve(__dirname, '../../../../shared/data/zutaten/zutaten.json');

async function readData() {
    try {
        const data = await fs.readFile(dataFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Wenn die Datei nicht existiert, ein leeres Array zurückgeben
        }
        throw error;
    }
}

async function writeData(data) {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

const updateZutat = async (req, res) => {
    try {
        const zutaten = await readData();
        const zutatId = parseInt(req.params.id, 10);
        const { name, kategorie, lieferant, preis, allergene, herkunft, naehrwerte } = req.body;

        const zutatIndex = zutaten.findIndex(z => z.zutatennummer === zutatId);

        if (zutatIndex === -1) {
            return res.status(404).json({ message: 'Zutat nicht gefunden' });
        }

        // Stelle sicher, dass die zutatennummer unverändert bleibt und die Struktur bereinigt wird
        const zutatToUpdate = {
            ...zutaten[zutatIndex], // Behält alte Felder wie 'id' bei
            name,
            kategorie,
            lieferant,
            preis: { // Stellt die saubere, verschachtelte Struktur sicher
                basis: preis.basis,
                basiseinheit: preis.basiseinheit,
                verwendungseinheit: preis.verwendungseinheit,
                umrechnungsfaktor: preis.umrechnungsfaktor
            },
            herkunft: herkunft,
            allergene: allergene || [],
            naehrwerte: naehrwerte || {},
            zutatennummer: zutatId 
        };
        
        // Alte, flache Preis-Schlüssel entfernen, falls vorhanden
        delete zutatToUpdate.preis_basis;
        delete zutatToUpdate.basiseinheit;
        delete zutatToUpdate.verwendungseinheit;

        // Ersetze die alte Zutat durch die aktualisierte Version
        zutaten[zutatIndex] = zutatToUpdate;

        await writeData(zutaten);

        res.status(200).json(zutatToUpdate);

    } catch (error) {
        console.error('Fehler beim Aktualisieren der Zutat:', error);
        res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Zutat' });
    }
};

module.exports = { updateZutat }; 