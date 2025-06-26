const fs = require('fs').promises;
const path = require('path');

/**
 * Ruft Auswertung und Statistiken für eine Kalenderwoche ab
 * (Für Küchenpersonal - zeigt alle Bewertungen aller Benutzer)
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 */
async function getAuswertung(req, res) {
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

            // Statistiken und Auswertungen berechnen
            const auswertung = {
                kalenderwoche,
                jahr,
                gesamtStatistiken: {
                    gesamtBewertungen: 0,
                    durchschnittGeschmack: 0,
                    durchschnittOptik: 0,
                    einrichtungenAnzahl: new Set(),
                    benutzerAnzahl: new Set()
                },
                verbesserungsvorschlaege: [],
                schlechteBewertungen: [], // Bewertungen mit 1-2 Sternen
                topBewertungen: [] // Bewertungen mit 5 Sternen
            };

            let bewertungsSummeGeschmack = 0;
            let bewertungsSummeOptik = 0;
            let gesamtBewertungen = 0;

            // Durch alle Tage und Kategorien iterieren
            Object.keys(bewertungen.bewertungen).forEach(tag => {
                Object.keys(bewertungen.bewertungen[tag]).forEach(kategorie => {
                    const kategorieBewertungen = bewertungen.bewertungen[tag][kategorie] || [];

                    kategorieBewertungen.forEach(bewertung => {
                        gesamtBewertungen++;
                        bewertungsSummeGeschmack += bewertung.geschmack;
                        bewertungsSummeOptik += bewertung.optik;

                        // Einrichtungen und Benutzer tracking
                        auswertung.gesamtStatistiken.einrichtungenAnzahl.add(bewertung.einrichtung_id);
                        auswertung.gesamtStatistiken.benutzerAnzahl.add(bewertung.benutzer_id);

                        // Verbesserungsvorschläge sammeln
                        auswertung.verbesserungsvorschlaege.push({
                            tag,
                            kategorie,
                            einrichtung: bewertung.einrichtung_name,
                            benutzer: bewertung.benutzer_name,
                            rezepte: bewertung.rezepte,
                            geschmack: bewertung.geschmack,
                            optik: bewertung.optik,
                            vorschlag: bewertung.verbesserungsvorschlag,
                            timestamp: bewertung.timestamp
                        });

                        // Schlechte Bewertungen (1-2 Sterne)
                        if (bewertung.geschmack <= 2 || bewertung.optik <= 2) {
                            auswertung.schlechteBewertungen.push({
                                tag,
                                kategorie,
                                einrichtung: bewertung.einrichtung_name,
                                benutzer: bewertung.benutzer_name,
                                rezepte: bewertung.rezepte,
                                geschmack: bewertung.geschmack,
                                optik: bewertung.optik,
                                vorschlag: bewertung.verbesserungsvorschlag
                            });
                        }

                        // Top Bewertungen (5 Sterne)
                        if (bewertung.geschmack === 5 && bewertung.optik === 5) {
                            auswertung.topBewertungen.push({
                                tag,
                                kategorie,
                                einrichtung: bewertung.einrichtung_name,
                                benutzer: bewertung.benutzer_name,
                                rezepte: bewertung.rezepte,
                                vorschlag: bewertung.verbesserungsvorschlag
                            });
                        }
                    });
                });
            });

            // Durchschnitte berechnen
            if (gesamtBewertungen > 0) {
                auswertung.gesamtStatistiken.gesamtBewertungen = gesamtBewertungen;
                auswertung.gesamtStatistiken.durchschnittGeschmack = Math.round((bewertungsSummeGeschmack / gesamtBewertungen) * 10) / 10;
                auswertung.gesamtStatistiken.durchschnittOptik = Math.round((bewertungsSummeOptik / gesamtBewertungen) * 10) / 10;
                auswertung.gesamtStatistiken.einrichtungenAnzahl = auswertung.gesamtStatistiken.einrichtungenAnzahl.size;
                auswertung.gesamtStatistiken.benutzerAnzahl = auswertung.gesamtStatistiken.benutzerAnzahl.size;
            }

            res.json({
                success: true,
                message: `Auswertung für KW ${kalenderwoche}/${jahr} erstellt`,
                auswertung
            });

        } catch (fileError) {
            // Datei existiert nicht
            res.json({
                success: true,
                message: `Keine Bewertungen für KW ${kalenderwoche}/${jahr} gefunden`,
                auswertung: {
                    kalenderwoche,
                    jahr,
                    gesamtStatistiken: {
                        gesamtBewertungen: 0,
                        durchschnittGeschmack: 0,
                        durchschnittOptik: 0,
                        einrichtungenAnzahl: 0,
                        benutzerAnzahl: 0
                    },
                    verbesserungsvorschlaege: [],
                    schlechteBewertungen: [],
                    topBewertungen: []
                }
            });
        }

    } catch (error) {
        console.error('Fehler beim Erstellen der Auswertung:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Erstellen der Auswertung'
        });
    }
}

module.exports = { getAuswertung }; 