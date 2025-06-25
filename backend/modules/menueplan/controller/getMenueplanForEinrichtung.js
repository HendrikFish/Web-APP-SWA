const fs = require('fs');
const path = require('path');

// Portal-Stammdaten für erweiterte Geschäftslogik
let portalStammdaten = null;

/**
 * Lädt die Portal-Stammdaten (cached)
 * @returns {Promise<object>} Portal-Stammdaten
 */
async function loadPortalStammdaten() {
    if (!portalStammdaten) {
        try {
            const stammdatenPath = path.join(__dirname, '../../../../shared/data/portal/portal-stammdaten.json');
            const data = await fs.promises.readFile(stammdatenPath, 'utf8');
            portalStammdaten = JSON.parse(data);
        } catch (error) {
            console.error('Warnung: Portal-Stammdaten konnten nicht geladen werden:', error);
            // Fallback-Konfiguration
            portalStammdaten = {
                einrichtungsregeln: {
                    regeln: {
                        intern: { sichtbare_kategorien: ["suppe", "menu1", "menu2", "dessert", "abend"] },
                        extern: { sichtbare_kategorien: ["suppe", "menu1", "menu2", "dessert"] },
                        kindergarten: { sichtbare_kategorien: ["suppe", "menu1", "menu2", "dessert"], speiseplan_basiert: true },
                        schule: { sichtbare_kategorien: ["suppe", "menu1", "menu2", "dessert"], speiseplan_basiert: true }
                    }
                },
                personengruppen_mapping: {
                    mapping: {
                        "Kindergartenkinder": "kindergarten",
                        "Schüler": "schule",
                        "Erwachsene": "extern"
                    }
                }
            };
        }
    }
    return portalStammdaten;
}

/**
 * Ermittelt den Einrichtungstyp basierend auf Personengruppe und isIntern
 * @param {object} einrichtung - Die Einrichtung
 * @returns {string} Einrichtungstyp (intern, extern, kindergarten, schule)
 */
function getEinrichtungstyp(einrichtung) {
    if (einrichtung.isIntern) {
        return 'intern';
    }
    
    const stammdaten = portalStammdaten;
    const personengruppeMapping = stammdaten?.personengruppen_mapping?.mapping || {};
    
    return personengruppeMapping[einrichtung.personengruppe] || 'extern';
}

/**
 * Lädt den Menüplan für eine spezifische Einrichtung unter Berücksichtigung der Geschäftslogik
 * 
 * Geschäftslogik:
 * 1. Interne Einrichtungen erhalten den vollen Menüplan
 * 2. Externe Einrichtungen erhalten nur die Komponenten, die in ihrem Speiseplan stehen
 * 3. Kindergärten und Schulen erhalten nur das, was in der KW.json ausgewählt wurde
 * 4. Kategorien werden basierend auf Portal-Stammdaten gefiltert
 * 
 * @param {object} req - Express Request (query: einrichtung, year, week)
 * @param {object} res - Express Response
 */
