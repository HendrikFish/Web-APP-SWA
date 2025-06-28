const fs = require('fs').promises;
const path = require('path');

/**
 * Aktualisiert eine existierende Information
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 */
async function updateInformation(req, res) {
    try {
        const { informationId } = req.params;
        const {
            titel,
            inhalt,
            prioritaet
        } = req.body;

        if (!titel || !inhalt) {
            return res.status(400).json({
                success: false,
                message: 'Titel und Inhalt sind erforderlich'
            });
        }

        const benutzer = req.user;
        
        // Durchsuche alle Jahre und Kalenderwochen nach der Information
        const informationenBasisPfad = path.join(
            __dirname, 
            '../../../../shared/data/portal/informationen'
        );

        let informationGefunden = false;
        let informationenData = {};
        let dateiPfad = '';

        try {
            const jahre = await fs.readdir(informationenBasisPfad);
            
            outerLoop: for (const jahr of jahre) {
                const jahrPfad = path.join(informationenBasisPfad, jahr);
                
                try {
                    const kalenderwochen = await fs.readdir(jahrPfad);
                    
                    for (const kalenderwochenDatei of kalenderwochen) {
                        if (!kalenderwochenDatei.endsWith('.json')) continue;
                        
                        dateiPfad = path.join(jahrPfad, kalenderwochenDatei);
                        
                        try {
                            const fileContent = await fs.readFile(dateiPfad, 'utf8');
                            informationenData = JSON.parse(fileContent);
                            
                            // Suche Information in allen Tagen und Einrichtungen
                            for (const tag of Object.keys(informationenData)) {
                                for (const einrichtungId of Object.keys(informationenData[tag])) {
                                    const informationen = informationenData[tag][einrichtungId];
                                    
                                    const informationIndex = informationen.findIndex(
                                        info => info.id === informationId && !info.soft_deleted
                                    );
                                    
                                    if (informationIndex !== -1) {
                                        // Information gefunden und aktualisieren
                                        const information = informationen[informationIndex];
                                        
                                        // Prüfen ob Benutzer berechtigt ist (nur eigene oder Admin)
                                        if (information.erstellt_von.benutzer_id !== benutzer.id && benutzer.role !== 'admin') {
                                            return res.status(403).json({
                                                success: false,
                                                message: 'Keine Berechtigung zum Bearbeiten dieser Information'
                                            });
                                        }
                                        
                                        // Information aktualisieren
                                        informationen[informationIndex] = {
                                            ...information,
                                            titel: titel.trim(),
                                            inhalt: inhalt.trim(),
                                            prioritaet: prioritaet || information.prioritaet,
                                            bearbeitet_von: {
                                                benutzer_id: benutzer.id,
                                                benutzer_name: benutzer.name || benutzer.email,
                                                timestamp: new Date().toISOString()
                                            }
                                        };
                                        
                                        informationGefunden = true;
                                        break outerLoop;
                                    }
                                }
                            }
                            
                        } catch (readError) {
                            // Datei konnte nicht gelesen werden, weitermachen
                            continue;
                        }
                    }
                } catch (dirError) {
                    // Verzeichnis existiert nicht, weitermachen
                    continue;
                }
            }
        } catch (error) {
            console.error('Fehler beim Durchsuchen der Informationen:', error);
        }

        if (!informationGefunden) {
            return res.status(404).json({
                success: false,
                message: 'Information nicht gefunden oder keine Berechtigung'
            });
        }

        // Datei speichern
        await fs.writeFile(dateiPfad, JSON.stringify(informationenData, null, 2), 'utf8');

        console.log(`✅ Information ${informationId} von Benutzer ${benutzer.id} aktualisiert`);

        res.json({
            success: true,
            message: 'Information erfolgreich aktualisiert',
            informationId
        });

    } catch (error) {
        console.error('Fehler beim Aktualisieren der Information:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Aktualisieren der Information'
        });
    }
}

module.exports = updateInformation; 