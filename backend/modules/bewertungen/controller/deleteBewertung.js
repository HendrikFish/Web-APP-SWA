const fs = require('fs').promises;
const path = require('path');

/**
 * Löscht eine Bewertung (nur eigene Bewertungen)
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 */
async function deleteBewertung(req, res) {
    try {
        const { bewertungId } = req.params;
        const benutzerId = req.user.id;

        if (!bewertungId) {
            return res.status(400).json({
                success: false,
                message: 'Bewertungs-ID ist erforderlich'
            });
        }

        // Alle Bewertungsdateien durchsuchen (letzte 2 Jahre)
        const aktuellesJahr = new Date().getFullYear();
        const jahre = [aktuellesJahr - 1, aktuellesJahr];
        
        let bewertungGefunden = false;
        let gefundenInDatei = null;

        for (const jahr of jahre) {
            const jahresVerzeichnis = path.join(
                __dirname, 
                '../../../../shared/data/portal/bewertungen',
                jahr.toString()
            );

            try {
                const dateien = await fs.readdir(jahresVerzeichnis);
                
                for (const datei of dateien) {
                    if (!datei.endsWith('.json')) continue;

                    const bewertungDateiPfad = path.join(jahresVerzeichnis, datei);
                    
                    try {
                        const bewertungenData = await fs.readFile(bewertungDateiPfad, 'utf8');
                        const bewertungen = JSON.parse(bewertungenData);

                        // Durch alle Tage und Kategorien suchen
                        let bewertungEntfernt = false;
                        Object.keys(bewertungen.bewertungen).forEach(tag => {
                            Object.keys(bewertungen.bewertungen[tag]).forEach(kategorie => {
                                const kategorieBewertungen = bewertungen.bewertungen[tag][kategorie] || [];
                                
                                const bewertungIndex = kategorieBewertungen.findIndex(
                                    bewertung => bewertung.id === bewertungId && bewertung.benutzer_id === benutzerId
                                );

                                if (bewertungIndex !== -1) {
                                    // Bewertung gefunden und gehört dem aktuellen Benutzer
                                    kategorieBewertungen.splice(bewertungIndex, 1);
                                    bewertungGefunden = true;
                                    bewertungEntfernt = true;
                                    gefundenInDatei = bewertungDateiPfad;
                                }
                            });
                        });

                        // Datei aktualisieren wenn Bewertung entfernt wurde
                        if (bewertungEntfernt) {
                            await fs.writeFile(
                                bewertungDateiPfad, 
                                JSON.stringify(bewertungen, null, 2), 
                                'utf8'
                            );
                            break;
                        }

                    } catch (readError) {
                        // Datei konnte nicht gelesen werden, weitermachen
                        continue;
                    }
                }

                if (bewertungGefunden) break;

            } catch (dirError) {
                // Verzeichnis existiert nicht, weitermachen
                continue;
            }
        }

        if (!bewertungGefunden) {
            return res.status(404).json({
                success: false,
                message: 'Bewertung nicht gefunden oder Sie haben keine Berechtigung, diese zu löschen'
            });
        }

        console.log(`✅ Bewertung ${bewertungId} von Benutzer ${benutzerId} gelöscht`);

        res.json({
            success: true,
            message: 'Bewertung erfolgreich gelöscht',
            bewertungId
        });

    } catch (error) {
        console.error('Fehler beim Löschen der Bewertung:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Löschen der Bewertung'
        });
    }
}

module.exports = { deleteBewertung }; 