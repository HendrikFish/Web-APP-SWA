const fs = require('fs').promises;
const path = require('path');

/**
 * Ruft Bewertungen für eine bestimmte Kalenderwoche ab
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 */
async function getBewertungen(req, res) {
    try {
        const { year, week } = req.params;
        
        // Parameter validieren
        const jahr = parseInt(year);
        const kalenderwoche = parseInt(week);
        
        if (isNaN(jahr) || isNaN(kalenderwoche) || kalenderwoche < 1 || kalenderwoche > 53) {
            return res.status(400).json({
                success: false,
                message: 'Ungültige Jahr- oder Kalenderwochen-Parameter'
            });
        }

        // Bewertungsdatei-Pfad
                const bewertungDateiPfad = path.join(
            __dirname,
            '../../../../shared/data/portal/bewertungen',
            jahr.toString(),
            `${kalenderwoche}.json`
        );

        try {
            // Bewertungen laden
            const bewertungenData = await fs.readFile(bewertungDateiPfad, 'utf8');
            const bewertungen = JSON.parse(bewertungenData);

            // Benutzer-spezifische Filterung (Benutzer sieht nur eigene Bewertungen)
            const benutzerId = req.user.id;
            const gefiltterteBewertungen = {
                ...bewertungen,
                bewertungen: {}
            };

            // Durch alle Tage iterieren
            Object.keys(bewertungen.bewertungen).forEach(tag => {
                gefiltterteBewertungen.bewertungen[tag] = {};
                
                // Durch alle Kategorien iterieren
                Object.keys(bewertungen.bewertungen[tag]).forEach(kategorie => {
                    const kategorieBewertungen = bewertungen.bewertungen[tag][kategorie] || [];
                    
                    // Nur eigene Bewertungen anzeigen
                    const eigeneBewertungen = kategorieBewertungen.filter(
                        bewertung => bewertung.benutzer_id === benutzerId
                    );
                    
                    if (eigeneBewertungen.length > 0) {
                        gefiltterteBewertungen.bewertungen[tag][kategorie] = eigeneBewertungen;
                    }
                });
            });

            // Statistiken berechnen
            let gesamtBewertungen = 0;
            let durchschnittGeschmack = 0;
            let durchschnittOptik = 0;
            let bewertungsSummeGeschmack = 0;
            let bewertungsSummeOptik = 0;

            Object.values(gefiltterteBewertungen.bewertungen).forEach(tag => {
                Object.values(tag).forEach(kategorieBewertungen => {
                    kategorieBewertungen.forEach(bewertung => {
                        gesamtBewertungen++;
                        bewertungsSummeGeschmack += bewertung.geschmack;
                        bewertungsSummeOptik += bewertung.optik;
                    });
                });
            });

            if (gesamtBewertungen > 0) {
                durchschnittGeschmack = Math.round((bewertungsSummeGeschmack / gesamtBewertungen) * 10) / 10;
                durchschnittOptik = Math.round((bewertungsSummeOptik / gesamtBewertungen) * 10) / 10;
            }

            res.json({
                success: true,
                message: `Bewertungen für KW ${kalenderwoche}/${jahr} geladen`,
                data: gefiltterteBewertungen,
                statistiken: {
                    gesamtBewertungen,
                    durchschnittGeschmack,
                    durchschnittOptik
                }
            });

        } catch (fileError) {
            // Datei existiert nicht - leere Struktur zurückgeben
            res.json({
                success: true,
                message: `Keine Bewertungen für KW ${kalenderwoche}/${jahr} gefunden`,
                data: {
                    kalenderwoche,
                    jahr,
                    bewertungen: {
                        montag: {},
                        dienstag: {},
                        mittwoch: {},
                        donnerstag: {},
                        freitag: {},
                        samstag: {},
                        sonntag: {}
                    }
                },
                statistiken: {
                    gesamtBewertungen: 0,
                    durchschnittGeschmack: 0,
                    durchschnittOptik: 0
                }
            });
        }

    } catch (error) {
        console.error('Fehler beim Abrufen der Bewertungen:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Abrufen der Bewertungen'
        });
    }
}

module.exports = { getBewertungen }; 