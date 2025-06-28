const fs = require('fs').promises;
const path = require('path');

/**
 * Speichert Bestellungen für eine spezifische Kalenderwoche
 * @param {object} req - Express Request mit Jahr, Woche und Bestellungsdaten
 * @param {object} res - Express Response
 */
async function saveBestellungen(req, res) {
    try {
        const { year, week } = req.params;
        const { 
            einrichtung_id, 
            bestellungen: bestellungsData,
            user_info = {}
        } = req.body;
        
        // Input-Validierung
        if (!year || !week || !einrichtung_id || !bestellungsData) {
            return res.status(400).json({
                success: false,
                message: 'Jahr, Kalenderwoche, Einrichtungs-ID und Bestellungsdaten sind erforderlich'
            });
        }

        // Pfad zur Bestellungsdatei
        const bestellungsdateiPfad = path.join(
            __dirname, 
            '../../../../shared/data/portal/bestellungen',
            year.toString(),
            `${week.toString().padStart(2, '0')}.json`
        );

        // Verzeichnis erstellen falls nicht vorhanden
        const verzeichnisPfad = path.dirname(bestellungsdateiPfad);
        await fs.mkdir(verzeichnisPfad, { recursive: true });

        let bestellungenGesamt;

        // Bestehende Bestellungsdatei laden oder neue erstellen
        try {
            const existierenderInhalt = await fs.readFile(bestellungsdateiPfad, 'utf-8');
            bestellungenGesamt = JSON.parse(existierenderInhalt);
        } catch (error) {
            // Datei existiert nicht - neue Struktur erstellen
            bestellungenGesamt = await createEmptyBestellungsstruktur(year, week);
        }

        // Bestellungen für die spezifische Einrichtung aktualisieren
        if (!bestellungenGesamt.einrichtungen[einrichtung_id]) {
            bestellungenGesamt.einrichtungen[einrichtung_id] = {
                info: {
                    id: einrichtung_id,
                    name: req.body.einrichtung_name || "Unbekannte Einrichtung",
                    typ: req.body.einrichtung_typ || "extern",
                    gruppen: req.body.gruppen || []
                },
                tage: {},
                wochenstatistik: {
                    gesamt_bestellungen: 0,
                    durchschnitt_pro_tag: 0,
                    höchster_tag: "",
                    niedrigster_tag: ""
                },
                bestellhistorie: []
            };
        }

        // User-Tracking in Bestellhistorie
        if (user_info.user_id) {
            const bestellungenAnzahl = Object.keys(bestellungsData).reduce((total, day) => {
                return total + Object.keys(bestellungsData[day] || {}).reduce((dayTotal, kategorie) => {
                    return dayTotal + Object.values(bestellungsData[day][kategorie] || {}).reduce((sum, anzahl) => sum + (anzahl || 0), 0);
                }, 0);
            }, 0);

            const historyEntry = {
                timestamp: new Date().toISOString(),
                user_id: user_info.user_id,
                username: user_info.username || 'Unbekannt',
                name: user_info.name || 'Unbekannter Benutzer',
                action: 'bestellung_gespeichert',
                bestellungen_anzahl: bestellungenAnzahl,
                ip_address: req.ip || req.connection.remoteAddress || 'unbekannt'
            };
            
            // Historie-Array initialisieren falls nicht vorhanden
            if (!bestellungenGesamt.einrichtungen[einrichtung_id].bestellhistorie) {
                bestellungenGesamt.einrichtungen[einrichtung_id].bestellhistorie = [];
            }
            
            // Neue Historie hinzufügen (max. 50 Einträge behalten)
            bestellungenGesamt.einrichtungen[einrichtung_id].bestellhistorie.unshift(historyEntry);
            if (bestellungenGesamt.einrichtungen[einrichtung_id].bestellhistorie.length > 50) {
                bestellungenGesamt.einrichtungen[einrichtung_id].bestellhistorie = 
                    bestellungenGesamt.einrichtungen[einrichtung_id].bestellhistorie.slice(0, 50);
            }
        }

        // Bestellungsdaten in die Struktur integrieren
        bestellungenGesamt.einrichtungen[einrichtung_id].tage = bestellungsData;
        bestellungenGesamt.letzte_änderung = new Date().toISOString();
        
        // Einrichtungsinfo aktualisieren
        bestellungenGesamt.einrichtungen[einrichtung_id].info = {
            ...bestellungenGesamt.einrichtungen[einrichtung_id].info,
            name: req.body.einrichtung_name || bestellungenGesamt.einrichtungen[einrichtung_id].info.name,
            typ: req.body.einrichtung_typ || bestellungenGesamt.einrichtungen[einrichtung_id].info.typ,
            gruppen: req.body.gruppen || bestellungenGesamt.einrichtungen[einrichtung_id].info.gruppen,
            letzte_aktualisierung: new Date().toISOString()
        };

        // Statistiken neu berechnen
        bestellungenGesamt = calculateStatistics(bestellungenGesamt);

        // Datei speichern
        await fs.writeFile(
            bestellungsdateiPfad, 
            JSON.stringify(bestellungenGesamt, null, 2), 
            'utf-8'
        );

        res.json({
            success: true,
            message: `Bestellungen für ${req.body.einrichtung_name || einrichtung_id} in KW ${week}/${year} gespeichert`,
            gespeichert_am: bestellungenGesamt.letzte_änderung
        });

    } catch (error) {
        console.error('Fehler beim Speichern der Bestellungen:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Speichern der Bestellungen'
        });
    }
}