const getMenueplanForEinrichtung = async (req, res) => {
    try {
        const { einrichtung: einrichtungId, year, week } = req.query;
        
        if (!einrichtungId || !year || !week) {
            return res.status(400).json({ 
                error: 'Einrichtung, Jahr und Woche sind erforderlich' 
            });
        }

        // Einrichtungsdaten laden
        const einrichtungenPath = path.join(__dirname, '../../../../shared/data/einrichtungen/einrichtungen.json');
        const einrichtungen = JSON.parse(fs.readFileSync(einrichtungenPath, 'utf8'));
        const einrichtung = einrichtungen.find(e => e.id === einrichtungId);
        
        if (!einrichtung) {
            return res.status(404).json({ error: 'Einrichtung nicht gefunden' });
        }

        // Portal-Stammdaten laden
        const portalStammdatenPath = path.join(__dirname, '../../../../shared/data/portal/portal-stammdaten.json');
        const portalStammdaten = JSON.parse(fs.readFileSync(portalStammdatenPath, 'utf8'));
        
        // Kategorie-Stammdaten laden
        const kategorieStammdatenPath = path.join(__dirname, '../../../../shared/data/menueplaene/stammdaten.json');
        const kategorieStammdaten = JSON.parse(fs.readFileSync(kategorieStammdatenPath, 'utf8'));

        // Menüplan laden
        const menuplanPath = path.join(__dirname, `../../../../shared/data/menueplaene/${year}/${week}.json`);
        
        let menuplan;
        let isPlaceholder = false;
        
        try {
            menuplan = JSON.parse(fs.readFileSync(menuplanPath, 'utf8'));
        } catch (error) {
            // Platzhalter für nicht vorhandene Kalenderwochen
            isPlaceholder = true;
            menuplan = createPlaceholderMenuplan(year, parseInt(week));
        }

        // Regel für Einrichtung bestimmen
        let regel = 'extern'; // Standard für externe Einrichtungen
        
        if (einrichtung.isIntern) {
            regel = 'intern';
        } else if (portalStammdaten.personengruppen_mapping.mapping[einrichtung.personengruppe]) {
            regel = portalStammdaten.personengruppen_mapping.mapping[einrichtung.personengruppe];
        }

        const einrichtungsregel = portalStammdaten.einrichtungsregeln.regeln[regel];
        
        if (!einrichtungsregel) {
            return res.status(500).json({ error: `Keine Regel für Einrichtungstyp '${regel}' gefunden` });
        }
        
        console.log(`📋 Verwende Regel '${regel}' für Einrichtung ${einrichtung.name}`);
        console.log(`🏷️ Sichtbare Kategorien:`, einrichtungsregel.sichtbare_kategorien);
        
        // Menüplan für Einrichtung filtern und anpassen
        const gefiltererMenuplan = {
            ...menuplan,
            days: {}
        };

        const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
        
        for (const tag of wochentage) {
            const tagData = menuplan.days[tag];
            
            // GESCHÄFTSLOGIK: Snapshot-Prinzip - verwende historische Einrichtungseinstellungen falls vorhanden
            let tagSpeiseplan;
            if (menuplan.einrichtungsSnapshot?.einrichtungen) {
                const snapshotEinrichtung = menuplan.einrichtungsSnapshot.einrichtungen.find(e => e.id === einrichtungId);
                tagSpeiseplan = snapshotEinrichtung?.speiseplan[tag];
                console.log(`📸 Verwende Snapshot-Speiseplan für ${tag}: suppe=${tagSpeiseplan?.suppe}, hauptspeise=${tagSpeiseplan?.hauptspeise}`);
            } else {
                tagSpeiseplan = einrichtung.speiseplan[tag];
                console.log(`📋 Verwende aktuelle Einrichtungseinstellungen für ${tag}: suppe=${tagSpeiseplan?.suppe}, hauptspeise=${tagSpeiseplan?.hauptspeise}`);
            }
            
            if (!tagData) continue;

            const gefiltererTag = {
                Mahlzeiten: {},
                Zuweisungen: tagData.Zuweisungen || {}
            };

            // Menu-Vereinigung für externe Einrichtungen (Menu1/Menu2 → Menu)
            let menuAdded = false;
            
            // Kategorien basierend auf Einrichtungsregeln filtern
            for (const kategorie of einrichtungsregel.sichtbare_kategorien) {
                if (!tagData.Mahlzeiten[kategorie]) continue;

                // Spezielle Behandlung für externe Einrichtungen
                if (!einrichtung.isIntern) {
                    // Hauptspeise-Logik: Menu1 und Menu2 zu einem "Menü" vereinen
                    if (kategorie === 'menu1' || kategorie === 'menu2') {
                        if (!tagSpeiseplan?.hauptspeise || menuAdded) continue;
                        
                        // Prüfen welches Menü der Einrichtung zugewiesen ist
                        const hatMenu1 = tagData.Zuweisungen.menu1?.includes(einrichtungId);
                        const hatMenu2 = tagData.Zuweisungen.menu2?.includes(einrichtungId);
                        
                        if (hatMenu1) {
                            // Menu1 als "menu" anzeigen
                            gefiltererTag.Mahlzeiten['menu'] = tagData.Mahlzeiten.menu1;
                            menuAdded = true;
                        } else if (hatMenu2) {
                            // Menu2 als "menu" anzeigen  
                            gefiltererTag.Mahlzeiten['menu'] = tagData.Mahlzeiten.menu2;
                            menuAdded = true;
                        } else if (kategorie === 'menu1') {
                            // Platzhalter wenn keine Auswahl getroffen
                            gefiltererTag.Mahlzeiten['menu'] = isPlaceholder ? [] : [{
                                id: 'placeholder-menu',
                                name: 'Noch keine Auswahl getroffen',
                                isPlaceholder: true
                            }];
                            menuAdded = true;
                        }
                        continue;
                    }
                    
                    // Andere Kategorien prüfen (nur für speiseplan_basierte Regeln)
                    if (einrichtungsregel.speiseplan_basiert) {
                        if (kategorie === 'suppe' && !tagSpeiseplan?.suppe) continue;
                        if (kategorie === 'dessert' && !tagSpeiseplan?.dessert) continue;
                    }
                }

                gefiltererTag.Mahlzeiten[kategorie] = tagData.Mahlzeiten[kategorie] || [];
            }

            gefiltererMenuplan.days[tag] = gefiltererTag;
        }

        // Kategorie-Definitionen hinzufügen (für Display-Namen und Icons)
        const kategorieMap = {};
        kategorieStammdaten.kategorien.forEach(kat => {
            kategorieMap[kat.id] = kat.name;
        });
        
        // Spezielle Kategorie für vereintes Menü hinzufügen
        kategorieMap['menu'] = 'Menü';

        res.json({
            menuplan: gefiltererMenuplan,
            einrichtung: {
                id: einrichtung.id,
                name: einrichtung.name,
                isIntern: einrichtung.isIntern,
                personengruppe: einrichtung.personengruppe
            },
            kategorien: kategorieMap,
            regel: regel,
            isPlaceholder: isPlaceholder
        });

    } catch (error) {
        console.error('Fehler beim Laden des Menüplans:', error);
        res.status(500).json({ error: 'Fehler beim Laden des Menüplans' });
    }
};

function createPlaceholderMenuplan(year, week) {
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const kategorien = ['suppe', 'menu1', 'menu2', 'dessert', 'abend-suppe', 'milchspeise', 'normalkost', 'kalte-platte', 'wurstbrot-toast', 'wurstbrot-schwarzbrot', 'kaesebrot-toast', 'kaesebrot-schwarzbrot'];
    
    const placeholder = {
        year: year,
        week: week,
        days: {}
    };
    
    for (const tag of wochentage) {
        placeholder.days[tag] = {
            Mahlzeiten: {},
            Zuweisungen: {
                menu1: [],
                menu2: []
            }
        };
        
        for (const kategorie of kategorien) {
            placeholder.days[tag].Mahlzeiten[kategorie] = [];
        }
    }
    
    return placeholder;
}

module.exports = getMenueplanForEinrichtung; 