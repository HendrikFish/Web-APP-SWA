const fs = require('fs').promises;
const path = require('path');

/**
 * Aktualisiert den Einrichtungs-Snapshot in einem bestehenden Menüplan
 * mit den aktuellen Stammdaten aus einrichtungen.json
 */
const updateEinrichtungsSnapshot = async (req, res) => {
    try {
        const { year, week } = req.params;
        
        if (!year || !week) {
            return res.status(400).json({ 
                error: 'Jahr und Woche sind erforderlich' 
            });
        }

        // Prüfen ob Menüplan existiert
        const menuplanPath = path.join(__dirname, `../../../../shared/data/menueplaene/${year}/${week}.json`);
        
        let menuplan;
        try {
            const data = await fs.readFile(menuplanPath, 'utf8');
            menuplan = JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({ error: 'Menüplan für diese Woche nicht gefunden' });
            }
            throw error;
        }

        // Aktuelle Einrichtungen laden
        const einrichtungenPath = path.join(__dirname, '../../../../shared/data/einrichtungen/einrichtungen.json');
        const einrichtungen = JSON.parse(await fs.readFile(einrichtungenPath, 'utf8'));
        
        // Menüplan-Stammdaten laden
        const stammdatenPath = path.join(__dirname, '../../../../shared/data/menueplaene/stammdaten.json');
        const stammdaten = JSON.parse(await fs.readFile(stammdatenPath, 'utf8'));

        // Neuen Snapshot erstellen
        const neuerSnapshot = {
            einrichtungen: [],
            generatedAt: new Date().toISOString(),
            categories: stammdaten.kategorien.map(kat => ({ id: kat.id, name: kat.name })),
            updatedBy: {
                userId: req.user?.id || 'unknown',
                name: req.user?.name || 'unknown',
                action: 'snapshot_update'
            }
        };

        einrichtungen.forEach(einrichtung => {
            const einrichtungSnapshot = {
                id: einrichtung.id,
                name: einrichtung.name,
                kuerzel: einrichtung.kuerzel,
                isIntern: einrichtung.isIntern || false,
                speiseplan: einrichtung.speiseplan || {},
                snapshotMetadata: {
                    originalDataTimestamp: einrichtung.updatedAt || einrichtung.createdAt || null,
                    snapshotUpdatedAt: new Date().toISOString()
                }
            };
            neuerSnapshot.einrichtungen.push(einrichtungSnapshot);
        });

        // Menüplan mit neuem Snapshot aktualisieren
        const aktualisiertermenuplan = {
            ...menuplan,
            einrichtungsSnapshot: neuerSnapshot,
            updatedAt: new Date().toISOString(),
            updatedBy: {
                userId: req.user?.id || 'unknown',
                name: req.user?.name || 'unknown',
                action: 'snapshot_update'
            }
        };

        // Aktualisierte Datei speichern
        await fs.writeFile(menuplanPath, JSON.stringify(aktualisiertermenuplan, null, 2), 'utf8');
        
        res.json({ 
            message: 'Einrichtungs-Snapshot erfolgreich aktualisiert',
            snapshot: neuerSnapshot,
            affectedWeek: { year: parseInt(year), week: parseInt(week) }
        });

    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Einrichtungs-Snapshots' });
    }
};

module.exports = updateEinrichtungsSnapshot; 