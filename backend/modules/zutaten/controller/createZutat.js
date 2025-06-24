const fs = require('fs').promises;
const path = require('path');

// Robuster Pfad zur zutaten.json-Datei, relativ zur aktuellen Datei
const zutatenDataPath = path.join(__dirname, '../../../../shared/data/zutaten/zutaten.json');

/**
 * Erstellt eine neue Zutat, fügt sie zur JSON-Datei hinzu und speichert sie.
 * @param {object} req - Das Express-Request-Objekt mit den Zutatendaten im Body.
 * @param {object} res - Das Express-Response-Objekt.
 */
async function createZutat(req, res) {
    try {
        const { name, kategorie, lieferant, preis, allergene, herkunft, naehrwerte } = req.body;

        // Pflichtfelder validieren
        if (!name || !kategorie || !lieferant || !preis || !preis.umrechnungsfaktor || !herkunft) {
            return res.status(400).json({ message: 'Fehlende Pflichtfelder. Stellen Sie sicher, dass Name, Kategorie, Lieferant, Preisdetails und Herkunft angegeben sind.' });
        }

        // 1. Bestehende Zutaten lesen
        const data = await fs.readFile(zutatenDataPath, 'utf-8');
        const alleZutaten = JSON.parse(data);

        // 2. Neue, fortlaufende zutatennummer berechnen
        const letzteNummer = alleZutaten.reduce((max, zutat) => {
            return zutat.zutatennummer > max ? zutat.zutatennummer : max;
        }, 0);
        const neueNummer = letzteNummer + 1;

        // 3. Zutat mit der neuen, sauberen Struktur erstellen
        const finaleZutat = {
            name,
            kategorie,
            lieferant,
            preis: {
                basis: preis.basis,
                basiseinheit: preis.basiseinheit,
                verwendungseinheit: preis.verwendungseinheit,
                umrechnungsfaktor: preis.umrechnungsfaktor
            },
            herkunft: herkunft,
            allergene: allergene || [],
            naehrwerte: naehrwerte || {},
            id: `zutat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            zutatennummer: neueNummer,
            isActive: true
        };

        // 4. Neue Zutat zur Liste hinzufügen
        alleZutaten.push(finaleZutat);

        // 5. Die gesamte Liste "pretty-printed" zurück in die Datei schreiben
        await fs.writeFile(zutatenDataPath, JSON.stringify(alleZutaten, null, 2), 'utf-8');

        // 6. Erfolgsantwort mit den neuen Daten senden
        res.status(201).json(finaleZutat);

    } catch (error) {
        console.error('Fehler beim Erstellen der Zutat:', error);
        res.status(500).json({ message: 'Serverfehler beim Erstellen der Zutat.' });
    }
}

module.exports = createZutat; 