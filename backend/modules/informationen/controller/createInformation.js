const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Erstellt eine neue Information
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 */
async function createInformation(req, res) {
    try {
        const {
            jahr,
            kalenderwoche,
            tag,
            einrichtung_id,
            einrichtung_name,
            titel,
            inhalt,
            prioritaet = 'normal'
        } = req.body;

        // Validierung
        if (!jahr || !kalenderwoche || !tag || !einrichtung_id || !einrichtung_name || !titel || !inhalt) {
            return res.status(400).json({
                success: false,
                message: 'Alle Pflichtfelder müssen ausgefüllt werden'
            });
        }

        const benutzer = req.user;
        const informationenOrdnerPfad = path.join(
            __dirname, 
            '../../../../shared/data/portal/informationen',
            jahr.toString()
        );

        const informationenDateiPfad = path.join(informationenOrdnerPfad, `${kalenderwoche}.json`);

        // Ordner erstellen falls nicht vorhanden
        await fs.mkdir(informationenOrdnerPfad, { recursive: true });

        // Bestehende Daten laden
        let informationenData = {};
        try {
            const fileContent = await fs.readFile(informationenDateiPfad, 'utf8');
            informationenData = JSON.parse(fileContent);
        } catch (error) {
            // Datei existiert noch nicht
            informationenData = {};
        }

        // Neue Information erstellen
        const neueInformation = {
            id: uuidv4(),
            titel: titel.trim(),
            inhalt: inhalt.trim(),
            prioritaet,
            erstellt_von: {
                benutzer_id: benutzer.id,
                benutzer_name: benutzer.name || benutzer.email,
                timestamp: new Date().toISOString()
            },
            bearbeitet_von: {
                benutzer_id: benutzer.id,
                benutzer_name: benutzer.name || benutzer.email,
                timestamp: new Date().toISOString()
            },
            read: false,
            soft_deleted: false,
            einrichtung_name
        };

        // Datenstruktur initialisieren
        if (!informationenData[tag]) {
            informationenData[tag] = {};
        }
        if (!informationenData[tag][einrichtung_id]) {
            informationenData[tag][einrichtung_id] = [];
        }

        // Information hinzufügen
        informationenData[tag][einrichtung_id].push(neueInformation);

        // Datei speichern
        await fs.writeFile(
            informationenDateiPfad, 
            JSON.stringify(informationenData, null, 2), 
            'utf8'
        );

        console.log(`✅ Neue Information erstellt: ${neueInformation.id} für ${tag} in ${einrichtung_name}`);

        res.status(201).json({
            success: true,
            message: 'Information erfolgreich erstellt',
            information: neueInformation
        });

    } catch (error) {
        console.error('Fehler beim Erstellen der Information:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Erstellen der Information'
        });
    }
}

module.exports = createInformation; 