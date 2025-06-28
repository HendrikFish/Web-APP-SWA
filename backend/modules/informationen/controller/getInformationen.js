const fs = require('fs').promises;
const path = require('path');

/**
 * Lädt Informationen für eine bestimmte Kalenderwoche
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 */
async function getInformationen(req, res) {
    try {
        const { jahr, kalenderwoche, einrichtung_id } = req.query;
        
        if (!jahr || !kalenderwoche || !einrichtung_id) {
            return res.status(400).json({
                success: false,
                message: 'Jahr, Kalenderwoche und Einrichtungs-ID sind erforderlich'
            });
        }

        const informationenDateiPfad = path.join(
            __dirname, 
            '../../../../shared/data/portal/informationen',
            jahr.toString(),
            `${kalenderwoche}.json`
        );

        let informationenData = {};

        try {
            const fileContent = await fs.readFile(informationenDateiPfad, 'utf8');
            informationenData = JSON.parse(fileContent);
        } catch (error) {
            // Datei existiert noch nicht oder ist leer
            console.log(`Informationen-Datei nicht gefunden: ${informationenDateiPfad}`);
        }

        // Filtere Informationen für die spezifische Einrichtung
        const einrichtungsInformationen = {};
        
        Object.keys(informationenData).forEach(tag => {
            if (informationenData[tag] && informationenData[tag][einrichtung_id]) {
                einrichtungsInformationen[tag] = informationenData[tag][einrichtung_id];
            }
        });

        res.json({
            success: true,
            informationen: einrichtungsInformationen,
            kalenderwoche: parseInt(kalenderwoche),
            jahr: parseInt(jahr),
            einrichtung_id
        });

    } catch (error) {
        console.error('Fehler beim Laden der Informationen:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Laden der Informationen'
        });
    }
}

module.exports = getInformationen; 