/**
 * Erstellt eine leere Bestellungsstruktur
 * @param {string} year - Jahr
 * @param {string} week - Kalenderwoche
 * @returns {object} Leere Bestellungsstruktur
 */
async function createEmptyBestellungsstruktur(year, week) {
    try {
        const vorlagePfad = path.join(
            __dirname, 
            '../../../../shared/data/portal/bestellungen/vorlage.json'
        );
        
        const vorlageData = await fs.readFile(vorlagePfad, 'utf-8');
        const vorlage = JSON.parse(vorlageData);
        
        const struktur = {
            ...vorlage,
            year: parseInt(year),
            week: parseInt(week),
            erstellt_am: new Date().toISOString(),
            letzte_änderung: new Date().toISOString()
        };
        
        // _vorlage_hinweise entfernen
        delete struktur._vorlage_hinweise;
        
        return struktur;
        
    } catch (error) {
        console.error('Fehler beim Erstellen der Bestellungsstruktur:', error);
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

/**
 * Berechnet Statistiken für die Bestellungsdatei
 * @param {object} bestellungen - Bestellungsstruktur
 * @returns {object} Aktualisierte Bestellungsstruktur mit Statistiken
 */
function calculateStatistics(bestellungen) {
    let gesamtEinrichtungen = Object.keys(bestellungen.einrichtungen).length;
    let gesamtBestellungen = 0;
    let einrichtungstypen = {};

    // Statistiken für jede Einrichtung berechnen
    Object.values(bestellungen.einrichtungen).forEach(einrichtung => {
        let einrichtungsBestellungen = 0;
        let tageStatistik = {};

        // Typ zählen
        const typ = einrichtung.info.typ || 'unbekannt';
        einrichtungstypen[typ] = (einrichtungstypen[typ] || 0) + 1;

        // Bestellungen pro Tag berechnen
        Object.entries(einrichtung.tage).forEach(([tag, tagData]) => {
            let tagBestellungen = 0;
            Object.values(tagData).forEach(kategorie => {
                Object.values(kategorie).forEach(anzahl => {
                    tagBestellungen += anzahl;
                });
            });
            tageStatistik[tag] = tagBestellungen;
            einrichtungsBestellungen += tagBestellungen;
        });

        // Einrichtungsstatistiken aktualisieren
        einrichtung.wochenstatistik = {
            gesamt_bestellungen: einrichtungsBestellungen,
            durchschnitt_pro_tag: einrichtungsBestellungen / Math.max(Object.keys(einrichtung.tage).length, 1),
            höchster_tag: Object.keys(tageStatistik).reduce((a, b) => tageStatistik[a] > tageStatistik[b] ? a : b, ''),
            niedrigster_tag: Object.keys(tageStatistik).reduce((a, b) => tageStatistik[a] < tageStatistik[b] ? a : b, '')
        };

        gesamtBestellungen += einrichtungsBestellungen;
    });

    // Wochenstatistiken aktualisieren
    bestellungen.wochenstatistik = {
        gesamt_einrichtungen: gesamtEinrichtungen,
        gesamt_bestellungen: gesamtBestellungen,
        durchschnitt_pro_einrichtung: gesamtBestellungen / Math.max(gesamtEinrichtungen, 1),
        einrichtungstypen
    };

    return bestellungen;
}

module.exports = { saveBestellungen }; 