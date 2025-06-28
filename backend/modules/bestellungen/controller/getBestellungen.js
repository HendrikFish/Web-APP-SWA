const fs = require('fs').promises;
const path = require('path');

/**
 * Lädt Bestellungen für eine spezifische Kalenderwoche
 * @param {object} req - Express Request mit Jahr und Woche als Parameter
 * @param {object} res - Express Response
 */
async function getBestellungen(req, res) {
    try {
        const { year, week } = req.params;
        
        // Input-Validierung
        if (!year || !week) {
            return res.status(400).json({
                success: false,
                message: 'Jahr und Kalenderwoche sind erforderlich'
            });
        }

        // Pfad zur Bestellungsdatei
        const bestellungsdateiPfad = path.join(
            __dirname, 
            '../../../../shared/data/portal/bestellungen',
            year.toString(),
            `${week.toString().padStart(2, '0')}.json`
        );

        // Prüfen ob Datei existiert
        try {
            await fs.access(bestellungsdateiPfad);
        } catch (error) {
            // Datei existiert nicht - leere Bestellungen zurückgeben
            const vorlageBestellungen = await createEmptyBestellungen(year, week);
            return res.json({
                success: true,
                bestellungen: vorlageBestellungen,
                message: 'Keine Bestellungen für diese Woche gefunden - leere Vorlage erstellt'
            });
        }

        // Bestellungsdatei lesen
        const bestellungenData = await fs.readFile(bestellungsdateiPfad, 'utf-8');
        const bestellungen = JSON.parse(bestellungenData);

        res.json({
            success: true,
            bestellungen,
            message: `Bestellungen für KW ${week}/${year} geladen`
        });

    } catch (error) {
        console.error('Fehler beim Laden der Bestellungen:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Laden der Bestellungen'
        });
    }
}

/**
 * Erstellt leere Bestellungen basierend auf der Vorlage
 * @param {string} year - Jahr
 * @param {string} week - Kalenderwoche
 * @returns {object} Leere Bestellungsstruktur
 */
async function createEmptyBestellungen(year, week) {
    try {
        // Vorlage laden
        const vorlagePfad = path.join(
            __dirname, 
            '../../../../shared/data/portal/bestellungen/vorlage.json'
        );
        
        const vorlageData = await fs.readFile(vorlagePfad, 'utf-8');
        const vorlage = JSON.parse(vorlageData);
        
        // Vorlage mit aktuellen Daten füllen
        const leereBestellungen = {
            ...vorlage,
            year: parseInt(year),
            week: parseInt(week),
            erstellt_am: new Date().toISOString(),
            letzte_änderung: new Date().toISOString()
        };
        
        // _vorlage_hinweise entfernen
        delete leereBestellungen._vorlage_hinweise;
        
        return leereBestellungen;
        
    } catch (error) {
        console.error('Fehler beim Erstellen der leeren Bestellungen:', error);
        // Fallback: Minimal-Struktur
        return {
            year: parseInt(year),
            week: parseInt(week),
            erstellt_am: new Date().toISOString(),
            letzte_änderung: new Date().toISOString(),
            einrichtungen: {},
            wochenstatistik: {
                gesamt_einrichtungen: 0,
                gesamt_bestellungen: 0,
                durchschnitt_pro_einrichtung: 0,
                einrichtungstypen: {}
            },
            metadaten: {
                bestellfrist: null,
                lieferwoche: null,
                status: "offen",
                änderungen_erlaubt: true,
                export_historie: []
            }
        };
    }
}

module.exports = { getBestellungen }; 