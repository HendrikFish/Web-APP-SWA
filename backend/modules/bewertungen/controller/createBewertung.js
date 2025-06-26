const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Erstellt eine neue Bewertung
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 */
async function createBewertung(req, res) {
    try {
        const {
            kalenderwoche,
            jahr,
            tag,
            kategorie,
            rezepte,
            geschmack,
            optik,
            verbesserungsvorschlag,
            menueplan_datum,
            einrichtung_id,
            einrichtung_name
        } = req.body;

        // Input-Validierung
        if (!kalenderwoche || !jahr || !tag || !kategorie || !rezepte || 
            !geschmack || !optik || !verbesserungsvorschlag || !menueplan_datum ||
            !einrichtung_id || !einrichtung_name) {
            return res.status(400).json({
                success: false,
                message: 'Alle Pflichtfelder müssen ausgefüllt werden'
            });
        }

        // Zeitfenster-Validierung (letzte 10 Tage)
        const heute = new Date();
        const menueplanDatum = new Date(menueplan_datum);
        const zehnTageZurueck = new Date();
        zehnTageZurueck.setDate(heute.getDate() - 10);

        if (menueplanDatum < zehnTageZurueck || menueplanDatum > heute) {
            return res.status(400).json({
                success: false,
                message: 'Bewertungen sind nur für die letzten 10 Tage bis heute möglich'
            });
        }

        // Bewertungswerte validieren
        if (geschmack < 1 || geschmack > 5 || optik < 1 || optik > 5) {
            return res.status(400).json({
                success: false,
                message: 'Bewertungen müssen zwischen 1 und 5 Sternen liegen'
            });
        }

        // Verbesserungsvorschlag-Länge prüfen
        if (verbesserungsvorschlag.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Verbesserungsvorschläge müssen mindestens 10 Zeichen lang sein'
            });
        }

        // Benutzerinformationen aus Authentication
        const benutzer = req.user;

        // Bewertungsdatei-Pfad
        const bewertungDateiPfad = path.join(
            __dirname, 
            '../../../shared/data/portal/bewertungen',
            jahr.toString(),
            `${kalenderwoche}.json`
        );

        // Verzeichnis erstellen falls nicht vorhanden
        const verzeichnisPfad = path.dirname(bewertungDateiPfad);
        await fs.mkdir(verzeichnisPfad, { recursive: true });

        // Bestehende Bewertungen laden oder leere Struktur erstellen
        let bewertungenData;
        try {
            const existingData = await fs.readFile(bewertungDateiPfad, 'utf8');
            bewertungenData = JSON.parse(existingData);
        } catch (error) {
            // Datei existiert nicht, neue erstellen
            bewertungenData = {
                kalenderwoche: parseInt(kalenderwoche),
                jahr: parseInt(jahr),
                erstellt_am: new Date().toISOString(),
                bewertungen: {
                    montag: {},
                    dienstag: {},
                    mittwoch: {},
                    donnerstag: {},
                    freitag: {},
                    samstag: {},
                    sonntag: {}
                }
            };
        }

        // Prüfen ob Benutzer bereits für diese Kategorie/Tag bewertet hat
        const tagBewertungen = bewertungenData.bewertungen[tag] || {};
        const kategorieBewertungen = tagBewertungen[kategorie] || [];
        
        const bereitsBewertet = kategorieBewertungen.some(
            bewertung => bewertung.benutzer_id === benutzer.id
        );

        if (bereitsBewertet) {
            return res.status(400).json({
                success: false,
                message: 'Sie haben diese Kategorie für diesen Tag bereits bewertet'
            });
        }

        // Neue Bewertung erstellen
        const neueBewertung = {
            id: uuidv4(),
            benutzer_id: benutzer.id,
            benutzer_name: benutzer.name || benutzer.email,
            einrichtung_id,
            einrichtung_name,
            rezepte: Array.isArray(rezepte) ? rezepte : [rezepte],
            geschmack: parseInt(geschmack),
            optik: parseInt(optik),
            verbesserungsvorschlag: verbesserungsvorschlag.trim(),
            timestamp: new Date().toISOString(),
            menueplan_datum
        };

        // Bewertung zur Struktur hinzufügen
        if (!bewertungenData.bewertungen[tag]) {
            bewertungenData.bewertungen[tag] = {};
        }
        if (!bewertungenData.bewertungen[tag][kategorie]) {
            bewertungenData.bewertungen[tag][kategorie] = [];
        }

        bewertungenData.bewertungen[tag][kategorie].push(neueBewertung);

        // Datei speichern
        await fs.writeFile(
            bewertungDateiPfad, 
            JSON.stringify(bewertungenData, null, 2), 
            'utf8'
        );

        console.log(`✅ Neue Bewertung erstellt: ${neueBewertung.id} für ${kategorie} am ${tag}`);

        res.status(201).json({
            success: true,
            message: 'Bewertung erfolgreich erstellt',
            bewertung: neueBewertung
        });

    } catch (error) {
        console.error('Fehler beim Erstellen der Bewertung:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Erstellen der Bewertung'
        });
    }
}

module.exports = { createBewertung }; 